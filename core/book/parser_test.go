package book

import (
	"strings"
	"testing"
)

// specExample is the example from docs/SEQUELBOOK.md.
const specExample = `--sb:book My Analytics Queries
--sb:connection default-postgres

--sb:chapter User Metrics

--sb:section Daily Active Users
--sb:md This query calculates DAU using a 24h rolling window.
--sb:md
--sb:md Adjust the **interval** for different time ranges.

SELECT date_trunc('day', created_at) AS day, COUNT(DISTINCT user_id) AS dau
FROM events
WHERE created_at > now() - interval '30 days'
GROUP BY 1
ORDER BY 1;

-- Regular SQL comment, ignored by SequelBook
SELECT something_else FROM other_table;

--sb:section Retention Cohorts
--sb:md Monthly cohort analysis by signup date.

SELECT
    date_trunc('month', u.created_at) AS cohort,
    date_trunc('month', e.created_at) AS active_month,
    COUNT(DISTINCT e.user_id) AS users
FROM users u
JOIN events e ON e.user_id = u.id
GROUP BY 1, 2
ORDER BY 1, 2;`

func TestParseSpecExample(t *testing.T) {
	b := Parse([]byte(specExample))

	if b.Title != "My Analytics Queries" {
		t.Errorf("book title: got %q", b.Title)
	}
	if b.Connection != "default-postgres" {
		t.Errorf("book connection: got %q", b.Connection)
	}
	if len(b.Chapters) != 1 {
		t.Fatalf("chapters: got %d, want 1", len(b.Chapters))
	}

	ch := b.Chapters[0]
	if ch.Title != "User Metrics" {
		t.Errorf("chapter title: got %q", ch.Title)
	}
	if len(ch.Sections) != 2 {
		t.Fatalf("sections: got %d, want 2", len(ch.Sections))
	}

	// Section 1: Daily Active Users
	sec1 := ch.Sections[0]
	if sec1.Title != "Daily Active Users" {
		t.Errorf("sec1 title: got %q", sec1.Title)
	}
	if len(sec1.Blocks) != 2 {
		t.Fatalf("sec1 blocks: got %d, want 2", len(sec1.Blocks))
	}

	md := sec1.Blocks[0]
	if md.Type != BlockMarkdown {
		t.Errorf("sec1 block 0 type: got %q", md.Type)
	}
	expectedMD := "This query calculates DAU using a 24h rolling window.\n\nAdjust the **interval** for different time ranges."
	if md.Content != expectedMD {
		t.Errorf("sec1 markdown:\ngot:  %q\nwant: %q", md.Content, expectedMD)
	}

	sql1 := sec1.Blocks[1]
	if sql1.Type != BlockQuery {
		t.Errorf("sec1 block 1 type: got %q", sql1.Type)
	}
	if !strings.Contains(sql1.Content, "date_trunc('day'") {
		t.Errorf("sec1 query missing expected SQL")
	}
	// The SQL comment and second SELECT are in the same query block.
	if !strings.Contains(sql1.Content, "-- Regular SQL comment") {
		t.Errorf("sec1 query should contain regular SQL comment")
	}
	if !strings.Contains(sql1.Content, "SELECT something_else") {
		t.Errorf("sec1 query should contain second SELECT")
	}

	// Section 2: Retention Cohorts
	sec2 := ch.Sections[1]
	if sec2.Title != "Retention Cohorts" {
		t.Errorf("sec2 title: got %q", sec2.Title)
	}
	if len(sec2.Blocks) != 2 {
		t.Fatalf("sec2 blocks: got %d, want 2", len(sec2.Blocks))
	}
	if sec2.Blocks[0].Type != BlockMarkdown {
		t.Errorf("sec2 block 0 type: got %q", sec2.Blocks[0].Type)
	}
	if sec2.Blocks[1].Type != BlockQuery {
		t.Errorf("sec2 block 1 type: got %q", sec2.Blocks[1].Type)
	}
}

func TestParsePlainSQL(t *testing.T) {
	input := "SELECT 1;\nSELECT 2;\n"
	b := Parse([]byte(input))

	if b.Title != "" {
		t.Errorf("title should be empty: got %q", b.Title)
	}
	if len(b.Chapters) != 1 {
		t.Fatalf("chapters: got %d, want 1", len(b.Chapters))
	}
	ch := b.Chapters[0]
	if ch.Title != "Untitled" {
		t.Errorf("chapter title: got %q", ch.Title)
	}
	if len(ch.Sections) != 1 {
		t.Fatalf("sections: got %d, want 1", len(ch.Sections))
	}
	sec := ch.Sections[0]
	if sec.Title != "Untitled" {
		t.Errorf("section title: got %q", sec.Title)
	}
	if len(sec.Blocks) != 1 {
		t.Fatalf("blocks: got %d, want 1", len(sec.Blocks))
	}
	if sec.Blocks[0].Type != BlockQuery {
		t.Errorf("block type: got %q", sec.Blocks[0].Type)
	}
	// All lines form a single query block.
	if !strings.Contains(sec.Blocks[0].Content, "SELECT 1;") {
		t.Errorf("missing SELECT 1")
	}
	if !strings.Contains(sec.Blocks[0].Content, "SELECT 2;") {
		t.Errorf("missing SELECT 2")
	}
}

