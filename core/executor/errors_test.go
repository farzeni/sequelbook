package executor

import (
	"errors"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExecutionError_Error(t *testing.T) {
	tests := []struct {
		name string
		err  *ExecutionError
		want string
	}{
		{
			name: "basic error",
			err: &ExecutionError{
				Message: "syntax error",
			},
			want: "syntax error",
		},
		{
			name: "with query ID",
			err: &ExecutionError{
				QueryID: "qry_123",
				Message: "syntax error",
			},
			want: "[qry_123] syntax error",
		},
		{
			name: "with code",
			err: &ExecutionError{
				Message: "syntax error",
				Code:    "42601",
			},
			want: "syntax error (42601)",
		},
		{
			name: "with position",
			err: &ExecutionError{
				Message:  "syntax error",
				Code:     "42601",
				Position: 15,
			},
			want: "syntax error (42601) at position 15",
		},
		{
			name: "with detail",
			err: &ExecutionError{
				Message: "undefined table",
				Code:    "42P01",
				Detail:  "table \"users\" does not exist",
			},
			want: "undefined table (42P01): table \"users\" does not exist",
		},
		{
			name: "with hint",
			err: &ExecutionError{
				Message: "syntax error",
				Code:    "42601",
				Hint:    "check your SQL syntax",
			},
			want: "syntax error (42601) [hint: check your SQL syntax]",
		},
		{
			name: "complete error",
			err: &ExecutionError{
				QueryID:  "qry_456",
				Message:  "undefined column",
				Code:     "42703",
				Detail:   "column \"name\" does not exist",
				Hint:     "perhaps you meant \"username\"",
				Position: 23,
			},
			want: "[qry_456] undefined column (42703) at position 23: column \"name\" does not exist [hint: perhaps you meant \"username\"]",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.err.Error()
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestExecutionError_Unwrap(t *testing.T) {
	originalErr := errors.New("original error")
	execErr := &ExecutionError{
		Message:     "wrapped error",
		OriginalErr: originalErr,
	}

	unwrapped := execErr.Unwrap()
	assert.Equal(t, originalErr, unwrapped)
}

func TestNewConnectionError(t *testing.T) {
	originalErr := errors.New("connection closed")
	err := NewConnectionError("conn_123", originalErr)

	assert.Equal(t, "08003", err.Code)
	assert.Contains(t, err.Message, "conn_123")
	assert.Equal(t, originalErr, err.OriginalErr)
}

func TestNewTimeoutError(t *testing.T) {
	err := NewTimeoutError("qry_789", "SELECT * FROM large_table")

	assert.Equal(t, "qry_789", err.QueryID)
	assert.Equal(t, "57014", err.Code)
	assert.Equal(t, "query execution timeout", err.Message)
	assert.NotEmpty(t, err.Hint)
	assert.NotEmpty(t, err.SQL)
}

func TestNewCancellationError(t *testing.T) {
	err := NewCancellationError("qry_999", "SELECT * FROM users")

	assert.Equal(t, "qry_999", err.QueryID)
	assert.Equal(t, "57014", err.Code)
	assert.Equal(t, "query cancelled by user", err.Message)
	assert.NotEmpty(t, err.SQL)
}

func TestNormalizeError(t *testing.T) {
	t.Run("nil error", func(t *testing.T) {
		err := normalizeError("qry_1", "SELECT 1", nil)
		assert.Nil(t, err)
	})

	t.Run("already ExecutionError", func(t *testing.T) {
		original := &ExecutionError{
			Message: "test error",
			Code:    "12345",
		}
		err := normalizeError("qry_2", "SELECT 2", original)
		assert.Equal(t, "qry_2", err.QueryID)
		assert.Equal(t, "12345", err.Code)
		assert.NotEmpty(t, err.SQL)
	})

	t.Run("PostgreSQL error", func(t *testing.T) {
		pgErr := &pgconn.PgError{
			Code:     "42P01",
			Message:  "relation \"foo\" does not exist",
			Detail:   "table not found",
			Hint:     "check your table name",
			Position: 15,
		}
		err := normalizeError("qry_3", "SELECT * FROM foo", pgErr)

		assert.Equal(t, "qry_3", err.QueryID)
		assert.Equal(t, "42P01", err.Code)
		assert.Equal(t, "relation \"foo\" does not exist", err.Message)
		assert.Equal(t, "table not found", err.Detail)
		assert.Equal(t, "check your table name", err.Hint)
		assert.Equal(t, int32(15), err.Position)
		assert.NotEmpty(t, err.SQL)
	})

	t.Run("generic error", func(t *testing.T) {
		genericErr := errors.New("something went wrong")
		err := normalizeError("qry_4", "SELECT 4", genericErr)

		assert.Equal(t, "qry_4", err.QueryID)
		assert.Equal(t, "something went wrong", err.Message)
		assert.Equal(t, genericErr, err.OriginalErr)
		assert.NotEmpty(t, err.SQL)
	})
}

func TestTruncateSQL(t *testing.T) {
	tests := []struct {
		name   string
		sql    string
		maxLen int
		want   string
	}{
		{
			name:   "short SQL",
			sql:    "SELECT 1",
			maxLen: 100,
			want:   "SELECT 1",
		},
		{
			name:   "exact length",
			sql:    "SELECT * FROM users",
			maxLen: 19,
			want:   "SELECT * FROM users",
		},
		{
			name:   "needs truncation",
			sql:    "SELECT * FROM users WHERE id = 1 AND name = 'test' AND active = true",
			maxLen: 30,
			want:   "SELECT * FROM users WHERE id =...",
		},
		{
			name:   "with leading/trailing whitespace",
			sql:    "  SELECT 1  ",
			maxLen: 100,
			want:   "SELECT 1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := truncateSQL(tt.sql, tt.maxLen)
			assert.Equal(t, tt.want, got)
			if len(tt.sql) > tt.maxLen {
				require.LessOrEqual(t, len(got), tt.maxLen+3) // +3 for "..."
			}
		})
	}
}
