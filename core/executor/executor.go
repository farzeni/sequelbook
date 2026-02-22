package executor

import (
	"context"
	"time"

	"github.com/sequelbook/sequelbook/core/connection"
	"github.com/rs/xid"
)

// Executor executes SQL queries against database connections.
// It provides thread-safe query execution with cancellation support
// and rich metadata for frontend rendering.
type Executor interface {
	// Execute runs a SQL query against the specified connection.
	// Returns a Result containing columns, rows, and execution metadata.
	// The context can be used to cancel the query execution.
	Execute(ctx context.Context, connID string, sql string) (*Result, error)

	// Cancel attempts to cancel a running query by its query ID.
	// Returns an error if the query is not found or cancellation fails.
	Cancel(queryID string) error

	// Close shuts down the executor and cancels all active queries.
	Close() error
}

// ConnectionResolver resolves connection IDs to active connection pools.
// This interface allows the executor to work independently from connection
// lifecycle management.
type ConnectionResolver interface {
	// GetConnection returns an active pool and its database type for the given ID.
	// Returns an error if the connection is not found or not available.
	GetConnection(connID string) (connection.Pool, connection.DBType, error)
}

// Result contains the complete outcome of a query execution.
type Result struct {
	QueryID string      `json:"queryId"`  // Unique identifier for this execution
	Columns []Column    `json:"columns"`  // Column metadata
	Rows    [][]any     `json:"rows"`     // Row data (each row is a slice of values)
	Meta    QueryMeta   `json:"meta"`     // Execution metadata
}

// QueryMeta contains execution statistics and timing information.
type QueryMeta struct {
	StartTime  time.Time     `json:"startTime"`  // When execution started
	EndTime    time.Time     `json:"endTime"`    // When execution completed
	Duration   time.Duration `json:"duration"`   // Total execution time
	RowCount   int64         `json:"rowCount"`   // Number of rows returned/affected
	CommandTag string        `json:"commandTag"` // PostgreSQL command tag (e.g., "SELECT 10")
}

// Column represents metadata for a single result column.
type Column struct {
	Name         string      `json:"name"`         // Column name
	DatabaseType string      `json:"databaseType"` // PostgreSQL type name (e.g., "int4", "varchar")
	OID          uint32      `json:"oid"`          // PostgreSQL type OID
	DisplayType  DisplayType `json:"displayType"`  // Frontend rendering hint
	Nullable     bool        `json:"nullable"`     // Whether column allows NULL (always true for now)
	TableOID     uint32      `json:"tableOid"`     // Source table OID (0 if not a table column)
	TableColumn  int16       `json:"tableColumn"`  // Source column number (0 if not a table column)
}

// NewQueryID generates a unique query execution identifier.
// Format: qry_<xid> (e.g., qry_cn8s7hsc18o0jt80qjbg)
func NewQueryID() string {
	return "qry_" + xid.New().String()
}
