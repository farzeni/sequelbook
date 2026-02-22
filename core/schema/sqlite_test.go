package schema

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/sequelbook/sequelbook/core/connection"
	_ "modernc.org/sqlite"
)

func setupSQLiteTestDB(t *testing.T) (connection.Pool, func()) {
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")

	db, err := sql.Open("sqlite", dbPath)
	require.NoError(t, err)

	_, err = db.Exec(`
		CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
		CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT, user_id INTEGER);
	`)
	require.NoError(t, err)

	pool := connection.NewSQLDBAdapter(db)
	return pool, func() { pool.Close() }
}

func TestSQLiteInspector_ListSchemas(t *testing.T) {
	pool, cleanup := setupSQLiteTestDB(t)
	defer cleanup()

	insp := &SQLiteInspector{}
	ctx := context.Background()

	schemas, err := insp.ListSchemas(ctx, pool)
	require.NoError(t, err)
	assert.Len(t, schemas, 1)
	assert.Equal(t, "main", schemas[0].Name)
}

func TestSQLiteInspector_ListTables(t *testing.T) {
	pool, cleanup := setupSQLiteTestDB(t)
	defer cleanup()

	insp := &SQLiteInspector{}
	ctx := context.Background()

	tables, err := insp.ListTables(ctx, pool, "")
	require.NoError(t, err)
	assert.Len(t, tables, 2)
	names := []string{tables[0].Name, tables[1].Name}
	assert.Contains(t, names, "users")
	assert.Contains(t, names, "posts")
}

func TestSQLiteInspector_ListColumns(t *testing.T) {
	pool, cleanup := setupSQLiteTestDB(t)
	defer cleanup()

	insp := &SQLiteInspector{}
	ctx := context.Background()

	columns, err := insp.ListColumns(ctx, pool, "", "users")
	require.NoError(t, err)
	require.Len(t, columns, 3)

	assert.Equal(t, "id", columns[0].Name)
	assert.True(t, columns[0].IsPrimaryKey)
	assert.Equal(t, "name", columns[1].Name)
	assert.False(t, columns[1].IsNullable) // NOT NULL
	assert.Equal(t, "email", columns[2].Name)
}
