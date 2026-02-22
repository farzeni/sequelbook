package executor

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sequelbook/sequelbook/core/connection"
)

// PostgresExecutor implements the Executor interface for PostgreSQL databases.
// It uses pgxpool for connection management so that concurrent queries are
// served from separate pool connections, preventing "conn busy" panics.
type PostgresExecutor struct {
	connResolver  ConnectionResolver
	activeQueries sync.Map  // map[queryID]*queryExecution
	closed        atomic.Bool
}

// queryExecution tracks an in-flight query execution.
type queryExecution struct {
	queryID   string
	sql       string
	startTime time.Time
	cancel    context.CancelFunc
	done      chan struct{}
}

// NewPostgresExecutor creates a new PostgreSQL query executor.
func NewPostgresExecutor(resolver ConnectionResolver) *PostgresExecutor {
	return &PostgresExecutor{
		connResolver: resolver,
	}
}

// Execute runs a SQL query against the specified connection and returns the complete result.
// The query is fully buffered in memory - use with caution for large result sets.
func (e *PostgresExecutor) Execute(ctx context.Context, connID string, sql string) (*Result, error) {
	if e.closed.Load() {
		return nil, errors.New("executor is closed")
	}

	// Generate unique query ID
	queryID := NewQueryID()

	// Resolve connection pool — each Query call acquires its own connection
	// from the pool, so concurrent callers never share a single *pgx.Conn.
	pool, dbType, err := e.connResolver.GetConnection(connID)
	if err != nil {
		return nil, NewConnectionError(connID, err)
	}
	if dbType != connection.DBTypePostgres {
		return nil, NewConnectionError(connID, fmt.Errorf("PostgresExecutor requires PostgreSQL connection, got %s", dbType))
	}
	pgxPool := pool.(*connection.PgxPoolAdapter).PgxPool()

	// Create cancellable context
	queryCtx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Track query execution
	exec := &queryExecution{
		queryID:   queryID,
		sql:       sql,
		startTime: time.Now(),
		cancel:    cancel,
		done:      make(chan struct{}),
	}
	e.activeQueries.Store(queryID, exec)
	defer func() {
		close(exec.done)
		e.activeQueries.Delete(queryID)
	}()

	// Execute query — pgxpool.Pool.Query acquires a connection, runs the query,
	// and releases the connection back to the pool when rows.Close() is called.
	rows, err := pgxPool.Query(queryCtx, sql)
	if err != nil {
		return nil, e.handleExecutionError(queryCtx, queryID, sql, err)
	}
	defer rows.Close()

	// Extract column metadata
	columns := e.extractColumns(rows.FieldDescriptions())

	// Read all rows
	rowData, err := e.readRows(rows)
	if err != nil {
		return nil, e.handleExecutionError(queryCtx, queryID, sql, err)
	}

	// Build result metadata
	endTime := time.Now()
	meta := QueryMeta{
		StartTime:  exec.startTime,
		EndTime:    endTime,
		Duration:   endTime.Sub(exec.startTime),
		CommandTag: rows.CommandTag().String(),
		RowCount:   rows.CommandTag().RowsAffected(),
	}

	return &Result{
		QueryID: queryID,
		Columns: columns,
		Rows:    rowData,
		Meta:    meta,
	}, nil
}

// Cancel attempts to cancel a running query by its query ID.
// Returns an error if the query is not found or has already completed.
func (e *PostgresExecutor) Cancel(queryID string) error {
	val, ok := e.activeQueries.Load(queryID)
	if !ok {
		return fmt.Errorf("query not found or already completed: %s", queryID)
	}

	exec := val.(*queryExecution)
	exec.cancel()

	// Wait for query to finish (with timeout)
	timeout := time.NewTimer(5 * time.Second)
	defer timeout.Stop()

	select {
	case <-exec.done:
		return nil
	case <-timeout.C:
		return fmt.Errorf("timeout waiting for query to cancel: %s", queryID)
	}
}

// Close shuts down the executor and cancels all active queries.
// It waits for all active queries to complete with a 5-second timeout.
func (e *PostgresExecutor) Close() error {
	if !e.closed.CompareAndSwap(false, true) {
		return errors.New("executor already closed")
	}

	// Collect all active queries and cancel them
	var activeExecs []*queryExecution
	e.activeQueries.Range(func(key, value any) bool {
		exec := value.(*queryExecution)
		activeExecs = append(activeExecs, exec)
		exec.cancel()
		return true
	})

	// Wait for all queries to finish with timeout
	timeout := time.NewTimer(5 * time.Second)
	defer timeout.Stop()

	for _, exec := range activeExecs {
		select {
		case <-exec.done:
			// Query finished successfully
		case <-timeout.C:
			return fmt.Errorf("timeout waiting for %d queries to finish", len(activeExecs))
		}
	}

	return nil
}

// extractColumns converts pgx field descriptions to Column metadata.
func (e *PostgresExecutor) extractColumns(fields []pgconn.FieldDescription) []Column {
	columns := make([]Column, len(fields))
	for i, field := range fields {
		columns[i] = fieldDescToColumn(field)
	}
	return columns
}

// fieldDescToColumn converts a single pgx field description to a Column.
func fieldDescToColumn(fd pgconn.FieldDescription) Column {
	typeName := oidToTypeName(fd.DataTypeOID)
	displayType := oidToDisplayType(fd.DataTypeOID)

	return Column{
		Name:         fd.Name,
		DatabaseType: typeName,
		OID:          fd.DataTypeOID,
		DisplayType:  displayType,
		Nullable:     true, // PostgreSQL doesn't provide this info in FieldDescription
		TableOID:     fd.TableOID,
		TableColumn:  int16(fd.TableAttributeNumber),
	}
}

// readRows reads all rows from the result set into memory.
func (e *PostgresExecutor) readRows(rows pgx.Rows) ([][]any, error) {
	var rowData [][]any

	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			return nil, err
		}
		rowData = append(rowData, values)
	}

	// Check for errors during iteration
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return rowData, nil
}

// handleExecutionError processes errors from query execution and converts them
// to ExecutionError with appropriate context detection (timeout, cancellation, etc.).
func (e *PostgresExecutor) handleExecutionError(ctx context.Context, queryID, sql string, err error) error {
	// Check if context was cancelled or timed out
	if errors.Is(ctx.Err(), context.Canceled) {
		return NewCancellationError(queryID, sql)
	}
	if errors.Is(ctx.Err(), context.DeadlineExceeded) {
		return NewTimeoutError(queryID, sql)
	}

	// Normalize to ExecutionError with PostgreSQL details
	return normalizeError(queryID, sql, err)
}
