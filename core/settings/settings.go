package settings

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"github.com/rs/xid"
	"github.com/sequelbook/sequelbook/core/connection"
)

// Config holds app-level preferences.
type Config struct {
	PageSize int    `json:"pageSize"` // default: 200
	BooksDir string `json:"booksDir"` // default: ~/.sequelbook/books/
	FontSize int    `json:"fontSize"` // default: 14
}

// ConnectionEntry is a saved connection configuration.
// Type defaults to "postgres" when empty. For SQLite, Database is the file path.
type ConnectionEntry struct {
	ID       string `json:"id"`       // con_<xid>, assigned on save
	Name     string `json:"name"`     // user-visible label
	Type     string `json:"type"`     // postgres | mysql | sqlite; default postgres
	Host     string `json:"host"`
	Port     uint16 `json:"port"`
	Database string `json:"database"`
	User     string `json:"user"`
	Password string `json:"password"` // plaintext for MVP 0
	SSLMode  string                      `json:"sslMode"`
	SSH      *connection.SSHTunnelConfig `json:"ssh,omitempty"`
}

// Store manages config + connections on disk.
type Store struct {
	mu    sync.RWMutex
	dir   string                      // ~/.sequelbook/
	config Config
	conns  map[string]*ConnectionEntry // keyed by ID
}

// NewStore creates a Store, resolves the config directory, creates it if missing.
// dir overrides the default path (useful for tests); empty string → ~/.sequelbook/
func NewStore(dir string) (*Store, error) {
	if dir == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			return nil, &SettingsError{
				Operation:   "load",
				Message:     "could not resolve home directory",
				OriginalErr: err,
			}
		}
		dir = filepath.Join(home, ".sequelbook")
	}

	if err := os.MkdirAll(dir, 0700); err != nil {
		return nil, &SettingsError{
			Operation:   "load",
			Message:     "could not create config directory",
			OriginalErr: err,
		}
	}

	s := &Store{
		dir:    dir,
		config: defaultConfig(dir),
		conns:  make(map[string]*ConnectionEntry),
	}

	// Ensure the books directory exists.
	if err := os.MkdirAll(s.config.BooksDir, 0700); err != nil {
		return nil, &SettingsError{
			Operation:   "load",
			Message:     "could not create books directory",
			OriginalErr: err,
		}
	}

	return s, nil
}

// Load reads config.json and connections.json from disk.
// Missing files are not errors — defaults are used.
// Called once at startup.
func (s *Store) Load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Load config.json
	configPath := filepath.Join(s.dir, "config.json")
	data, err := os.ReadFile(configPath)
	if err != nil && !os.IsNotExist(err) {
		return &SettingsError{
			Operation:   "load",
			Message:     "could not read config.json",
			OriginalErr: err,
		}
	}
	if err == nil {
		var cfg Config
		if err := json.Unmarshal(data, &cfg); err != nil {
			return &SettingsError{
				Operation:   "load",
				Message:     "could not parse config.json",
				OriginalErr: err,
			}
		}
		// Ensure BooksDir has a default if missing from persisted config.
		if cfg.BooksDir == "" {
			cfg.BooksDir = filepath.Join(s.dir, "books")
		}
		// Ensure FontSize has a default if missing from persisted config.
		if cfg.FontSize == 0 {
			cfg.FontSize = 14
		}
		s.config = cfg
	}

	// Load connections.json
	connsPath := filepath.Join(s.dir, "connections.json")
	data, err = os.ReadFile(connsPath)
	if err != nil && !os.IsNotExist(err) {
		return &SettingsError{
			Operation:   "load",
			Message:     "could not read connections.json",
			OriginalErr: err,
		}
	}
	if err == nil {
		var entries []ConnectionEntry
		if err := json.Unmarshal(data, &entries); err != nil {
			return &SettingsError{
				Operation:   "load",
				Message:     "could not parse connections.json",
				OriginalErr: err,
			}
		}
		s.conns = make(map[string]*ConnectionEntry, len(entries))
		for i := range entries {
			e := entries[i]
			s.conns[e.ID] = &e
		}
	}

	return nil
}

// Save persists config.json to disk (atomic write via temp + rename).
func (s *Store) Save() error {
	s.mu.RLock()
	cfg := s.config
	s.mu.RUnlock()

	return s.writeJSON(filepath.Join(s.dir, "config.json"), cfg)
}

// GetConfig returns a copy of the current config.
func (s *Store) GetConfig() Config {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.config
}

// GetBooksDir returns the resolved books directory path.
func (s *Store) GetBooksDir() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.config.BooksDir
}

// UpdateConfig replaces the config and saves to disk.
func (s *Store) UpdateConfig(cfg Config) error {
	s.mu.Lock()
	s.config = cfg
	s.mu.Unlock()

	return s.Save()
}

