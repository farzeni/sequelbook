package book

import (
	"os"
	"path/filepath"
	"testing"
)

const testSQL = `--sb:id bok_testfixedid00000000000
--sb:book Test Book
--sb:connection postgres://localhost/test

--sb:chapter Chapter One

--sb:section Section One

SELECT 1;
`

func TestOpen(t *testing.T) {
	path := writeTempFile(t, "test.sql", testSQL)
	svc := NewStore()

	ob, err := svc.Open(path)
	if err != nil {
		t.Fatalf("Open() error: %v", err)
	}

	if ob.Book.Title != "Test Book" {
		t.Errorf("Title = %q, want %q", ob.Book.Title, "Test Book")
	}
	if ob.Book.Connection != "postgres://localhost/test" {
		t.Errorf("Connection = %q, want %q", ob.Book.Connection, "postgres://localhost/test")
	}
	if len(ob.Book.Chapters) != 1 {
		t.Fatalf("len(Chapters) = %d, want 1", len(ob.Book.Chapters))
	}
	if ob.Book.Chapters[0].Title != "Chapter One" {
		t.Errorf("Chapter title = %q, want %q", ob.Book.Chapters[0].Title, "Chapter One")
	}
	if ob.FilePath != path {
		t.Errorf("FilePath = %q, want %q", ob.FilePath, path)
	}
	if ob.Dirty {
		t.Error("Dirty = true, want false")
	}
}

func TestOpenNonexistent(t *testing.T) {
	svc := NewStore()
	_, err := svc.Open("/nonexistent/path/file.sql")
	if err == nil {
		t.Fatal("Open() expected error for nonexistent file, got nil")
	}
}

func TestCreate(t *testing.T) {
	svc := NewStore()
	ob := svc.Create("My Book")

	if ob.Book.Title != "My Book" {
		t.Errorf("Title = %q, want %q", ob.Book.Title, "My Book")
	}
	if len(ob.Book.Chapters) != 1 {
		t.Fatalf("len(Chapters) = %d, want 1", len(ob.Book.Chapters))
	}
	ch := ob.Book.Chapters[0]
	if ch.Title != "Untitled" {
		t.Errorf("Chapter title = %q, want %q", ch.Title, "Untitled")
	}
	if len(ch.Sections) != 1 {
		t.Fatalf("len(Sections) = %d, want 1", len(ch.Sections))
	}
	if ch.Sections[0].Title != "Untitled" {
		t.Errorf("Section title = %q, want %q", ch.Sections[0].Title, "Untitled")
	}
	if ob.FilePath != "" {
		t.Errorf("FilePath = %q, want empty", ob.FilePath)
	}
	if !ob.Dirty {
		t.Error("Dirty = false, want true for new book")
	}
}

func TestCreateEmptyTitle(t *testing.T) {
	svc := NewStore()
	ob := svc.Create("")

	if ob.Book.Title != "Untitled" {
		t.Errorf("Title = %q, want %q", ob.Book.Title, "Untitled")
	}
}

func TestSave(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "saved.sql")

	svc := NewStore()
	ob := svc.Create("Save Test")

	// SaveAs to set the path first.
	if err := svc.SaveAs(ob.Book.ID, path); err != nil {
		t.Fatalf("SaveAs() error: %v", err)
	}
	if ob.Dirty {
		t.Error("Dirty = true after SaveAs, want false")
	}

	// Mutate and mark dirty.
	svc.MarkDirty(ob.Book.ID)
	if !ob.Dirty {
		t.Error("Dirty = false after MarkDirty, want true")
	}

	// Save without specifying path.
	if err := svc.Save(ob.Book.ID); err != nil {
		t.Fatalf("Save() error: %v", err)
	}
	if ob.Dirty {
		t.Error("Dirty = true after Save, want false")
	}

	// Verify file content matches serialization.
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile() error: %v", err)
	}
	expected := Serialize(ob.Book)
	if string(data) != string(expected) {
		t.Errorf("file content mismatch:\ngot:\n%s\nwant:\n%s", data, expected)
	}
}

