package bindings

import (
	"fmt"

	"github.com/sequelbook/sequelbook/core/book"
	"github.com/sequelbook/sequelbook/core/settings"
	"github.com/wailsapp/wails/v3/pkg/application"
)

// BookService exposes book management to the Wails frontend.
type BookService struct {
	store    *book.Store
	settings *settings.Store
	app      *application.App
}

// NewBookService creates a BookService with injected dependencies.
func NewBookService(store *book.Store, settingsStore *settings.Store, app *application.App) *BookService {
	return &BookService{store: store, settings: settingsStore, app: app}
}

// ── File I/O ──────────────────────────────────────────────────────────────────

// OpenBook reads a .sql file, parses it, and registers the book.
func (s *BookService) OpenBook(path string) (*book.OpenBook, error) {
	return s.store.Open(path)
}

// CreateBook makes a new empty book with the given title.
// Auto-assigns a file path in the books directory for persistence.
func (s *BookService) CreateBook(title string) *book.OpenBook {
	ob := s.store.Create(title)
	booksDir := s.settings.GetBooksDir()
	ob.FilePath = book.AutoSavePath(booksDir, ob.Book.ID)
	return ob
}

// RenameBook updates the book's title in memory and marks it dirty.
func (s *BookService) RenameBook(bookID, title string) error {
	ob, ok := s.store.Get(bookID)
	if !ok {
		return fmt.Errorf("book not found: %s", bookID)
	}
	ob.Book.Title = title
	s.store.MarkDirty(bookID)
	return nil
}

// SaveBook serializes and writes the book to its current file path.
// Returns an error if the book has no path (use SaveBookAs instead).
func (s *BookService) SaveBook(bookID string) error {
	return s.store.Save(bookID)
}

// SaveBookAs serializes and writes the book to the given path.
func (s *BookService) SaveBookAs(bookID, path string) error {
	return s.store.SaveAs(bookID, path)
}

// CloseBook removes the book from the open books map.
func (s *BookService) CloseBook(bookID string) {
	s.store.Close(bookID)
}

// DeleteBook permanently deletes the book file from disk and removes it from memory.
func (s *BookService) DeleteBook(bookID string) error {
	return s.store.Delete(bookID)
}

// GetBook retrieves an open book by ID.
func (s *BookService) GetBook(bookID string) (*book.OpenBook, error) {
	ob, ok := s.store.Get(bookID)
	if !ok {
		return nil, fmt.Errorf("book not found: %s", bookID)
	}
	return ob, nil
}

// ListBooks returns all currently open books.
func (s *BookService) ListBooks() []*book.OpenBook {
	return s.store.List()
}

// LoadBooksDir loads all .sql files from the configured books directory.
func (s *BookService) LoadBooksDir() error {
	return s.store.LoadDir(s.settings.GetBooksDir())
}

// SaveAllDirty persists all open books that have been modified since last save.
func (s *BookService) SaveAllDirty() error {
	return s.store.SaveAllDirty()
}

// ── File Dialogs ──────────────────────────────────────────────────────────────

// OpenFileDialog shows a native open-file picker filtered to *.sql files.
// Returns the selected path, or an empty string if cancelled.
func (s *BookService) OpenFileDialog() (string, error) {
	return s.app.Dialog.OpenFile().
		AddFilter("SequelBook files", "*.sql").
		PromptForSingleSelection()
}

// SaveFileDialog shows a native save-file picker filtered to *.sql files.
// Returns the chosen path, or an empty string if cancelled.
func (s *BookService) SaveFileDialog() (string, error) {
	return s.app.Dialog.SaveFile().
		AddFilter("SequelBook files", "*.sql").
		PromptForSingleSelection()
}

// ── Chapter mutations ─────────────────────────────────────────────────────────

