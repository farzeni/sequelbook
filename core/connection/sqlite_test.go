package connection

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSQLiteConnector_Connect_InMemory(t *testing.T) {
	conn := &SQLiteConnector{}
	ctx := context.Background()

	pool, err := conn.Connect(ctx, ConnectionConfig{
		Type:     "sqlite",
		Database: ":memory:",
	})
	require.NoError(t, err)
	defer pool.Close()

	err = pool.Ping(ctx)
	require.NoError(t, err)
}

func TestSQLiteConnector_Connect_File(t *testing.T) {
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")

	conn := &SQLiteConnector{}
	ctx := context.Background()

	pool, err := conn.Connect(ctx, ConnectionConfig{
		Type:     "sqlite",
		Database: dbPath,
	})
	require.NoError(t, err)
	defer pool.Close()

	err = pool.Ping(ctx)
	require.NoError(t, err)

	// Verify file was created
	_, err = os.Stat(dbPath)
	require.NoError(t, err)
}
