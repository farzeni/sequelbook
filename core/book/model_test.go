package book

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestIDPrefixes(t *testing.T) {
	tests := []struct {
		name   string
		fn     func() string
		prefix string
	}{
		{"book", NewBookID, "bok_"},
		{"chapter", NewChapterID, "cha_"},
		{"section", NewSectionID, "sec_"},
		{"block", NewBlockID, "blk_"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			id := tt.fn()
			if !strings.HasPrefix(id, tt.prefix) {
				t.Errorf("expected prefix %q, got %q", tt.prefix, id)
			}
			// prefix (4 chars) + xid (20 chars) = 24
			if len(id) != 24 {
				t.Errorf("expected length 24, got %d (%q)", len(id), id)
			}
		})
	}
}

func TestIDUniqueness(t *testing.T) {
	seen := make(map[string]bool, 1000)
	for i := 0; i < 1000; i++ {
		id := NewBlockID()
		if seen[id] {
			t.Fatalf("duplicate ID at iteration %d: %s", i, id)
		}
		seen[id] = true
	}
}

func TestBookJSONRoundTrip(t *testing.T) {
	b := Book{
		ID:         NewBookID(),
		Title:      "Test Book",
		Connection: "pg://localhost/test",
		Chapters: []Chapter{
			{
				ID:    NewChapterID(),
				Title: "Chapter 1",
				Sections: []Section{
					{
						ID:    NewSectionID(),
						Title: "Section 1",
						Blocks: []Block{
							{ID: NewBlockID(), Type: BlockMarkdown, Content: "hello"},
							{ID: NewBlockID(), Type: BlockQuery, Content: "SELECT 1;"},
						},
					},
				},
			},
		},
	}

	data, err := json.Marshal(b)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var got Book
	if err := json.Unmarshal(data, &got); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if got.Title != b.Title {
		t.Errorf("title: got %q, want %q", got.Title, b.Title)
	}
	if got.Connection != b.Connection {
		t.Errorf("connection: got %q, want %q", got.Connection, b.Connection)
	}
	if len(got.Chapters) != 1 {
		t.Fatalf("chapters: got %d, want 1", len(got.Chapters))
	}
	ch := got.Chapters[0]
	if len(ch.Sections) != 1 {
		t.Fatalf("sections: got %d, want 1", len(ch.Sections))
	}
	sec := ch.Sections[0]
	if len(sec.Blocks) != 2 {
		t.Fatalf("blocks: got %d, want 2", len(sec.Blocks))
	}
	if sec.Blocks[0].Type != BlockMarkdown {
		t.Errorf("block 0 type: got %q, want %q", sec.Blocks[0].Type, BlockMarkdown)
	}
	if sec.Blocks[1].Content != "SELECT 1;" {
		t.Errorf("block 1 content: got %q", sec.Blocks[1].Content)
	}
}
