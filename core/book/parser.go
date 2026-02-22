package book

import (
	"bufio"
	"bytes"
	"strconv"
	"strings"
)

// parseSBTag extracts a tag and value from a --sb: prefixed line.
// Returns ("", "", false) if the line is not an sb tag.
func parseSBTag(line string) (tag, value string, ok bool) {
	trimmed := strings.TrimSpace(line)
	if !strings.HasPrefix(trimmed, "--sb:") {
		return "", "", false
	}
	rest := trimmed[len("--sb:"):]
	// Tag is everything up to the first space; value is the remainder.
	if idx := strings.IndexByte(rest, ' '); idx >= 0 {
		return rest[:idx], rest[idx+1:], true
	}
	return rest, "", true
}

// Parse reads a .sql file with --sb: metadata tags and returns a Book.
// It never returns an error; malformed input produces a best-effort structure.
func Parse(data []byte) *Book {
	b := &Book{ID: NewBookID()}

	var (
		currentChapter  *Chapter
		currentSection  *Section
		mdBuf           []string
		sqlBuf          []string
		hasMD           bool // tracks whether we're accumulating markdown
		pendingPageSize int  // applies to next BlockQuery
	)

	ensureChapter := func() {
		if currentChapter == nil {
			currentChapter = &Chapter{
				ID:    NewChapterID(),
				Title: "Untitled",
			}
		}
	}

	ensureSection := func() {
		ensureChapter()
		if currentSection == nil {
			currentSection = &Section{
				ID:    NewSectionID(),
				Title: "Untitled",
			}
		}
	}

	flushSQL := func() {
		if len(sqlBuf) == 0 {
			return
		}
		// Trim leading and trailing blank lines.
		for len(sqlBuf) > 0 && strings.TrimSpace(sqlBuf[0]) == "" {
			sqlBuf = sqlBuf[1:]
		}
		for len(sqlBuf) > 0 && strings.TrimSpace(sqlBuf[len(sqlBuf)-1]) == "" {
			sqlBuf = sqlBuf[:len(sqlBuf)-1]
		}
		if len(sqlBuf) == 0 {
			return
		}
		ensureSection()
		blk := Block{
			ID:      NewBlockID(),
			Type:    BlockQuery,
			Content: strings.Join(sqlBuf, "\n"),
			PageSize: pendingPageSize,
		}
		pendingPageSize = 0
		currentSection.Blocks = append(currentSection.Blocks, blk)
		sqlBuf = sqlBuf[:0]
	}

	flushMD := func() {
		if !hasMD {
			return
		}
		ensureSection()
		currentSection.Blocks = append(currentSection.Blocks, Block{
			ID:      NewBlockID(),
			Type:    BlockMarkdown,
			Content: strings.Join(mdBuf, "\n"),
		})
		mdBuf = mdBuf[:0]
		hasMD = false
	}

	flushSection := func() {
		flushMD()
		flushSQL()
		if currentSection != nil {
			ensureChapter()
			currentChapter.Sections = append(currentChapter.Sections, *currentSection)
			currentSection = nil
		}
	}

	flushChapter := func() {
		flushSection()
		if currentChapter != nil {
			b.Chapters = append(b.Chapters, *currentChapter)
			currentChapter = nil
		}
	}

	scanner := bufio.NewScanner(bytes.NewReader(data))
	for scanner.Scan() {
		line := scanner.Text()
		tag, value, ok := parseSBTag(line)
		if !ok {
			// Regular line (SQL or SQL comment) — flush any pending markdown, accumulate SQL.
			flushMD()
			sqlBuf = append(sqlBuf, line)
			continue
		}

		switch tag {
		case "id":
			if value != "" {
				b.ID = value
			}
		case "book":
			b.Title = value
		case "connection":
			if currentChapter == nil {
				// Book-level connection.
				b.Connection = value
			} else {
				// Chapter-level connection override.
				currentChapter.Connection = value
			}
		case "chapter":
			flushChapter()
			currentChapter = &Chapter{
				ID:    NewChapterID(),
				Title: value,
			}
			if value == "" {
				currentChapter.Title = "Untitled"
			}
		case "section":
			flushSection()
			currentSection = &Section{
				ID:    NewSectionID(),
				Title: value,
			}
			if value == "" {
				currentSection.Title = "Untitled"
			}
		case "md":
			flushSQL()
			mdBuf = append(mdBuf, value)
			hasMD = true
		case "pageSize":
			if n, err := strconv.Atoi(strings.TrimSpace(value)); err == nil && n > 0 {
				pendingPageSize = n
			}
		default:
			// Unknown tag — silently ignore for forward compatibility.
		}
	}

	// Flush remaining state.
	flushChapter()

	return b
}