// AddChapter appends a new chapter to the book.
func (s *BookService) AddChapter(bookID, title string) (*book.Chapter, error) {
	ob, err := s.GetBook(bookID)
	if err != nil {
		return nil, err
	}
	if title == "" {
		title = "Untitled"
	}
	ch := book.Chapter{
		ID:    book.NewChapterID(),
		Title: title,
		Sections: []book.Section{
			{ID: book.NewSectionID(), Title: "Untitled"},
		},
	}
	ob.Book.Chapters = append(ob.Book.Chapters, ch)
	s.store.MarkDirty(bookID)
	return &ch, nil
}

// RemoveChapter removes a chapter from the book.
func (s *BookService) RemoveChapter(bookID, chapterID string) error {
	ob, err := s.GetBook(bookID)
	if err != nil {
		return err
	}
	chapters, found := filterChapters(ob.Book.Chapters, chapterID)
	if !found {
		return fmt.Errorf("chapter not found: %s", chapterID)
	}
	ob.Book.Chapters = chapters
	s.store.MarkDirty(bookID)
	return nil
}

// RenameChapter sets a new title on a chapter.
func (s *BookService) RenameChapter(bookID, chapterID, title string) error {
	ob, err := s.GetBook(bookID)
	if err != nil {
		return err
	}
	for i := range ob.Book.Chapters {
		if ob.Book.Chapters[i].ID == chapterID {
			ob.Book.Chapters[i].Title = title
			s.store.MarkDirty(bookID)
			return nil
		}
	}
	return fmt.Errorf("chapter not found: %s", chapterID)
}

// ReorderChapters reorders chapters according to the given slice of IDs.
// All existing chapter IDs must be present; extras are ignored.
func (s *BookService) ReorderChapters(bookID string, chapterIDs []string) error {
	ob, err := s.GetBook(bookID)
	if err != nil {
		return err
	}
	idx := make(map[string]book.Chapter, len(ob.Book.Chapters))
	for _, ch := range ob.Book.Chapters {
		idx[ch.ID] = ch
	}
	reordered := make([]book.Chapter, 0, len(chapterIDs))
	for _, id := range chapterIDs {
		ch, ok := idx[id]
		if !ok {
			return fmt.Errorf("chapter not found: %s", id)
		}
		reordered = append(reordered, ch)
	}
	ob.Book.Chapters = reordered
	s.store.MarkDirty(bookID)
	return nil
}

// ── Section mutations ─────────────────────────────────────────────────────────

// AddSection appends a new section to the given chapter.
func (s *BookService) AddSection(bookID, chapterID, title string) (*book.Section, error) {
	ob, err := s.GetBook(bookID)
	if err != nil {
		return nil, err
	}
	if title == "" {
		title = "Untitled"
	}
	sec := book.Section{ID: book.NewSectionID(), Title: title}
	for i := range ob.Book.Chapters {
		if ob.Book.Chapters[i].ID == chapterID {
			ob.Book.Chapters[i].Sections = append(ob.Book.Chapters[i].Sections, sec)
			s.store.MarkDirty(bookID)
			return &sec, nil
		}
	}
	return nil, fmt.Errorf("chapter not found: %s", chapterID)
}

// RemoveSection removes a section from the given chapter.
func (s *BookService) RemoveSection(bookID, chapterID, sectionID string) error {
	ob, err := s.GetBook(bookID)
	if err != nil {
		return err
	}
	for i := range ob.Book.Chapters {
		if ob.Book.Chapters[i].ID != chapterID {
			continue
		}
		sections, found := filterSections(ob.Book.Chapters[i].Sections, sectionID)
		if !found {
			return fmt.Errorf("section not found: %s", sectionID)
		}
		ob.Book.Chapters[i].Sections = sections
		s.store.MarkDirty(bookID)
		return nil
	}
	return fmt.Errorf("chapter not found: %s", chapterID)
}

