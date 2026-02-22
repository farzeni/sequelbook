package book

import (
	"strconv"
	"strings"
)

// Serialize converts a Book back into the .sql file format with --sb: tags.
// Always writes --sb:id so the book's ID survives across restarts.
// If the book is otherwise a plain SQL file (single untitled chapter/section,
// no title/connection, only query blocks), only the id tag is added.
func Serialize(b *Book) []byte {
	var out strings.Builder
	out.WriteString("--sb:id ")
	out.WriteString(b.ID)
	out.WriteByte('\n')

	if isPlainSQL(b) {
		body := serializePlain(b)
		if len(body) > 0 {
			out.WriteByte('\n')
			out.Write(body)
		}
	} else {
		out.Write(serializeTagged(b))
	}
	return []byte(out.String())
}

// isPlainSQL checks whether the book should serialize as plain SQL (no tags).
func isPlainSQL(b *Book) bool {
	if b.Title != "" || b.Connection != "" {
		return false
	}
	if len(b.Chapters) != 1 {
		return false
	}
	ch := b.Chapters[0]
	if ch.Title != "Untitled" || ch.Connection != "" {
		return false
	}
	if len(ch.Sections) != 1 {
		return false
	}
	sec := ch.Sections[0]
	if sec.Title != "Untitled" {
		return false
	}
	for _, blk := range sec.Blocks {
		if blk.Type != BlockQuery {
			return false
		}
		if blk.PageSize > 0 {
			return false // need tagged mode to persist pageSize
		}
	}
	return true
}

func serializePlain(b *Book) []byte {
	var sb strings.Builder
	blocks := b.Chapters[0].Sections[0].Blocks
	for i, blk := range blocks {
		if i > 0 {
			sb.WriteByte('\n')
		}
		sb.WriteString(blk.Content)
	}
	sb.WriteByte('\n')
	return []byte(sb.String())
}

func serializeTagged(b *Book) []byte {
	var sb strings.Builder

	if b.Title != "" {
		sb.WriteString("--sb:book ")
		sb.WriteString(b.Title)
		sb.WriteByte('\n')
	}
	if b.Connection != "" {
		sb.WriteString("--sb:connection ")
		sb.WriteString(b.Connection)
		sb.WriteByte('\n')
	}

	for ci, ch := range b.Chapters {
		if ci > 0 || b.Title != "" || b.Connection != "" {
			sb.WriteByte('\n')
		}
		sb.WriteString("--sb:chapter ")
		sb.WriteString(ch.Title)
		sb.WriteByte('\n')
		if ch.Connection != "" {
			sb.WriteString("--sb:connection ")
			sb.WriteString(ch.Connection)
			sb.WriteByte('\n')
		}

		for _, sec := range ch.Sections {
			sb.WriteByte('\n')
			sb.WriteString("--sb:section ")
			sb.WriteString(sec.Title)
			sb.WriteByte('\n')

			for _, blk := range sec.Blocks {
				switch blk.Type {
				case BlockMarkdown:
					for _, line := range strings.Split(blk.Content, "\n") {
						sb.WriteString("--sb:md ")
						sb.WriteString(line)
						sb.WriteByte('\n')
					}
				case BlockQuery:
					sb.WriteByte('\n')
					if blk.PageSize > 0 {
						sb.WriteString("--sb:pageSize ")
						sb.WriteString(strconv.Itoa(blk.PageSize))
						sb.WriteByte('\n')
					}
					sb.WriteString(blk.Content)
					sb.WriteByte('\n')
				}
			}
		}
	}

	return []byte(sb.String())
}
