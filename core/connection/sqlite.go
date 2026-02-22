package connection

import (
	"context"
	"database/sql"

	_ "modernc.org/sqlite"
)

// SQLiteConnector implements Connector for SQLite via database/sql.
// For SQLite, config.Database is the path to the database file.
// Use ":memory:" for an in-memory database.
type SQLiteConnector struct{}

// Connect opens a SQLite database. config.Database is the file path (or ":memory:").
func (c *SQLiteConnector) Connect(ctx context.Context, config ConnectionConfig) (Pool, error) {
	dsn := config.Database
	if dsn == "" {
		dsn = ":memory:"
	}

	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, err
	}

	return NewSQLDBAdapter(db), nil
}