// RenameSection sets a new title on a section.
func (s *BookService) RenameSection(bookID, chapterID, sectionID, title string) error {
	ob, err := s.GetBook(bookID)
	if err != nil {
		return err
	}
	for i := range ob.Book.Chapters {
		if ob.Book.Chapters[i].ID != chapterID {
			continue
		}
		for j := range ob.Book.Chapters[i].Sections {
			if ob.Book.Chapters[i].Sections[j].ID == sectionID {
				ob.Book.Chapters[i].Sections[j].Title = title
				s.store.MarkDirty(bookID)
				return nil
			}
		}
		return fmt.Errorf("section not found: %s", sectionID)
	}
	return fmt.Errorf("chapter not found: %s", chapterID)
}

// ── Block mutations ───────────────────────────────────────────────────────────

// AddBlock inserts a new block into a section at the given position.
// If position < 0 or >= len(blocks), the block is appended.
func (s *BookService) AddBlock(bookID, chapterID, sectionID string, blockType book.BlockType, position int) (*book.Block, error) {
	ob, err := s.GetBook(bookID)
	if err != nil {
		return nil, err
	}
	blk := book.Block{ID: book.NewBlockID(), Type: blockType}
	for i := range ob.Book.Chapters {
		if ob.Book.Chapters[i].ID != chapterID {
			continue
		}
		for j := range ob.Book.Chapters[i].Sections {
			if ob.Book.Chapters[i].Sections[j].ID != sectionID {
				continue
			}
			blocks := ob.Book.Chapters[i].Sections[j].Blocks
			if position < 0 || position >= len(blocks) {
				blocks = append(blocks, blk)
			} else {
				blocks = append(blocks, book.Block{})
				copy(blocks[position+1:], blocks[position:])
				blocks[position] = blk
			}
			ob.Book.Chapters[i].Sections[j].Blocks = blocks
			s.store.MarkDirty(bookID)
			return &blk, nil
		}
		return nil, fmt.Errorf("section not found: %s", sectionID)
	}
	return nil, fmt.Errorf("chapter not found: %s", chapterID)
}

// UpdateBlock replaces a block's content.
func (s *BookService) UpdateBlock(bookID, chapterID, sectionID, blockID, content string) error {
	ob, err := s.GetBook(bookID)
	if err != nil {
		return err
	}
	for i := range ob.Book.Chapters {
		if ob.Book.Chapters[i].ID != chapterID {
			continue
		}
		for j := range ob.Book.Chapters[i].Sections {
			if ob.Book.Chapters[i].Sections[j].ID != sectionID {
				continue
			}
			for k := range ob.Book.Chapters[i].Sections[j].Blocks {
				if ob.Book.Chapters[i].Sections[j].Blocks[k].ID == blockID {
					ob.Book.Chapters[i].Sections[j].Blocks[k].Content = content
					s.store.MarkDirty(bookID)
					return nil
				}
			}
			return fmt.Errorf("block not found: %s", blockID)
		}
		return fmt.Errorf("section not found: %s", sectionID)
	}
	return fmt.Errorf("chapter not found: %s", chapterID)
}

// UpdateBlockPageSize sets a query block's page size for result pagination.
func (s *BookService) UpdateBlockPageSize(bookID, chapterID, sectionID, blockID string, pageSize int) error {
	ob, err := s.GetBook(bookID)
	if err != nil {
		return err
	}
	for i := range ob.Book.Chapters {
		if ob.Book.Chapters[i].ID != chapterID {
			continue
		}
		for j := range ob.Book.Chapters[i].Sections {
			if ob.Book.Chapters[i].Sections[j].ID != sectionID {
				continue
			}
			for k := range ob.Book.Chapters[i].Sections[j].Blocks {
				if ob.Book.Chapters[i].Sections[j].Blocks[k].ID == blockID {
					ob.Book.Chapters[i].Sections[j].Blocks[k].PageSize = pageSize
					s.store.MarkDirty(bookID)
					return nil
				}
			}
			return fmt.Errorf("block not found: %s", blockID)
		}
		return fmt.Errorf("section not found: %s", sectionID)
	}
	return fmt.Errorf("chapter not found: %s", chapterID)
}