func TestParseEmptyFile(t *testing.T) {
	b := Parse([]byte(""))
	if b.Title != "" {
		t.Errorf("title should be empty")
	}
	if len(b.Chapters) != 0 {
		t.Errorf("chapters: got %d, want 0", len(b.Chapters))
	}
}

func TestParseUnknownTag(t *testing.T) {
	input := "--sb:book Test\n--sb:futurefeature something\n--sb:chapter Ch1\n--sb:section Sec1\nSELECT 1;\n"
	b := Parse([]byte(input))

	if b.Title != "Test" {
		t.Errorf("title: got %q", b.Title)
	}
	if len(b.Chapters) != 1 {
		t.Fatalf("chapters: got %d", len(b.Chapters))
	}
	if len(b.Chapters[0].Sections) != 1 {
		t.Fatalf("sections: got %d", len(b.Chapters[0].Sections))
	}
}

func TestParseMDEmptyContent(t *testing.T) {
	input := "--sb:book Test\n--sb:chapter Ch\n--sb:section Sec\n--sb:md Line 1\n--sb:md\n--sb:md Line 3\n"
	b := Parse([]byte(input))

	sec := b.Chapters[0].Sections[0]
	if len(sec.Blocks) != 1 {
		t.Fatalf("blocks: got %d, want 1", len(sec.Blocks))
	}
	md := sec.Blocks[0]
	if md.Type != BlockMarkdown {
		t.Errorf("type: got %q", md.Type)
	}
	expected := "Line 1\n\nLine 3"
	if md.Content != expected {
		t.Errorf("content:\ngot:  %q\nwant: %q", md.Content, expected)
	}
}

func TestParseConnectionScopes(t *testing.T) {
	input := "--sb:book Test\n--sb:connection book-conn\n--sb:chapter Ch\n--sb:connection chapter-conn\n--sb:section Sec\nSELECT 1;\n"
	b := Parse([]byte(input))

	if b.Connection != "book-conn" {
		t.Errorf("book connection: got %q", b.Connection)
	}
	if b.Chapters[0].Connection != "chapter-conn" {
		t.Errorf("chapter connection: got %q", b.Chapters[0].Connection)
	}
}

func TestParseSQLCommentPreserved(t *testing.T) {
	input := "--sb:chapter Ch\n--sb:section Sec\n-- this is a SQL comment\nSELECT 1;\n"
	b := Parse([]byte(input))

	content := b.Chapters[0].Sections[0].Blocks[0].Content
	if !strings.Contains(content, "-- this is a SQL comment") {
		t.Errorf("SQL comment not preserved: %q", content)
	}
}

func TestParseWhitespacePreservation(t *testing.T) {
	input := "--sb:chapter Ch\n--sb:section Sec\n    SELECT\n        1\n    FROM\n        dual;\n"
	b := Parse([]byte(input))

	content := b.Chapters[0].Sections[0].Blocks[0].Content
	if !strings.Contains(content, "    SELECT") {
		t.Errorf("indentation not preserved: %q", content)
	}
}

func TestSerializePlainSQL(t *testing.T) {
	b := &Book{
		ID: NewBookID(),
		Chapters: []Chapter{
			{
				ID:    NewChapterID(),
				Title: "Untitled",
				Sections: []Section{
					{
						ID:    NewSectionID(),
						Title: "Untitled",
						Blocks: []Block{
							{ID: NewBlockID(), Type: BlockQuery, Content: "SELECT 1;"},
						},
					},
				},
			},
		},
	}

	out := string(Serialize(b))
	// --sb:id is always written to keep IDs stable across restarts.
	// All other structural tags (book, chapter, section, etc.) must be absent.
	for _, tag := range []string{"--sb:book", "--sb:chapter", "--sb:section", "--sb:connection", "--sb:md"} {
		if strings.Contains(out, tag) {
			t.Errorf("plain SQL should not contain %s tag:\n%s", tag, out)
		}
	}
	if !strings.Contains(out, "--sb:id") {
		t.Errorf("plain SQL should contain --sb:id for ID stability:\n%s", out)
	}
	if !strings.Contains(out, "SELECT 1;") {
		t.Errorf("missing SQL content:\n%s", out)
	}
}

