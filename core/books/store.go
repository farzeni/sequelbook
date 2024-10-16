package books

import (
	"fmt"
	"sequelbook/core/storage"
	"sequelbook/core/tools"
	"sync"
	"time"
)

type BooksStore struct {
	bmx     sync.Mutex
	books   map[string]*Book
	storage *storage.Storage
}

type BookData struct {
	Title string `json:"title"`
	Cells []Cell `json:"cells"`
}

func NewBooksStore(storage *storage.Storage) *BooksStore {
	return &BooksStore{
		books:   make(map[string]*Book),
		storage: storage,
	}
}

func (b *BooksStore) CreateBook(data BookData) (*Book, error) {
	bookID := tools.GenerateID(tools.EntityTypesBook)

	book := &Book{
		ID:         bookID,
		Title:      data.Title,
		Cells:      data.Cells,
		CreateDate: time.Now(),
		UpdateDate: time.Now(),
	}

	if book.Cells == nil {
		book.Cells = []Cell{}
	}

	if len(book.Cells) == 0 {
		book.Cells = []Cell{
			{
				ID:      tools.GenerateID(tools.EntityTypesCell),
				Content: "# Untitled\n\nDouble click this cell to edit it.",
				Type:    BlockTypeText,
			},
		}
	}

	err := b.storage.SaveEntity(book, bookID)

	if err != nil {
		return nil, err
	}

	b.bmx.Lock()
	b.books[bookID] = book
	b.bmx.Unlock()

	return book, nil
}

func (b *BooksStore) DuplicateBook(id string) (*Book, error) {
	book, ok := b.books[id]

	if !ok {
		return nil, nil
	}

	bookData := BookData{
		Title: book.Title,
		Cells: []Cell{},
	}

	book, err := b.CreateBook(bookData)

	if err != nil {
		return nil, err
	}

	for _, cell := range book.Cells {
		c, err := b.CreateCell(book.ID, cell.Type)

		if err != nil {
			return nil, err
		}

		c.Content = cell.Content

		book.Cells = append(book.Cells, *c)
	}

	err = b.storage.SaveEntity(book, book.ID)

	if err != nil {
		return nil, err
	}

	b.bmx.Lock()
	b.books[book.ID] = book
	b.bmx.Unlock()

	return book, nil
}

func (b *BooksStore) GetBook(id string) *Book {
	book, ok := b.books[id]

	if !ok {
		return nil
	}

	return book
}

func (b *BooksStore) UpdateBook(id string, data BookData) (*Book, error) {
	b.bmx.Lock()
	defer b.bmx.Unlock()

	book, ok := b.books[id]

	if !ok {
		b.bmx.Unlock()
		return nil, nil
	}

	if book.Title != data.Title {
		err := b.storage.RenameEntity(book, data.Title)

		if err != nil {
			return nil, err
		}
	}

	book.Title = data.Title
	book.UpdateDate = time.Now()
	book.Cells = data.Cells

	err := b.storage.SaveEntity(book, id)

	if err != nil {
		return nil, err
	}

	fmt.Println(book.Marshal())

	return book, nil
}

func (b *BooksStore) DeleteBook(id string) error {
	b.bmx.Lock()
	defer b.bmx.Unlock()

	fmt.Println("Deleting book: ", id)

	err := b.storage.DeleteEntity(tools.EntityTypesBook, id)

	if err != nil {
		return err
	}

	delete(b.books, id)
	return nil
}

func (b *BooksStore) ListBooks() []*Book {
	b.LoadBooks()
	var books []*Book
	b.bmx.Lock()
	for _, book := range b.books {
		books = append(books, book)
	}
	b.bmx.Unlock()

	return books
}

func (b *BooksStore) LoadBooks() error {
	entities, err := b.storage.LoadEntities(tools.EntityTypesBook)

	if err != nil {
		return err
	}

	for _, entity := range entities {
		book := &Book{}
		err := book.Unmarshal(entity)
		if err != nil {
			continue
		}
		b.bmx.Lock()
		b.books[book.ID] = book
		b.bmx.Unlock()
	}

	if len(b.books) == 0 {
		// Create a default book
		defaultBookData := BookData{
			Title: "Welcome",
			Cells: []Cell{
				{
					ID:      tools.GenerateID(tools.EntityTypesCell),
					Content: "# Welcome to the default book!",
					Type:    BlockTypeText,
				},
				{
					ID:      tools.GenerateID(tools.EntityTypesCell),
					Content: "SELECT * FROM books",
					Type:    BlockTypeCode,
				},
			},
		}

		_, err = b.CreateBook(defaultBookData)

		if err != nil {
			return err
		}
	}

	return nil
}

func (b *BooksStore) CreateCell(bookID string, cellType BlockType) (*Cell, error) {
	book, ok := b.books[bookID]

	if !ok {
		return nil, nil
	}

	cell := Cell{
		ID:      tools.GenerateID(tools.EntityTypesCell),
		Content: "",
		Type:    cellType,
	}

	book.Cells = append(book.Cells, cell)

	err := b.storage.SaveEntity(book, bookID)

	if err != nil {
		return nil, err
	}

	return &cell, nil
}
