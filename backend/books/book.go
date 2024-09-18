package books

import "time"

type BlockType string

const (
	BlockTypeText BlockType = "text"
	BlockTypeCode BlockType = "code"
)

type Book struct {
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	Chapters   []Chapter `json:"chapters"`
	CreateDate time.Time `json:"create_date"`
	UpdateDate time.Time `json:"update_date"`
}

func (b *Book) GetEntityPrefix() string {
	return "bok"
}

type Chapter struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	BookID string `json:"book_id"`
	Blocks []Cell `json:"blocks"`
}

func (c *Chapter) GetEntityPrefix() string {
	return "cha"
}

type Cell struct {
	ID        string    `json:"id"`
	ChapterID string    `json:"chapter_id"`
	Content   string    `json:"content"`
	Type      BlockType `json:"type"`
}

func (c *Cell) GetEntityPrefix() string {
	return "blo"
}
