package backend

type Book struct {
	ID       string    `json:"id"`
	Title    string    `json:"title"`
	Chapters []Chapter `json:"chapters"`
}

type Chapter struct {
	ID     string  `json:"id"`
	Title  string  `json:"title"`
	BookID string  `json:"book_id"`
	Blocks []Block `json:"blocks"`
}

type Block struct {
	ID        string `json:"id"`
	ChapterID string `json:"chapter_id"`
	Content   string `json:"content"`
}

type BooksStore struct{}

func NewBooksService() *BooksStore {
	return &BooksStore{}
}

func (b *BooksStore) GetBook(id string) (Book, error) {
	return Book{
		ID:    "1",
		Title: "The Great Gatsby",
		Chapters: []Chapter{
			{
				ID:     "1",
				Title:  "Chapter 1",
				BookID: "1",
				Blocks: []Block{
					{
						ID:        "1",
						ChapterID: "1",
						Content:   "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.",
					},
				},
			},
		},
	}, nil
}
