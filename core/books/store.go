package books

import (
	"encoding/json"
	"log"
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

	b.bmx.Lock()

	b.books[bookID] = book

	err := b.storage.SaveEntity(book, bookID)

	b.bmx.Unlock()

	if err != nil {
		return nil, err
	}

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
	book, ok := b.books[id]

	if !ok {
		b.bmx.Unlock()
		return nil, nil
	}

	book.Title = data.Title
	book.UpdateDate = time.Now()
	book.Cells = data.Cells

	err := b.storage.SaveEntity(book, id)

	b.bmx.Unlock()

	if err != nil {
		return nil, err
	}

	return book, nil
}

func (b *BooksStore) DeleteBook(id string) error {
	_, ok := b.books[id]

	if !ok {
		return nil
	}

	delete(b.books, id)
	return nil
}

func (b *BooksStore) ListBooks() []*Book {
	b.LoadBooks()
	var books []*Book
	for _, book := range b.books {
		books = append(books, book)
	}

	log.Printf("Listed books %v\n", books)
	return books
}

func (b *BooksStore) LoadBooks() error {
	entities, err := b.storage.LoadEntities(tools.EntityTypesBook)

	if err != nil {
		return err
	}

	for _, entity := range entities {
		book := &Book{}
		log.Println("Casting entity to book", string(entity))
		err := json.Unmarshal(entity, book)
		if err != nil {
			log.Println("Failed to cast entity to book")
			log.Println(err)
			continue
		}
		b.books[book.ID] = book
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
