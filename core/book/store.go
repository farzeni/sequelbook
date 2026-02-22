package book

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

// OpenBook represents a book that is currently open in the application.
type OpenBook struct {
	Book     *Book `json:"book"`
	FilePath string     `json:"filePath"` // empty = never saved (new book)
	Dirty    bool       `json:"dirty"`    // true = modified since last save
}

// Store manages open books and their file I/O.
type Store struct {
	mu    sync.RWMutex
	books map[string]*OpenBook // keyed by book ID
}

// NewStore creates a new Store.
func NewStore() *Store {
	return &Store{
		books: make(map[string]*OpenBook),
	}
}

// Open reads a .sql file, parses it, and registers the book.
func (s *Store) Open(path string) (*OpenBook, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("open book: %w", err)
	}

	absPath, err := filepath.Abs(path)
	if err != nil {
		return nil, fmt.Errorf("resolve path: %w", err)
	}

	b := Parse(data)
	// Mark dirty if no persisted ID in the file yet, so SaveAllDirty will
	// stamp --sb:id immediately and keep the ID stable across restarts.
	needsID := !bytes.Contains(data, []byte("--sb:id"))
	ob := &OpenBook{
		Book:     b,
		FilePath: absPath,
		Dirty:    needsID,
	}

	s.mu.Lock()
	s.books[b.ID] = ob
	s.mu.Unlock()

	return ob, nil
}

// Create makes a new empty book with one chapter and one section, ready to use.
func (s *Store) Create(title string) *OpenBook {
	if title == "" {
		title = "Untitled"
	}

	b := &Book{
		ID:    NewBookID(),
		Title: title,
		Chapters: []Chapter{
			{
				ID:    NewChapterID(),
				Title: "Untitled",
				Sections: []Section{
					{
						ID:    NewSectionID(),
						Title: "Untitled",
					},
				},
			},
		},
	}

	ob := &OpenBook{
		Book:  b,
		Dirty: true,
	}

	s.mu.Lock()
	s.books[b.ID] = ob
	s.mu.Unlock()

	return ob
}

// Save serializes the book and writes it to the stored FilePath.
// Returns an error if the book has no file path (use SaveAs).
func (s *Store) Save(bookID string) error {
	s.mu.RLock()
	ob, ok := s.books[bookID]
	s.mu.RUnlock()

	if !ok {
		return fmt.Errorf("book not found: %s", bookID)
	}
	if ob.FilePath == "" {
		return fmt.Errorf("no file path set for book %s: use SaveAs", bookID)
	}

	return s.writeBook(ob)
}

// SaveAs serializes the book and writes it to the given path,
// updating the stored FilePath.
func (s *Store) SaveAs(bookID, path string) error {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return fmt.Errorf("resolve path: %w", err)
	}

	s.mu.RLock()
	ob, ok := s.books[bookID]
	s.mu.RUnlock()

	if !ok {
		return fmt.Errorf("book not found: %s", bookID)
	}

	s.mu.Lock()
	ob.FilePath = absPath
	s.mu.Unlock()

	return s.writeBook(ob)
}

// Close removes a book from the open books map.
func (s *Store) Close(bookID string) {
	s.mu.Lock()
	delete(s.books, bookID)
	s.mu.Unlock()
}

// Delete removes a book from memory and deletes its file from disk.
// If the book has no file path (never saved), it is only removed from memory.
func (s *Store) Delete(bookID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	ob, ok := s.books[bookID]
	if !ok {
		return fmt.Errorf("book not found: %s", bookID)
	}

	if ob.FilePath != "" {
		if err := os.Remove(ob.FilePath); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("delete book file: %w", err)
		}
	}

	delete(s.books, bookID)
	return nil
}

// Get retrieves an open book by ID.
func (s *Store) Get(bookID string) (*OpenBook, bool) {
	s.mu.RLock()
	ob, ok := s.books[bookID]
	s.mu.RUnlock()
	return ob, ok
}

// List returns all currently open books.
func (s *Store) List() []*OpenBook {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*OpenBook, 0, len(s.books))
	for _, ob := range s.books {
		result = append(result, ob)
	}
	return result
}

// LoadDir scans dir for *.sql files and opens each one.
// Errors on individual files are logged and skipped.
func (s *Store) LoadDir(dir string) error {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("read books dir: %w", err)
	}
	for _, e := range entries {
		if e.IsDir() || filepath.Ext(e.Name()) != ".sql" {
			continue
		}
		path := filepath.Join(dir, e.Name())
		if _, err := s.Open(path); err != nil {
			// Skip files that can't be parsed — don't fail the whole load.
			fmt.Fprintf(os.Stderr, "skipping %s: %v\n", path, err)
		}
	}
	return nil
}

// SaveAllDirty persists all open books that have Dirty=true and a FilePath set.
func (s *Store) SaveAllDirty() error {
	s.mu.RLock()
	var dirty []*OpenBook
	for _, ob := range s.books {
		if ob.Dirty && ob.FilePath != "" {
			dirty = append(dirty, ob)
		}
	}
	s.mu.RUnlock()

	var firstErr error
	for _, ob := range dirty {
		if err := s.writeBook(ob); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}

// AutoSavePath returns the default auto-save path for a book in the given directory.
func AutoSavePath(dir string, bookID string) string {
	return filepath.Join(dir, bookID+".sql")
}

// MarkDirty sets the dirty flag on an open book.
func (s *Store) MarkDirty(bookID string) {
	s.mu.Lock()
	if ob, ok := s.books[bookID]; ok {
		ob.Dirty = true
	}
	s.mu.Unlock()
}

// writeBook performs an atomic write: write to a temp file in the same
// directory, then rename over the target. This avoids partial writes on crash.
func (s *Store) writeBook(ob *OpenBook) error {
	data := Serialize(ob.Book)
	dir := filepath.Dir(ob.FilePath)

	tmp, err := os.CreateTemp(dir, ".sequelbook-*.tmp")
	if err != nil {
		return fmt.Errorf("create temp file: %w", err)
	}
	tmpPath := tmp.Name()

	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		os.Remove(tmpPath)
		return fmt.Errorf("write temp file: %w", err)
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("close temp file: %w", err)
	}

	if err := os.Rename(tmpPath, ob.FilePath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("rename temp file: %w", err)
	}

	s.mu.Lock()
	ob.Dirty = false
	s.mu.Unlock()

	return nil
}
