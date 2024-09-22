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
	Cells      []Cell    `json:"cells"`
	CreateDate time.Time `json:"create_date"`
	UpdateDate time.Time `json:"update_date"`
}

func (b *Book) GetEntityPrefix() string {
	return "bok"
}

type Cell struct {
	ID      string    `json:"id"`
	Content string    `json:"content"`
	Type    BlockType `json:"type"`
}

func (c *Cell) GetEntityPrefix() string {
	return "cel"
}