func TestSerializeTagged(t *testing.T) {
	b := &Book{
		ID:         NewBookID(),
		Title:      "My Book",
		Connection: "pg://localhost",
		Chapters: []Chapter{
			{
				ID:    NewChapterID(),
				Title: "Chapter 1",
				Sections: []Section{
					{
						ID:    NewSectionID(),
						Title: "Section 1",
						Blocks: []Block{
							{ID: NewBlockID(), Type: BlockMarkdown, Content: "Hello\nWorld"},
							{ID: NewBlockID(), Type: BlockQuery, Content: "SELECT 1;"},
						},
					},
				},
			},
		},
	}

	out := string(Serialize(b))
	if !strings.Contains(out, "--sb:book My Book") {
		t.Errorf("missing book tag:\n%s", out)
	}
	if !strings.Contains(out, "--sb:connection pg://localhost") {
		t.Errorf("missing connection tag:\n%s", out)
	}
	if !strings.Contains(out, "--sb:chapter Chapter 1") {
		t.Errorf("missing chapter tag:\n%s", out)
	}
	if !strings.Contains(out, "--sb:section Section 1") {
		t.Errorf("missing section tag:\n%s", out)
	}
	if !strings.Contains(out, "--sb:md Hello") {
		t.Errorf("missing md line 1:\n%s", out)
	}
	if !strings.Contains(out, "--sb:md World") {
		t.Errorf("missing md line 2:\n%s", out)
	}
	if !strings.Contains(out, "SELECT 1;") {
		t.Errorf("missing query:\n%s", out)
	}
}

func TestRoundTripParseSerializeParse(t *testing.T) {
	inputs := []string{
		specExample,
		"SELECT 1;\nSELECT 2;\n",
		"--sb:book B\n--sb:chapter C\n--sb:section S\n--sb:md Note\nSELECT 1;\n",
	}

	for i, input := range inputs {
		b1 := Parse([]byte(input))
		serialized := Serialize(b1)
		b2 := Parse(serialized)

		if err := structuralEqual(b1, b2); err != "" {
			t.Errorf("round-trip %d: Parse(Serialize(Parse(input))) != Parse(input): %s", i, err)
		}
	}
}

func TestRoundTripSerializeParseSerialize(t *testing.T) {
	b := &Book{
		ID:         NewBookID(),
		Title:      "Test",
		Connection: "conn",
		Chapters: []Chapter{
			{
				ID:         NewChapterID(),
				Title:      "Ch1",
				Connection: "ch-conn",
				Sections: []Section{
					{
						ID:    NewSectionID(),
						Title: "Sec1",
						Blocks: []Block{
							{ID: NewBlockID(), Type: BlockMarkdown, Content: "Note line 1\nNote line 2"},
							{ID: NewBlockID(), Type: BlockQuery, Content: "SELECT 1;"},
						},
					},
					{
						ID:    NewSectionID(),
						Title: "Sec2",
						Blocks: []Block{
							{ID: NewBlockID(), Type: BlockQuery, Content: "SELECT 2;"},
						},
					},
				},
			},
		},
	}

	s1 := Serialize(b)
	b2 := Parse(s1)
	s2 := Serialize(b2)

	if string(s1) != string(s2) {
		t.Errorf("Serialize(Parse(Serialize(book))) != Serialize(book)\ngot:\n%s\nwant:\n%s", string(s2), string(s1))
	}
}

// structuralEqual compares two books ignoring IDs.
func structuralEqual(a, b *Book) string {
	if a.Title != b.Title {
		return "book title mismatch"
	}
	if a.Connection != b.Connection {
		return "book connection mismatch"
	}
	if len(a.Chapters) != len(b.Chapters) {
		return "chapter count mismatch"
	}
	for i := range a.Chapters {
		ac, bc := a.Chapters[i], b.Chapters[i]
		if ac.Title != bc.Title {
			return "chapter title mismatch"
		}
		if ac.Connection != bc.Connection {
			return "chapter connection mismatch"
		}
		if len(ac.Sections) != len(bc.Sections) {
			return "section count mismatch"
		}
		for j := range ac.Sections {
			as, bs := ac.Sections[j], bc.Sections[j]
			if as.Title != bs.Title {
				return "section title mismatch"
			}
			if len(as.Blocks) != len(bs.Blocks) {
				return "block count mismatch"
			}
			for k := range as.Blocks {
				ab, bb := as.Blocks[k], bs.Blocks[k]
				if ab.Type != bb.Type {
					return "block type mismatch"
				}
				if ab.Content != bb.Content {
					return "block content mismatch"
				}
			}
		}
	}
	return ""
}
