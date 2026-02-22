package settings

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// --- Constructor ---

func TestNewStore_DefaultDir(t *testing.T) {
	// Passing empty string should use os.UserHomeDir — just verify no error
	// when HOME is set (which it always is in test environments).
	s, err := NewStore("")
	if err != nil {
		t.Skipf("skipping: home dir not available: %v", err)
	}
	assert.NotEmpty(t, s.dir)
	assert.Contains(t, s.dir, ".sequelbook")
}

func TestNewStore_MkdirAll_Error(t *testing.T) {
	// Use a file (not a directory) as the parent to force MkdirAll to fail.
	f, err := os.CreateTemp(t.TempDir(), "not-a-dir")
	require.NoError(t, err)
	f.Close()

	_, err = NewStore(filepath.Join(f.Name(), "child"))
	require.Error(t, err)
	var se *SettingsError
	require.True(t, errors.As(err, &se))
	assert.Equal(t, "load", se.Operation)
}

func TestNewStore_CreatesDir(t *testing.T) {
	base := t.TempDir()
	dir := filepath.Join(base, "sequelbook")

	s, err := NewStore(dir)
	require.NoError(t, err)
	assert.Equal(t, dir, s.dir)

	info, err := os.Stat(dir)
	require.NoError(t, err)
	assert.True(t, info.IsDir())
	assert.Equal(t, os.FileMode(0700), info.Mode().Perm())
}

// --- Load ---

func TestStore_Load_EmptyDir(t *testing.T) {
	s, err := NewStore(t.TempDir())
	require.NoError(t, err)

	require.NoError(t, s.Load())
	assert.Equal(t, defaultConfig(s.dir), s.GetConfig())
	assert.Empty(t, s.ListConnections())
}

func TestStore_Load_ExistingConfig(t *testing.T) {
	dir := t.TempDir()
	cfg := Config{PageSize: 50}
	data, _ := json.Marshal(cfg)
	require.NoError(t, os.WriteFile(filepath.Join(dir, "config.json"), data, 0600))

	s, err := NewStore(dir)
	require.NoError(t, err)
	require.NoError(t, s.Load())

	assert.Equal(t, 50, s.GetConfig().PageSize)
}

func TestStore_Load_ExistingConnections(t *testing.T) {
	dir := t.TempDir()
	entries := []ConnectionEntry{
		{ID: "con_aaa", Name: "prod", Host: "localhost", Port: 5432},
		{ID: "con_bbb", Name: "staging", Host: "db.example.com", Port: 5432},
	}
	data, _ := json.Marshal(entries)
	require.NoError(t, os.WriteFile(filepath.Join(dir, "connections.json"), data, 0600))

	s, err := NewStore(dir)
	require.NoError(t, err)
	require.NoError(t, s.Load())

	list := s.ListConnections()
	assert.Len(t, list, 2)

	e, ok := s.GetConnection("con_aaa")
	require.True(t, ok)
	assert.Equal(t, "prod", e.Name)
}

func TestStore_Load_CorruptJSON(t *testing.T) {
	dir := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(dir, "config.json"), []byte("{bad json"), 0600))

	s, err := NewStore(dir)
	require.NoError(t, err)

	err = s.Load()
	require.Error(t, err)

	var se *SettingsError
	require.True(t, errors.As(err, &se))
	assert.NotNil(t, se.OriginalErr)
}

// --- Save / GetConfig ---

func TestStore_Save_AtomicWrite(t *testing.T) {
	dir := t.TempDir()
	s, err := NewStore(dir)
	require.NoError(t, err)

	require.NoError(t, s.Save())

	data, err := os.ReadFile(filepath.Join(dir, "config.json"))
	require.NoError(t, err)

	var cfg Config
	require.NoError(t, json.Unmarshal(data, &cfg))
	assert.Equal(t, defaultConfig(s.dir), cfg)
}

func TestStore_GetConfig_ReturnsDefaults(t *testing.T) {
	s, err := NewStore(t.TempDir())
	require.NoError(t, err)

	// No Load called — should return defaultConfig
	assert.Equal(t, defaultConfig(s.dir), s.GetConfig())
}

func TestStore_UpdateConfig(t *testing.T) {
	dir := t.TempDir()
	s, err := NewStore(dir)
	require.NoError(t, err)

	newCfg := Config{PageSize: 100}
	require.NoError(t, s.UpdateConfig(newCfg))
	assert.Equal(t, 100, s.GetConfig().PageSize)

	// Verify persisted
	data, err := os.ReadFile(filepath.Join(dir, "config.json"))
	require.NoError(t, err)
	var persisted Config
	require.NoError(t, json.Unmarshal(data, &persisted))
	assert.Equal(t, 100, persisted.PageSize)
}

// --- SaveConnection ---

func TestStore_SaveConnection_New(t *testing.T) {
	dir := t.TempDir()
	s, err := NewStore(dir)
	require.NoError(t, err)

	entry := ConnectionEntry{Name: "local", Host: "localhost", Port: 5432}
	saved, err := s.SaveConnection(entry)
	require.NoError(t, err)
	assert.NotEmpty(t, saved.ID)
	assert.True(t, strings.HasPrefix(saved.ID, "con_"))

	got, ok := s.GetConnection(saved.ID)
	require.True(t, ok)
	assert.Equal(t, "local", got.Name)

	// Verify persisted
	data, err := os.ReadFile(filepath.Join(dir, "connections.json"))
	require.NoError(t, err)
	var entries []ConnectionEntry
	require.NoError(t, json.Unmarshal(data, &entries))
	assert.Len(t, entries, 1)
}

