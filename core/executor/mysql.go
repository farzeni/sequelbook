package executor

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sequelbook/sequelbook/core/connection"
)

// MySQLExecutor implements the Executor interface for MySQL databases.
type MySQLExecutor struct {
	connResolver  ConnectionResolver
	activeQueries sync.Map
	closed        atomic.Bool
}

// NewMySQLExecutor creates a new MySQL query executor.
func NewMySQLExecutor(resolver ConnectionResolver) *MySQLExecutor {
	return &MySQLExecutor{connResolver: resolver}
}

// Execute runs a SQL query against the specified connection.
func (e *MySQLExecutor) Execute(ctx context.Context, connID string, sql string) (*Result, error) {
	if e.closed.Load() {
		return nil, errors.New("executor is closed")
	}

	queryID := NewQueryID()

	pool, dbType, err := e.connResolver.GetConnection(connID)
	if err != nil {
		return nil, NewConnectionError(connID, err)
	}
	if dbType != connection.DBTypeMySQL {
		return nil, NewConnectionError(connID, fmt.Errorf("MySQLExecutor requires MySQL connection, got %s", dbType))
	}

	db := pool.(*connection.SQLDBAdapter).DB()

	queryCtx, cancel := context.WithCancel(ctx)
	defer cancel()

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

	rows, err := db.QueryContext(queryCtx, sql)
	if err != nil {
		return nil, e.handleExecutionError(queryCtx, queryID, sql, err)
	}
	defer rows.Close()

	columns, err := columnsFromSQLRows(rows, mysqlTypeToDisplayType)
	if err != nil {
		return nil, e.handleExecutionError(queryCtx, queryID, sql, err)
	}

	rowData, err := readSQLRows(rows)
	if err != nil {
		return nil, e.handleExecutionError(queryCtx, queryID, sql, err)
	}

	endTime := time.Now()
	meta := QueryMeta{
		StartTime:  exec.startTime,
		EndTime:    endTime,
		Duration:   endTime.Sub(exec.startTime),
		CommandTag: fmt.Sprintf("SELECT %d", len(rowData)),
		RowCount:   int64(len(rowData)),
	}

	return &Result{
		QueryID: queryID,
		Columns: columns,
		Rows:    rowData,
		Meta:    meta,
	}, nil
}

// Cancel attempts to cancel a running query.
func (e *MySQLExecutor) Cancel(queryID string) error {
	val, ok := e.activeQueries.Load(queryID)
	if !ok {
		return fmt.Errorf("query not found or already completed: %s", queryID)
	}
	exec := val.(*queryExecution)
	exec.cancel()

	timeout := time.NewTimer(5 * time.Second)
	defer timeout.Stop()

	select {
	case <-exec.done:
		return nil
	case <-timeout.C:
		return fmt.Errorf("timeout waiting for query to cancel: %s", queryID)
	}
}

// Close shuts down the executor.
func (e *MySQLExecutor) Close() error {
	if !e.closed.CompareAndSwap(false, true) {
		return errors.New("executor already closed")
	}

	var activeExecs []*queryExecution
	e.activeQueries.Range(func(key, value any) bool {
		exec := value.(*queryExecution)
		activeExecs = append(activeExecs, exec)
		exec.cancel()
		return true
	})

	timeout := time.NewTimer(5 * time.Second)
	defer timeout.Stop()

	for _, exec := range activeExecs {
		select {
		case <-exec.done:
		case <-timeout.C:
			return fmt.Errorf("timeout waiting for %d queries to finish", len(activeExecs))
		}
	}

	return nil
}

func (e *MySQLExecutor) handleExecutionError(ctx context.Context, queryID, sql string, err error) error {
	if errors.Is(ctx.Err(), context.Canceled) {
		return NewCancellationError(queryID, sql)
	}
	if errors.Is(ctx.Err(), context.DeadlineExceeded) {
		return NewTimeoutError(queryID, sql)
	}
	return normalizeError(queryID, sql, err)
}

// readSQLRows reads all rows from database/sql rows into [][]any.
func readSQLRows(rows *sql.Rows) ([][]any, error) {
	colNames, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	cols := len(colNames)

	var rowData [][]any
	for rows.Next() {
		values := make([]any, cols)
		ptrs := make([]any, cols)
		for i := range values {
			ptrs[i] = &values[i]
		}
		if err := rows.Scan(ptrs...); err != nil {
			return nil, err
		}
		rowData = append(rowData, values)
	}
	return rowData, rows.Err()
}
