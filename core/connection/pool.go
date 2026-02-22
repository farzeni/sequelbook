package connection

import (
	"context"
	"database/sql"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PgxPoolAdapter wraps *pgxpool.Pool to satisfy the Pool interface.
// Use PgxPool() to obtain the underlying pool for pgx-specific operations.
type PgxPoolAdapter struct {
	pool *pgxpool.Pool
}

// NewPgxPoolAdapter creates an adapter for a pgx pool.
func NewPgxPoolAdapter(pool *pgxpool.Pool) *PgxPoolAdapter {
	return &PgxPoolAdapter{pool: pool}
}

// PgxPool returns the underlying pgx pool.
func (p *PgxPoolAdapter) PgxPool() *pgxpool.Pool {
	return p.pool
}

// Ping implements Pool.
func (p *PgxPoolAdapter) Ping(ctx context.Context) error {
	return p.pool.Ping(ctx)
}

// Close implements Pool.
func (p *PgxPoolAdapter) Close() {
	p.pool.Close()
}

// SQLDBAdapter wraps *sql.DB to satisfy the Pool interface.
// Use DB() to obtain the underlying database handle for database/sql operations.
type SQLDBAdapter struct {
	db *sql.DB
}

// NewSQLDBAdapter creates an adapter for a database/sql DB.
func NewSQLDBAdapter(db *sql.DB) *SQLDBAdapter {
	return &SQLDBAdapter{db: db}
}

// DB returns the underlying *sql.DB.
func (s *SQLDBAdapter) DB() *sql.DB {
	return s.db
}

// Ping implements Pool.
func (s *SQLDBAdapter) Ping(ctx context.Context) error {
	return s.db.PingContext(ctx)
}

// Close implements Pool.
func (s *SQLDBAdapter) Close() {
	s.db.Close()
}