func TestStore_SaveConnection_Update(t *testing.T) {
	s, err := NewStore(t.TempDir())
	require.NoError(t, err)

	orig, err := s.SaveConnection(ConnectionEntry{Name: "original"})
	require.NoError(t, err)

	updated := ConnectionEntry{ID: orig.ID, Name: "updated", Host: "newhost"}
	saved, err := s.SaveConnection(updated)
	require.NoError(t, err)
	assert.Equal(t, orig.ID, saved.ID)

	got, _ := s.GetConnection(orig.ID)
	assert.Equal(t, "updated", got.Name)
	assert.Equal(t, "newhost", got.Host)

	assert.Len(t, s.ListConnections(), 1)
}

func TestStore_SaveConnection_Validation(t *testing.T) {
	s, err := NewStore(t.TempDir())
	require.NoError(t, err)

	_, err = s.SaveConnection(ConnectionEntry{Name: ""})
	require.Error(t, err)

	_, err = s.SaveConnection(ConnectionEntry{Name: "   "})
	require.Error(t, err)
}

// --- DeleteConnection ---

func TestStore_DeleteConnection_Valid(t *testing.T) {
	dir := t.TempDir()
	s, err := NewStore(dir)
	require.NoError(t, err)

	saved, err := s.SaveConnection(ConnectionEntry{Name: "todelete"})
	require.NoError(t, err)

	require.NoError(t, s.DeleteConnection(saved.ID))

	_, ok := s.GetConnection(saved.ID)
	assert.False(t, ok)

	// Verify persisted
	data, err := os.ReadFile(filepath.Join(dir, "connections.json"))
	require.NoError(t, err)
	var entries []ConnectionEntry
	require.NoError(t, json.Unmarshal(data, &entries))
	assert.Empty(t, entries)
}

func TestStore_DeleteConnection_NotFound(t *testing.T) {
	s, err := NewStore(t.TempDir())
	require.NoError(t, err)

	err = s.DeleteConnection("con_nonexistent")
	require.ErrorIs(t, err, ErrConnectionNotFound)
}

// --- GetConnection ---

func TestStore_GetConnection_Valid(t *testing.T) {
	s, err := NewStore(t.TempDir())
	require.NoError(t, err)

	saved, err := s.SaveConnection(ConnectionEntry{Name: "myconn", Host: "db.local"})
	require.NoError(t, err)

	got, ok := s.GetConnection(saved.ID)
	require.True(t, ok)
	assert.Equal(t, "myconn", got.Name)
	assert.Equal(t, "db.local", got.Host)
}

func TestStore_GetConnection_NotFound(t *testing.T) {
	s, err := NewStore(t.TempDir())
	require.NoError(t, err)

	_, ok := s.GetConnection("con_missing")
	assert.False(t, ok)
}

// --- ListConnections ---

func TestStore_ListConnections_Sorted(t *testing.T) {
	s, err := NewStore(t.TempDir())
	require.NoError(t, err)

	names := []string{"zebra", "alpha", "middle"}
	for _, n := range names {
		_, err := s.SaveConnection(ConnectionEntry{Name: n})
		require.NoError(t, err)
	}

	list := s.ListConnections()
	require.Len(t, list, 3)
	assert.Equal(t, "alpha", list[0].Name)
	assert.Equal(t, "middle", list[1].Name)
	assert.Equal(t, "zebra", list[2].Name)
}

func TestStore_ListConnections_Empty(t *testing.T) {
	s, err := NewStore(t.TempDir())
	require.NoError(t, err)

	list := s.ListConnections()
	assert.NotNil(t, list)
	assert.Empty(t, list)
}

// --- Concurrency ---

func TestStore_Concurrency(t *testing.T) {
	s, err := NewStore(t.TempDir())
	require.NoError(t, err)

	// Pre-seed one connection for deletes
	seed, err := s.SaveConnection(ConnectionEntry{Name: "seed"})
	require.NoError(t, err)

	var wg sync.WaitGroup
	for i := range 20 {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			switch i % 3 {
			case 0:
				s.UpdateConfig(Config{PageSize: 100 + i}) //nolint:errcheck
			case 1:
				s.GetConnection(seed.ID)
			case 2:
				s.ListConnections()
			}
		}(i)
	}
	wg.Wait()
}

// --- writeJSON error paths ---

func TestStore_WriteJSON_CreateTempError(t *testing.T) {
	dir := t.TempDir()
	s, err := NewStore(dir)
	require.NoError(t, err)

	// Make dir read-only so CreateTemp fails.
	require.NoError(t, os.Chmod(dir, 0500))
	t.Cleanup(func() { os.Chmod(dir, 0700) })

	err = s.Save()
	require.Error(t, err)
	var se *SettingsError
	require.True(t, errors.As(err, &se))
	assert.Equal(t, "save", se.Operation)
}

func TestStore_Load_CorruptConnections(t *testing.T) {
	dir := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(dir, "connections.json"), []byte("[bad"), 0600))

	s, err := NewStore(dir)
	require.NoError(t, err)

	err = s.Load()
	require.Error(t, err)
	var se *SettingsError
	require.True(t, errors.As(err, &se))
	assert.NotNil(t, se.OriginalErr)
}

// --- SettingsError ---

func TestSettingsError_Format(t *testing.T) {
	e := &SettingsError{Operation: "load", Message: "file missing"}
	assert.Equal(t, "load: file missing", e.Error())
}

func TestSettingsError_Unwrap(t *testing.T) {
	inner := errors.New("inner error")
	e := &SettingsError{Operation: "save", Message: "disk full", OriginalErr: inner}
	assert.True(t, errors.Is(e, inner))
}
