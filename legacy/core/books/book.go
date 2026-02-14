package books

import (
	"sequelbook/core/tools"
	"strings"
	"time"
)

type BlockType string

type SQLBlockType string

const (
	BlockTypeText BlockType = "text"
	BlockTypeCode BlockType = "code"

	SQLBlockTypeText    SQLBlockType = "text"
	SQLBlockTypeCode    SQLBlockType = "code"
	SQLBlockTypeHeading SQLBlockType = "heading"
)

type Book struct {
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	Cells      []Cell    `json:"cells"`
	CreateDate time.Time `json:"create_date"`
	UpdateDate time.Time `json:"update_date"`
}

type SQLBookSection struct {
	Type     SQLBlockType
	Sections []string
}

func (b *Book) GetEntityPrefix() string {
	return "bok"
}

func (b *Book) GetFilename() string {
	if b.Title == "" {
		return b.ID
	}

	return b.Title
}

func (b *Book) Marshal() ([]byte, error) {
	content := ""

	content += "-- book: " + b.ID + "\n"
	content += "-- title: " + b.Title + "\n"
	content += "-- create_date: " + b.CreateDate.Format(time.RFC3339) + "\n"
	content += "-- update_date: " + b.UpdateDate.Format(time.RFC3339) + "\n\n"

	for _, cell := range b.Cells {
		content += "\n-- cell: " + cell.ID + "\n"

		cellContent := strings.TrimSpace(cell.Content)
		cellContent = strings.TrimRight(cellContent, "\n")

		if cell.Type == BlockTypeCode {
			if !strings.Contains(cellContent, ";") {
				cellContent += ";"
			}
		}

		lines := strings.Split(cellContent, "\n")

		for _, line := range lines {
			if cell.Type == BlockTypeCode {
				content += line + "\n"
			} else {
				content += "-- " + line + "\n"
			}
		}
	}

	return []byte(content), nil
}

func (b *Book) Unmarshal(content []byte) error {
	var currentCell *Cell
	var cID string
	lines := strings.Split(string(content), "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		line = strings.TrimRight(line, "\n")

		if line == "" {
			continue
		}

		if strings.HasPrefix(line, "-- book: ") {
			b.ID = strings.TrimPrefix(line, "-- book: ")
			continue
		}

		if strings.HasPrefix(line, "-- title: ") {
			b.Title = strings.TrimPrefix(line, "-- title: ")
			continue
		}

		if strings.HasPrefix(line, "-- create_date: ") {
			date, err := time.Parse(time.RFC3339, strings.TrimPrefix(line, "-- create_date: "))
			if err == nil {
				b.CreateDate = date
			}
			continue
		}

		if strings.HasPrefix(line, "-- update_date: ") {
			date, err := time.Parse(time.RFC3339, strings.TrimPrefix(line, "-- update_date: "))
			if err == nil {
				b.UpdateDate = date
			}
			continue
		}

		if strings.HasPrefix(line, "-- cell: ") {
			cID = strings.TrimPrefix(line, "-- cell: ")

			if cID == "" {
				cID = tools.GenerateID(tools.EntityTypesCell)
			}

			continue
		}

		cType := BlockTypeText

		if !strings.HasPrefix(line, "-- ") {
			cType = BlockTypeCode
		}

		if currentCell == nil || currentCell.Type != cType || (cID != "" && currentCell.ID != cID) {
			cell := Cell{
				Type: cType,
			}

			if cID != "" {
				cell.ID = cID
				cID = ""
			} else {
				cell.ID = tools.GenerateID(tools.EntityTypesCell)
			}

			b.Cells = append(b.Cells, cell)
			currentCell = &b.Cells[len(b.Cells)-1]
		}

		if cType == BlockTypeCode {
			currentCell.Content += strings.TrimSuffix(line, ";") + "\n"
		} else {
			currentCell.Content += strings.TrimPrefix(line, "-- ") + "\n"
		}
	}

	if b.ID == "" {
		b.ID = tools.GenerateID(tools.EntityTypesBook)
	}

	if b.CreateDate.IsZero() {
		b.CreateDate = time.Now()
	}

	if b.UpdateDate.IsZero() {
		b.UpdateDate = time.Now()
	}

	return nil
}

type Cell struct {
	ID      string    `json:"id"`
	Content string    `json:"content"`
	Type    BlockType `json:"type"`
}

func (c *Cell) GetEntityPrefix() string {
	return "cel"
}
