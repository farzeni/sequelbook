package executor

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPostgresExecutor_Execute_BasicQueries(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	conn, cleanup := setupTestDB(t)
	defer cleanup()

	resolver := newMockResolver(conn)
	exec := NewPostgresExecutor(resolver)
	defer exec.Close()

	t.Run("simple select", func(t *testing.T) {
		result, err := exec.Execute(context.Background(), "test", "SELECT 1 AS num, 'hello' AS greeting")
		require.NoError(t, err)

		assert.NotEmpty(t, result.QueryID)
		assert.Len(t, result.Columns, 2)
		assert.Len(t, result.Rows, 1)

		// Check column metadata
		assert.Equal(t, "num", result.Columns[0].Name)
		assert.Equal(t, DisplayTypeNumber, result.Columns[0].DisplayType)

		assert.Equal(t, "greeting", result.Columns[1].Name)
		assert.Equal(t, DisplayTypeText, result.Columns[1].DisplayType)

		// Check row data
		assert.Equal(t, int32(1), result.Rows[0][0])
		assert.Equal(t, "hello", result.Rows[0][1])

		// Check metadata
		assert.NotZero(t, result.Meta.StartTime)
		assert.NotZero(t, result.Meta.EndTime)
		assert.Positive(t, result.Meta.Duration)
		assert.Contains(t, result.Meta.CommandTag, "SELECT")
	})

	t.Run("multiple rows", func(t *testing.T) {
		result, err := exec.Execute(context.Background(), "test", "SELECT generate_series(1, 5) AS num")
		require.NoError(t, err)

		assert.Len(t, result.Rows, 5)
		assert.Equal(t, int32(1), result.Rows[0][0])
		assert.Equal(t, int32(5), result.Rows[4][0])
	})

	t.Run("empty result", func(t *testing.T) {
		result, err := exec.Execute(context.Background(), "test", "SELECT 1 WHERE false")
		require.NoError(t, err)

		assert.Len(t, result.Columns, 1)
		assert.Len(t, result.Rows, 0)
	})

	t.Run("NULL values", func(t *testing.T) {
		result, err := exec.Execute(context.Background(), "test", "SELECT NULL AS val")
		require.NoError(t, err)

		assert.Len(t, result.Rows, 1)
		assert.Nil(t, result.Rows[0][0])
	})
}

