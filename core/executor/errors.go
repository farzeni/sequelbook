package executor

import (
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
)

// ExecutionError represents a query execution failure with PostgreSQL error details.
type ExecutionError struct {
	QueryID      string // Query execution ID
	SQL          string // SQL statement (truncated if too long)
	Code         string // PostgreSQL error code (e.g., "42P01" for undefined table)
	Message      string // Primary error message
	Detail       string // Additional error details (optional)
	Hint         string // Suggestion for fixing the error (optional)
	Position     int32  // Character position in SQL where error occurred (0 = not applicable)
	InternalPos  int32  // Internal query position (for errors in PL/pgSQL, etc.)
	InternalSQL  string // Internal query text (for errors in PL/pgSQL, etc.)
	OriginalErr  error  // Underlying error for unwrapping
}

// Error implements the error interface.
func (e *ExecutionError) Error() string {
	var sb strings.Builder

	if e.QueryID != "" {
		sb.WriteString("[")
		sb.WriteString(e.QueryID)
		sb.WriteString("] ")
	}

	sb.WriteString(e.Message)

	if e.Code != "" {
		sb.WriteString(" (")
		sb.WriteString(e.Code)
		sb.WriteString(")")
	}

	if e.Position > 0 {
		sb.WriteString(fmt.Sprintf(" at position %d", e.Position))
	}

	if e.Detail != "" {
		sb.WriteString(": ")
		sb.WriteString(e.Detail)
	}

	if e.Hint != "" {
		sb.WriteString(" [hint: ")
		sb.WriteString(e.Hint)
		sb.WriteString("]")
	}

	return sb.String()
}

// Unwrap returns the underlying error for error wrapping.
func (e *ExecutionError) Unwrap() error {
	return e.OriginalErr
}

// NewConnectionError creates an error for connection resolution failures.
func NewConnectionError(connID string, err error) *ExecutionError {
	return &ExecutionError{
		Code:        "08003", // PostgreSQL: connection does not exist
		Message:     fmt.Sprintf("connection not found or unavailable: %s", connID),
		OriginalErr: err,
	}
}

// NewTimeoutError creates an error for query timeouts.
func NewTimeoutError(queryID, sql string) *ExecutionError {
	return &ExecutionError{
		QueryID:     queryID,
		SQL:         truncateSQL(sql, 100),
		Code:        "57014", // PostgreSQL: query_canceled (closest match)
		Message:     "query execution timeout",
		Hint:        "increase timeout or optimize query",
		OriginalErr: errors.New("context deadline exceeded"),
	}
}

// NewCancellationError creates an error for user-cancelled queries.
func NewCancellationError(queryID, sql string) *ExecutionError {
	return &ExecutionError{
		QueryID:     queryID,
		SQL:         truncateSQL(sql, 100),
		Code:        "57014", // PostgreSQL: query_canceled
		Message:     "query cancelled by user",
		OriginalErr: errors.New("context canceled"),
	}
}

// normalizeError converts various error types to ExecutionError.
// It extracts PostgreSQL error details from pgconn.PgError and enriches
// generic errors with query context.
func normalizeError(queryID, sql string, err error) *ExecutionError {
	if err == nil {
		return nil
	}

	// Already an ExecutionError - just ensure QueryID and SQL are set
	var execErr *ExecutionError
	if errors.As(err, &execErr) {
		if execErr.QueryID == "" {
			execErr.QueryID = queryID
		}
		if execErr.SQL == "" {
			execErr.SQL = truncateSQL(sql, 100)
		}
		return execErr
	}

	// Extract PostgreSQL error details
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return &ExecutionError{
			QueryID:     queryID,
			SQL:         truncateSQL(sql, 100),
			Code:        pgErr.Code,
			Message:     pgErr.Message,
			Detail:      pgErr.Detail,
			Hint:        pgErr.Hint,
			Position:    pgErr.Position,
			InternalPos: pgErr.InternalPosition,
			InternalSQL: pgErr.InternalQuery,
			OriginalErr: err,
		}
	}

	// Generic error - wrap it
	return &ExecutionError{
		QueryID:     queryID,
		SQL:         truncateSQL(sql, 100),
		Message:     err.Error(),
		OriginalErr: err,
	}
}

// truncateSQL truncates a SQL statement to a maximum length for error messages.
// This prevents log spam from large queries.
func truncateSQL(sql string, maxLen int) string {
	sql = strings.TrimSpace(sql)
	if len(sql) <= maxLen {
		return sql
	}
	return sql[:maxLen] + "..."
}