// RemoveBlock removes a block from a section.
func (s *BookService) RemoveBlock(bookID, chapterID, sectionID, blockID string) error {
	ob, err := s.GetBook(bookID)
	if err != nil {
		return err
	}
	for i := range ob.Book.Chapters {
		if ob.Book.Chapters[i].ID != chapterID {
			continue
		}
		for j := range ob.Book.Chapters[i].Sections {
			if ob.Book.Chapters[i].Sections[j].ID != sectionID {
				continue
			}
			blocks, found := filterBlocks(ob.Book.Chapters[i].Sections[j].Blocks, blockID)
			if !found {
				return fmt.Errorf("block not found: %s", blockID)
			}
			ob.Book.Chapters[i].Sections[j].Blocks = blocks
			s.store.MarkDirty(bookID)
			return nil
		}
		return fmt.Errorf("section not found: %s", sectionID)
	}
	return fmt.Errorf("chapter not found: %s", chapterID)
}

// MoveBlock moves a block to a new position within its section.
// newPosition is 0-based and clamped to valid range.
func (s *BookService) MoveBlock(bookID, chapterID, sectionID, blockID string, newPosition int) error {
	ob, err := s.GetBook(bookID)
	if err != nil {
		return err
	}
	for i := range ob.Book.Chapters {
		if ob.Book.Chapters[i].ID != chapterID {
			continue
		}
		for j := range ob.Book.Chapters[i].Sections {
			if ob.Book.Chapters[i].Sections[j].ID != sectionID {
				continue
			}
			blocks := ob.Book.Chapters[i].Sections[j].Blocks
			oldIdx := -1
			for k, b := range blocks {
				if b.ID == blockID {
					oldIdx = k
					break
				}
			}
			if oldIdx == -1 {
				return fmt.Errorf("block not found: %s", blockID)
			}
			if newPosition < 0 {
				newPosition = 0
			}
			if newPosition >= len(blocks) {
				newPosition = len(blocks) - 1
			}
			blk := blocks[oldIdx]
			// Remove from old position.
			blocks = append(blocks[:oldIdx], blocks[oldIdx+1:]...)
			// Insert at new position.
			blocks = append(blocks, book.Block{})
			copy(blocks[newPosition+1:], blocks[newPosition:])
			blocks[newPosition] = blk
			ob.Book.Chapters[i].Sections[j].Blocks = blocks
			s.store.MarkDirty(bookID)
			return nil
		}
		return fmt.Errorf("section not found: %s", sectionID)
	}
	return fmt.Errorf("chapter not found: %s", chapterID)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// filterChapters returns chapters with chapterID removed, and whether it was found.
func filterChapters(chapters []book.Chapter, chapterID string) ([]book.Chapter, bool) {
	result := make([]book.Chapter, 0, len(chapters))
	found := false
	for _, ch := range chapters {
		if ch.ID == chapterID {
			found = true
			continue
		}
		result = append(result, ch)
	}
	return result, found
}

// filterSections returns sections with sectionID removed, and whether it was found.
func filterSections(sections []book.Section, sectionID string) ([]book.Section, bool) {
	result := make([]book.Section, 0, len(sections))
	found := false
	for _, sec := range sections {
		if sec.ID == sectionID {
			found = true
			continue
		}
		result = append(result, sec)
	}
	return result, found
}

// filterBlocks returns blocks with blockID removed, and whether it was found.
func filterBlocks(blocks []book.Block, blockID string) ([]book.Block, bool) {
	result := make([]book.Block, 0, len(blocks))
	found := false
	for _, b := range blocks {
		if b.ID == blockID {
			found = true
			continue
		}
		result = append(result, b)
	}
	return result, found
}