func TestPostgresExecutor_Execute_DataTypes(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	conn, cleanup := setupTestDB(t)
	defer cleanup()

	resolver := newMockResolver(conn)
	exec := NewPostgresExecutor(resolver)
	defer exec.Close()

	// Create a test table with various data types
	_, err := conn.Exec(context.Background(), `
		DROP TABLE IF EXISTS type_test;
		CREATE TABLE type_test (
			id            SERIAL PRIMARY KEY,
			col_bool      BOOLEAN,
			col_int2      SMALLINT,
			col_int4      INTEGER,
			col_int8      BIGINT,
			col_float4    REAL,
			col_float8    DOUBLE PRECISION,
			col_numeric   NUMERIC(10,2),
			col_text      TEXT,
			col_varchar   VARCHAR(100),
			col_char      CHAR(5),
			col_bytea     BYTEA,
			col_date      DATE,
			col_time      TIME,
			col_timestamp TIMESTAMP,
			col_timestamptz TIMESTAMPTZ,
			col_interval  INTERVAL,
			col_uuid      UUID,
			col_json      JSON,
			col_jsonb     JSONB,
			col_int_array INTEGER[]
		);
	`)
	require.NoError(t, err)

	// Insert test data
	_, err = conn.Exec(context.Background(), `
		INSERT INTO type_test (
			col_bool, col_int2, col_int4, col_int8,
			col_float4, col_float8, col_numeric,
			col_text, col_varchar, col_char, col_bytea,
			col_date, col_time, col_timestamp, col_timestamptz,
			col_interval, col_uuid, col_json, col_jsonb,
			col_int_array
		) VALUES (
			true, 123, 456789, 9876543210,
			3.14, 2.71828, 99.99,
			'hello world', 'test varchar', 'abcde', '\xDEADBEEF',
			'2024-01-15', '14:30:00', '2024-01-15 14:30:00', '2024-01-15 14:30:00+00',
			'1 hour', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
			'{"key": "value"}', '{"nested": {"data": true}}',
			ARRAY[1, 2, 3]
		);
	`)
	require.NoError(t, err)

	// Query and verify column types
	result, err := exec.Execute(context.Background(), "test", "SELECT * FROM type_test")
	require.NoError(t, err)

	assert.Len(t, result.Rows, 1)
	require.Len(t, result.Columns, 21)

	// Verify display types for each column
	typeMap := map[string]DisplayType{
		"id":              DisplayTypeNumber,
		"col_bool":        DisplayTypeBoolean,
		"col_int2":        DisplayTypeNumber,
		"col_int4":        DisplayTypeNumber,
		"col_int8":        DisplayTypeNumber,
		"col_float4":      DisplayTypeNumber,
		"col_float8":      DisplayTypeNumber,
		"col_numeric":     DisplayTypeNumber,
		"col_text":        DisplayTypeText,
		"col_varchar":     DisplayTypeText,
		"col_char":        DisplayTypeText,
		"col_bytea":       DisplayTypeBinary,
		"col_date":        DisplayTypeTimestamp,
		"col_time":        DisplayTypeTimestamp,
		"col_timestamp":   DisplayTypeTimestamp,
		"col_timestamptz": DisplayTypeTimestamp,
		"col_interval":    DisplayTypeInterval,
		"col_uuid":        DisplayTypeUUID,
		"col_json":        DisplayTypeJSON,
		"col_jsonb":       DisplayTypeJSON,
		"col_int_array":   DisplayTypeArray,
	}

	for _, col := range result.Columns {
		expectedType, ok := typeMap[col.Name]
		if ok {
			assert.Equal(t, expectedType, col.DisplayType, "Column %s has wrong DisplayType", col.Name)
		}
	}
}

func TestPostgresExecutor_Execute_Errors(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	conn, cleanup := setupTestDB(t)
	defer cleanup()

	resolver := newMockResolver(conn)
	exec := NewPostgresExecutor(resolver)
	defer exec.Close()

	t.Run("syntax error", func(t *testing.T) {
		_, err := exec.Execute(context.Background(), "test", "SELECT * FORM users")
		require.Error(t, err)

		var execErr *ExecutionError
		require.True(t, errors.As(err, &execErr))
		assert.Equal(t, "42601", execErr.Code) // syntax error
		assert.NotEmpty(t, execErr.QueryID)
		assert.NotEmpty(t, execErr.SQL)
		assert.Greater(t, execErr.Position, int32(0))
	})

	t.Run("undefined table", func(t *testing.T) {
		_, err := exec.Execute(context.Background(), "test", "SELECT * FROM nonexistent_table")
		require.Error(t, err)

		var execErr *ExecutionError
		require.True(t, errors.As(err, &execErr))
		assert.Equal(t, "42P01", execErr.Code) // undefined table
	})

	t.Run("undefined column", func(t *testing.T) {
		_, err := exec.Execute(context.Background(), "test", "SELECT nonexistent_column FROM pg_type LIMIT 1")
		require.Error(t, err)

		var execErr *ExecutionError
		require.True(t, errors.As(err, &execErr))
		assert.Equal(t, "42703", execErr.Code) // undefined column
	})

	t.Run("connection error", func(t *testing.T) {
		badResolver := newErrorResolver(errors.New("connection not found"))
		badExec := NewPostgresExecutor(badResolver)
		defer badExec.Close()

		_, err := badExec.Execute(context.Background(), "bad_conn", "SELECT 1")
		require.Error(t, err)

		var execErr *ExecutionError
		require.True(t, errors.As(err, &execErr))
		assert.Equal(t, "08003", execErr.Code) // connection does not exist
	})
}