// SaveConnection adds or updates a connection entry and persists.
// If entry.ID is empty, a new ID is assigned. Returns the entry with ID.
func (s *Store) SaveConnection(entry ConnectionEntry) (*ConnectionEntry, error) {
	if strings.TrimSpace(entry.Name) == "" {
		return nil, &SettingsError{
			Operation: "save",
			Message:   "connection name must not be empty",
		}
	}

	s.mu.Lock()
	if entry.ID == "" {
		entry.ID = newConnEntryID()
	}
	cp := entry
	s.conns[entry.ID] = &cp
	s.mu.Unlock()

	if err := s.writeConnections(); err != nil {
		return nil, err
	}

	result := entry
	return &result, nil
}

// DeleteConnection removes a connection by ID and persists.
// Returns ErrConnectionNotFound if ID doesn't exist.
func (s *Store) DeleteConnection(id string) error {
	s.mu.Lock()
	if _, ok := s.conns[id]; !ok {
		s.mu.Unlock()
		return ErrConnectionNotFound
	}
	delete(s.conns, id)
	s.mu.Unlock()

	return s.writeConnections()
}

// GetConnection returns a saved connection by ID.
func (s *Store) GetConnection(id string) (*ConnectionEntry, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	e, ok := s.conns[id]
	if !ok {
		return nil, false
	}
	cp := *e
	return &cp, true
}

// ListConnections returns all saved connections sorted by name.
func (s *Store) ListConnections() []ConnectionEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]ConnectionEntry, 0, len(s.conns))
	for _, e := range s.conns {
		result = append(result, *e)
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].Name < result[j].Name
	})
	return result
}

// writeConnections persists connections.json atomically.
func (s *Store) writeConnections() error {
	s.mu.RLock()
	entries := make([]ConnectionEntry, 0, len(s.conns))
	for _, e := range s.conns {
		entries = append(entries, *e)
	}
	s.mu.RUnlock()

	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name < entries[j].Name
	})

	return s.writeJSON(filepath.Join(s.dir, "connections.json"), entries)
}

// SaveEditorState persists the editor layout (tabs, panes, sidebar, selection) to disk.
// Uses atomic write (temp file + rename). Path: {dir}/editor.json.
func (s *Store) SaveEditorState(jsonState string) error {
	return s.writeRaw(filepath.Join(s.dir, "editor.json"), []byte(jsonState))
}

// LoadEditorState reads the persisted editor state from disk.
// Returns empty string if the file does not exist (first run).
func (s *Store) LoadEditorState() (string, error) {
	path := filepath.Join(s.dir, "editor.json")
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", &SettingsError{
			Operation:   "load",
			Message:     "could not read editor.json",
			OriginalErr: err,
		}
	}
	return string(data), nil
}

// writeRaw atomically writes raw bytes to path (temp file + rename).
func (s *Store) writeRaw(path string, data []byte) error {
	dir := filepath.Dir(path)
	tmp, err := os.CreateTemp(dir, ".sequelbook-*.tmp")
	if err != nil {
		return &SettingsError{
			Operation:   "save",
			Message:     "could not create temp file",
			OriginalErr: err,
		}
	}
	tmpPath := tmp.Name()

	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		os.Remove(tmpPath)
		return &SettingsError{
			Operation:   "save",
			Message:     "could not write temp file",
			OriginalErr: err,
		}
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmpPath)
		return &SettingsError{
			Operation:   "save",
			Message:     "could not close temp file",
			OriginalErr: err,
		}
	}

	if err := os.Rename(tmpPath, path); err != nil {
		os.Remove(tmpPath)
		return &SettingsError{
			Operation:   "save",
			Message:     "could not rename temp file",
			OriginalErr: err,
		}
	}

	return nil
}

// writeJSON atomically writes v as JSON to path (temp file + rename).
func (s *Store) writeJSON(path string, v any) error {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return &SettingsError{
			Operation:   "save",
			Message:     "could not marshal JSON",
			OriginalErr: err,
		}
	}

	dir := filepath.Dir(path)
	tmp, err := os.CreateTemp(dir, ".sequelbook-*.tmp")
	if err != nil {
		return &SettingsError{
			Operation:   "save",
			Message:     "could not create temp file",
			OriginalErr: err,
		}
	}
	tmpPath := tmp.Name()

	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		os.Remove(tmpPath)
		return &SettingsError{
			Operation:   "save",
			Message:     "could not write temp file",
			OriginalErr: err,
		}
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmpPath)
		return &SettingsError{
			Operation:   "save",
			Message:     "could not close temp file",
			OriginalErr: err,
		}
	}

	if err := os.Rename(tmpPath, path); err != nil {
		os.Remove(tmpPath)
		return &SettingsError{
			Operation:   "save",
			Message:     "could not rename temp file",
			OriginalErr: err,
		}
	}

	return nil
}

// defaultConfig returns the default app configuration.
func defaultConfig(dir string) Config {
	return Config{
		PageSize: 200,
		BooksDir: filepath.Join(dir, "books"),
		FontSize: 14,
	}
}

// newConnEntryID generates a unique connection entry identifier.
// Format: con_<xid> — mirrors core/connection.NewConnectionID without import cycle.
func newConnEntryID() string {
	return "con_" + xid.New().String()
}