func TestSaveNoPath(t *testing.T) {
	svc := NewStore()
	ob := svc.Create("No Path")

	err := svc.Save(ob.Book.ID)
	if err == nil {
		t.Fatal("Save() expected error for book with no path, got nil")
	}
}

func TestSaveAs(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "saveas.sql")

	svc := NewStore()
	ob := svc.Create("SaveAs Test")

	if err := svc.SaveAs(ob.Book.ID, path); err != nil {
		t.Fatalf("SaveAs() error: %v", err)
	}

	absPath, _ := filepath.Abs(path)
	if ob.FilePath != absPath {
		t.Errorf("FilePath = %q, want %q", ob.FilePath, absPath)
	}

	// Verify file exists and is readable.
	if _, err := os.Stat(path); err != nil {
		t.Fatalf("file not created: %v", err)
	}
}

func TestSaveNotFound(t *testing.T) {
	svc := NewStore()
	err := svc.Save("nonexistent")
	if err == nil {
		t.Fatal("Save() expected error for nonexistent book, got nil")
	}
}

func TestClose(t *testing.T) {
	svc := NewStore()
	ob := svc.Create("Close Test")
	id := ob.Book.ID

	svc.Close(id)

	if _, ok := svc.Get(id); ok {
		t.Error("Get() returned true after Close, want false")
	}
}

func TestGet(t *testing.T) {
	svc := NewStore()
	ob := svc.Create("Get Test")

	got, ok := svc.Get(ob.Book.ID)
	if !ok {
		t.Fatal("Get() returned false, want true")
	}
	if got.Book.Title != "Get Test" {
		t.Errorf("Title = %q, want %q", got.Book.Title, "Get Test")
	}

	_, ok = svc.Get("nonexistent")
	if ok {
		t.Error("Get() returned true for nonexistent ID")
	}
}

func TestList(t *testing.T) {
	svc := NewStore()

	if list := svc.List(); len(list) != 0 {
		t.Errorf("List() len = %d, want 0", len(list))
	}

	svc.Create("Book A")
	svc.Create("Book B")
	svc.Create("Book C")

	list := svc.List()
	if len(list) != 3 {
		t.Errorf("List() len = %d, want 3", len(list))
	}
}

func TestAtomicWrite(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "atomic.sql")

	svc := NewStore()
	ob := svc.Create("Atomic Test")

	if err := svc.SaveAs(ob.Book.ID, path); err != nil {
		t.Fatalf("SaveAs() error: %v", err)
	}

	// Verify no temp files are left behind.
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatalf("ReadDir() error: %v", err)
	}
	for _, e := range entries {
		if e.Name() != "atomic.sql" {
			t.Errorf("unexpected file left behind: %s", e.Name())
		}
	}

	// Verify file content is complete.
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile() error: %v", err)
	}
	expected := Serialize(ob.Book)
	if string(data) != string(expected) {
		t.Errorf("file content mismatch after atomic write")
	}
}

func TestOpenThenSave(t *testing.T) {
	path := writeTempFile(t, "roundtrip.sql", testSQL)
	svc := NewStore()

	ob, err := svc.Open(path)
	if err != nil {
		t.Fatalf("Open() error: %v", err)
	}

	if err := svc.Save(ob.Book.ID); err != nil {
		t.Fatalf("Save() error: %v", err)
	}

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile() error: %v", err)
	}
	expected := Serialize(ob.Book)
	if string(data) != string(expected) {
		t.Errorf("round-trip content mismatch:\ngot:\n%s\nwant:\n%s", data, expected)
	}
}

// writeTempFile creates a file in t.TempDir and returns its absolute path.
func writeTempFile(t *testing.T, name, content string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, name)
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatalf("WriteFile() error: %v", err)
	}
	return path
}
