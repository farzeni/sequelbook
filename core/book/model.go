package book

import "github.com/rs/xid"

// BlockType discriminates between markdown and query blocks.
type BlockType string

const (
	BlockMarkdown BlockType = "markdown"
	BlockQuery    BlockType = "query"
)

// Block is a single content unit within a section.
type Block struct {
	ID       string    `json:"id"`
	Type     BlockType `json:"type"`
	Content  string    `json:"content"`
	PageSize int       `json:"pageSize,omitempty"` // 0 = use default 50
}

// Section groups related blocks under a title.
type Section struct {
	ID     string  `json:"id"`
	Title  string  `json:"title"`
	Blocks []Block `json:"blocks"`
}

// Chapter groups sections, optionally overriding the book-level connection.
type Chapter struct {
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	Connection string    `json:"connection,omitempty"`
	Sections   []Section `json:"sections"`
}

// Book is the top-level container representing a .sql SequelBook file.
type Book struct {
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	Connection string    `json:"connection,omitempty"`
	Chapters   []Chapter `json:"chapters"`
}

func newID(prefix string) string {
	return prefix + "_" + xid.New().String()
}

func NewBookID() string    { return newID("bok") }
func NewChapterID() string { return newID("cha") }
func NewSectionID() string { return newID("sec") }
func NewBlockID() string   { return newID("blk") }
