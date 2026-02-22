// Package executor provides thread-safe SQL query execution for PostgreSQL databases.
//
// # Overview
//
// The executor package sits between connection management (core/connection) and
// result handling (core/result), providing pure query execution with no UI concerns.
// It uses pgx/v5 for PostgreSQL connectivity and supports concurrent query execution,
// cancellation, and rich metadata extraction.
//
// # Key Features
//
//   - Thread-safe concurrent query execution
//   - Query cancellation via context
//   - Rich column type metadata for frontend rendering
//   - Comprehensive error handling with PostgreSQL error context
//   - Support for 30+ PostgreSQL data types
//
// # Basic Usage
//
//	// Create an executor with a connection resolver
//	resolver := myConnectionManager // implements ConnectionResolver
//	executor := executor.NewPostgresExecutor(resolver)
//	defer executor.Close()
//
//	// Execute a query
//	ctx := context.Background()
//	result, err := executor.Execute(ctx, "conn_123", "SELECT * FROM users")
//	if err != nil {
//	    // Handle ExecutionError with PostgreSQL details
//	    var execErr *executor.ExecutionError
//	    if errors.As(err, &execErr) {
//	        log.Printf("Query failed: %s (code: %s)", execErr.Message, execErr.Code)
//	    }
//	    return err
//	}
//
//	// Access results
//	for i, row := range result.Rows {
//	    for j, col := range result.Columns {
//	        fmt.Printf("%s: %v\n", col.Name, row[j])
//	    }
//	}
//
// # Query Cancellation
//
// Queries can be cancelled using contexts or the Cancel method:
//
//	// Cancel via context timeout
//	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
//	defer cancel()
//	result, err := executor.Execute(ctx, connID, longQuery)
//
//	// Cancel via query ID
//	go func() {
//	    time.Sleep(1 * time.Second)
//	    executor.Cancel(queryID)
//	}()
//
// # Column Type Mapping
//
// PostgreSQL types are mapped to DisplayType hints for frontend rendering:
//
//   - text, varchar, char → DisplayTypeText
//   - int2, int4, int8, float4, float8, numeric → DisplayTypeNumber
//   - bool → DisplayTypeBoolean
//   - timestamp, date, time → DisplayTypeTimestamp
//   - json, jsonb → DisplayTypeJSON
//   - bytea → DisplayTypeBinary
//   - uuid → DisplayTypeUUID
//   - interval → DisplayTypeInterval
//   - array types → DisplayTypeArray
//
// # Error Handling
//
// The package provides detailed error context through ExecutionError:
//
//   - PostgreSQL error codes (e.g., "42P01" for undefined table)
//   - Error position in SQL statement
//   - Hints and suggestions
//   - Query ID for tracking
//
// # Memory Characteristics
//
// Results are fully buffered in memory - the entire result set is read before
// returning. For large result sets (millions of rows), consider:
//
//   - Implementing pagination at the SQL level (LIMIT/OFFSET)
//   - Using streaming interfaces (future enhancement)
//   - Monitoring memory usage and setting appropriate limits
//
// # Thread Safety
//
// All methods are thread-safe. Multiple queries can execute concurrently,
// and the executor tracks active queries internally using sync.Map.
//
// # Testing
//
// Integration tests require a running PostgreSQL instance:
//
//	docker run --name sequelbook-test-db \
//	  -e POSTGRES_PASSWORD=test \
//	  -e POSTGRES_DB=sequelbook_test \
//	  -p 5432:5432 -d postgres:16-alpine
//
//	# Run all tests (including integration)
//	go test ./core/executor/... -v
//
//	# Run only unit tests
//	go test ./core/executor/... -short
//
//	# Check coverage
//	go test ./core/executor/... -cover
//
//	# Run with race detector
//	go test ./core/executor/... -race
//
// # ConnectionResolver Interface
//
// The executor depends on ConnectionResolver to obtain database connections:
//
//	type ConnectionResolver interface {
//	    GetConnection(connID string) (*pgx.Conn, error)
//	}
//
// This interface should be implemented by the connection management layer
// (core/connection package). The executor does not manage connection lifecycle -
// it only executes queries against provided connections.
package executor
