package executor

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"

	"github.com/sequelbook/sequelbook/core/connection"
)

// MultiExecutor delegates to the appropriate executor based on the connection's DBType.
type MultiExecutor struct {
	resolver      ConnectionResolver
	pgExec        *PostgresExecutor
	mysqlExec     *MySQLExecutor
	sqliteExec    *SQLiteExecutor
	activeQueries sync.Map
	closed        atomic.Bool
}

// NewMultiExecutor creates a MultiExecutor with all engine executors.
func NewMultiExecutor(resolver ConnectionResolver) *MultiExecutor {
	return &MultiExecutor{
		resolver:   resolver,
		pgExec:    NewPostgresExecutor(resolver),
		mysqlExec: NewMySQLExecutor(resolver),
		sqliteExec: NewSQLiteExecutor(resolver),
	}
}

// Execute delegates to the appropriate executor based on the connection's DBType.
func (e *MultiExecutor) Execute(ctx context.Context, connID string, sql string) (*Result, error) {
	if e.closed.Load() {
		return nil, errors.New("executor is closed")
	}

	_, dbType, err := e.resolver.GetConnection(connID)
	if err != nil {
		return nil, NewConnectionError(connID, err)
	}

	switch dbType {
	case connection.DBTypePostgres:
		return e.pgExec.Execute(ctx, connID, sql)
	case connection.DBTypeMySQL:
		return e.mysqlExec.Execute(ctx, connID, sql)
	case connection.DBTypeSQLite:
		return e.sqliteExec.Execute(ctx, connID, sql)
	default:
		return nil, NewConnectionError(connID, fmt.Errorf("unsupported database type: %s", dbType))
	}
}

// Cancel delegates to all executors (the correct one will handle it).
func (e *MultiExecutor) Cancel(queryID string) error {
	if err := e.pgExec.Cancel(queryID); err == nil {
		return nil
	}
	if err := e.mysqlExec.Cancel(queryID); err == nil {
		return nil
	}
	return e.sqliteExec.Cancel(queryID)
}

// Close shuts down all executors.
func (e *MultiExecutor) Close() error {
	if !e.closed.CompareAndSwap(false, true) {
		return errors.New("executor already closed")
	}

	var errs []error
	if err := e.pgExec.Close(); err != nil {
		errs = append(errs, err)
	}
	if err := e.mysqlExec.Close(); err != nil {
		errs = append(errs, err)
	}
	if err := e.sqliteExec.Close(); err != nil {
		errs = append(errs, err)
	}

	if len(errs) > 0 {
		return fmt.Errorf("close errors: %v", errs)
	}
	return nil
}