func TestPostgresExecutor_Execute_Timeout(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	conn, cleanup := setupTestDB(t)
	defer cleanup()

	resolver := newMockResolver(conn)
	exec := NewPostgresExecutor(resolver)
	defer exec.Close()

	// Create a context with a short timeout
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	// Run a query that will exceed the timeout
	_, err := exec.Execute(ctx, "test", "SELECT pg_sleep(5)")
	require.Error(t, err)

	var execErr *ExecutionError
	require.True(t, errors.As(err, &execErr))
	assert.Equal(t, "57014", execErr.Code) // query_canceled
	assert.Contains(t, execErr.Message, "timeout")
}

func TestPostgresExecutor_Cancel(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	conn, cleanup := setupTestDB(t)
	defer cleanup()

	resolver := newMockResolver(conn)
	exec := NewPostgresExecutor(resolver)
	defer exec.Close()

	t.Run("cancel running query", func(t *testing.T) {
		// Start a long-running query in background
		resultChan := make(chan *Result)
		errChan := make(chan error)

		go func() {
			result, err := exec.Execute(context.Background(), "test", "SELECT pg_sleep(10)")
			resultChan <- result
			errChan <- err
		}()

		// Wait a bit for query to start
		time.Sleep(100 * time.Millisecond)

		// Find the query ID from active queries
		var foundQueryID string
		exec.activeQueries.Range(func(key, value any) bool {
			foundQueryID = key.(string)
			return false // stop after first
		})

		require.NotEmpty(t, foundQueryID, "should have an active query")

		// Cancel the query
		cancelErr := exec.Cancel(foundQueryID)
		assert.NoError(t, cancelErr)

		// Wait for query to finish
		err := <-errChan
		require.Error(t, err)

		var execErr *ExecutionError
		require.True(t, errors.As(err, &execErr))
		assert.Equal(t, "57014", execErr.Code)
	})

	t.Run("cancel nonexistent query", func(t *testing.T) {
		err := exec.Cancel("qry_nonexistent")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "not found")
	})
}

func TestPostgresExecutor_Concurrency(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	pool, cleanup := setupTestPool(t)
	defer cleanup()

	resolver := newPoolResolver(pool)
	exec := NewPostgresExecutor(resolver)
	defer exec.Close()

	// Run 10 queries in parallel
	// This is safe because poolBackedResolver acquires a separate connection
	// from the pool for each query, unlike single-connection resolvers.
	const numQueries = 10
	results := make(chan *Result, numQueries)
	errs := make(chan error, numQueries)

	for i := 1; i <= numQueries; i++ {
		go func(n int) {
			result, err := exec.Execute(context.Background(), "test", "SELECT 1 AS num")
			results <- result
			errs <- err
		}(i)
	}

	// Collect results
	for i := 0; i < numQueries; i++ {
		result := <-results
		err := <-errs

		require.NoError(t, err)
		assert.NotNil(t, result)
		assert.NotEmpty(t, result.QueryID)
	}
}

func TestPostgresExecutor_LargeResultSet(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	conn, cleanup := setupTestDB(t)
	defer cleanup()

	resolver := newMockResolver(conn)
	exec := NewPostgresExecutor(resolver)
	defer exec.Close()

	// Generate 10k rows
	result, err := exec.Execute(context.Background(), "test", "SELECT generate_series(1, 10000) AS num")
	require.NoError(t, err)

	assert.Len(t, result.Rows, 10000)
	assert.Equal(t, int32(1), result.Rows[0][0])
	assert.Equal(t, int32(10000), result.Rows[9999][0])
	assert.Positive(t, result.Meta.Duration)
}

func TestPostgresExecutor_Close(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	conn, cleanup := setupTestDB(t)
	defer cleanup()

	resolver := newMockResolver(conn)
	exec := NewPostgresExecutor(resolver)

	// Close executor
	err := exec.Close()
	assert.NoError(t, err)

	// Verify it's closed
	assert.True(t, exec.closed.Load())

	// Try to execute after close
	_, err = exec.Execute(context.Background(), "test", "SELECT 1")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "closed")

	// Double close should error
	err = exec.Close()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "already closed")
}
