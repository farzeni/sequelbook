package executor

import (
	"context"
	"fmt"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sequelbook/sequelbook/core/connection"
)

// setupTestDB connects to a PostgreSQL test instance via a connection pool
// and returns the pool and a cleanup function.
//
// To start the test database:
//
//	docker run --name sequelbook-test-db \
//	  -e POSTGRES_PASSWORD=test \
//	  -e POSTGRES_DB=sequelbook_test \
//	  -p 5432:5432 -d postgres:16-alpine
//
// Tests requiring a database should skip when testing.Short() is true.
func setupTestDB(t *testing.T) (*pgxpool.Pool, func()) {
	t.Helper()
	return setupTestPool(t)
}

// setupTestPool creates a connection pool for testing.
// Returns the pool and a cleanup function that closes it.
func setupTestPool(t *testing.T) (*pgxpool.Pool, func()) {
	t.Helper()

	connString := os.Getenv("SEQUELBOOK_TEST_DB")
	if connString == "" {
		connString = "postgres://postgres:test@localhost:5432/sequelbook_test?sslmode=disable"
	}

	pool, err := pgxpool.New(context.Background(), connString)
	if err != nil {
		t.Fatalf("Failed to create test pool: %v\nMake sure test database is running:\n  docker run --name sequelbook-test-db -e POSTGRES_PASSWORD=test -e POSTGRES_DB=sequelbook_test -p 5432:5432 -d postgres:16-alpine", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		t.Fatalf("Failed to ping test database pool: %v", err)
	}

	return pool, pool.Close
}

// mockConnectionResolver is a ConnectionResolver implementation for testing.
type mockConnectionResolver struct {
	pool *pgxpool.Pool
	err  error
}

// newMockResolver creates a mock resolver that returns the given pool.
func newMockResolver(pool *pgxpool.Pool) *mockConnectionResolver {
	return &mockConnectionResolver{pool: pool}
}

// newPoolResolver creates a resolver backed by a connection pool.
// Alias for newMockResolver kept for clarity in concurrency tests.
func newPoolResolver(pool *pgxpool.Pool) *mockConnectionResolver {
	return &mockConnectionResolver{pool: pool}
}

// newErrorResolver creates a mock resolver that always returns an error.
func newErrorResolver(err error) *mockConnectionResolver {
	return &mockConnectionResolver{err: err}
}

// GetConnection implements ConnectionResolver.
func (m *mockConnectionResolver) GetConnection(connID string) (connection.Pool, connection.DBType, error) {
	if m.err != nil {
		return nil, "", m.err
	}
	if m.pool == nil {
		return nil, "", fmt.Errorf("connection not found: %s", connID)
	}
	return connection.NewPgxPoolAdapter(m.pool), connection.DBTypePostgres, nil
}
