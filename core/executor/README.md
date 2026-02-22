# core/executor

Thread-safe SQL query execution for PostgreSQL databases.

## Overview

The `executor` package provides production-ready query execution with:

- **Concurrent execution**: Multiple queries can run safely in parallel
- **Cancellation support**: Stop queries via context or query ID
- **Rich metadata**: Column types, execution timing, row counts
- **Comprehensive errors**: PostgreSQL error codes, hints, and positions
- **Type mapping**: 30+ PostgreSQL types mapped to display categories

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/sequelbook/sequelbook/core/executor"
)

func main() {
    // Create executor with your connection resolver
    exec := executor.NewPostgresExecutor(myResolver)
    defer exec.Close()

    // Execute query
    result, err := exec.Execute(
        context.Background(),
        "my_connection_id",
        "SELECT id, name, created_at FROM users LIMIT 10",
    )
    if err != nil {
        log.Fatal(err)
    }

    // Process results
    fmt.Printf("Query ID: %s\n", result.QueryID)
    fmt.Printf("Rows: %d\n", len(result.Rows))
    fmt.Printf("Duration: %s\n", result.Meta.Duration)

    for _, row := range result.Rows {
        fmt.Printf("ID: %v, Name: %v, Created: %v\n",
            row[0], row[1], row[2])
    }
}
```

## Architecture

### Package Structure

```
core/executor/
├── executor.go       # Interfaces and core types
├── column.go         # Type mapping (OID → DisplayType)
├── errors.go         # ExecutionError and error constructors
├── postgres.go       # PostgresExecutor implementation
├── testutil.go       # Test helpers
├── doc.go            # Package documentation
└── *_test.go         # Tests (unit + integration)
```

### Design Principles

1. **Separation of Concerns**: Executor only executes queries. Connection lifecycle is handled by `ConnectionResolver`.

2. **Full Buffering**: Results are completely read into memory. This simplifies the API but requires care with large result sets.

3. **Thread Safety**: All operations use proper synchronization primitives (sync.Map, atomic.Bool, context cancellation).

4. **Rich Metadata**: Column types include both PostgreSQL OIDs and frontend display hints.

5. **Error Context**: Errors include query ID, SQL snippet, PostgreSQL error details.

## API Reference

### Interfaces

#### Executor

```go
type Executor interface {
    Execute(ctx context.Context, connID string, sql string) (*Result, error)
    Cancel(queryID string) error
    Close() error
}
```

#### ConnectionResolver

```go
type ConnectionResolver interface {
    GetConnection(connID string) (*pgx.Conn, error)
}
```

Implement this in your connection management layer.

### Types

#### Result

```go
type Result struct {
    QueryID string      // Unique execution ID (qry_...)
    Columns []Column    // Column metadata
    Rows    [][]any     // Row data
    Meta    QueryMeta   // Execution statistics
}
```

#### Column

```go
type Column struct {
    Name         string      // Column name
    DatabaseType string      // PostgreSQL type name
    OID          uint32      // PostgreSQL type OID
    DisplayType  DisplayType // Frontend rendering hint
    Nullable     bool        // NULL allowed (always true for now)
    TableOID     uint32      // Source table OID
    TableColumn  int16       // Source column number
}
```

#### DisplayType

```go
type DisplayType string

const (
    DisplayTypeText      DisplayType = "text"
    DisplayTypeNumber    DisplayType = "number"
    DisplayTypeBoolean   DisplayType = "boolean"
    DisplayTypeTimestamp DisplayType = "timestamp"
    DisplayTypeJSON      DisplayType = "json"
    DisplayTypeArray     DisplayType = "array"
    DisplayTypeBinary    DisplayType = "binary"
    DisplayTypeUUID      DisplayType = "uuid"
    DisplayTypeInterval  DisplayType = "interval"
    DisplayTypeGeometry  DisplayType = "geometry"
    DisplayTypeUnknown   DisplayType = "unknown"
)
```

#### ExecutionError

```go
type ExecutionError struct {
    QueryID      string // Query execution ID
    SQL          string // Truncated SQL
    Code         string // PostgreSQL error code
    Message      string // Error message
    Detail       string // Additional details
    Hint         string // Fix suggestion
    Position     int32  // Error position in SQL
    InternalPos  int32  // Internal position (PL/pgSQL)
    InternalSQL  string // Internal query text
    OriginalErr  error  // Wrapped error
}
```

### Functions

#### NewPostgresExecutor

```go
func NewPostgresExecutor(resolver ConnectionResolver) *PostgresExecutor
```

Creates a new PostgreSQL query executor.

#### NewQueryID

```go
func NewQueryID() string
```

Generates a unique query execution ID (format: `qry_<xid>`).

## Testing

### Prerequisites

Integration tests require PostgreSQL:

```bash
docker run --name sequelbook-test-db \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=sequelbook_test \
  -p 5432:5432 -d postgres:16-alpine
```

You can override the connection string:

```bash
export SEQUELBOOK_TEST_DB="postgres://user:pass@host:port/dbname"
```

### Running Tests

```bash
# All tests (requires PostgreSQL)
go test ./core/executor/... -v

# Unit tests only
go test ./core/executor/... -short

# With coverage
go test ./core/executor/... -cover -coverprofile=coverage.out
go tool cover -html=coverage.out

# With race detector
go test ./core/executor/... -race

# Benchmarks
go test ./core/executor/... -bench=. -benchmem
```

### Test Coverage

Expected coverage with full integration tests: **85%+**

Unit tests only (short mode): **55%+**

## Type Mapping

### Text Types
- `text`, `varchar`, `char`, `name` → DisplayTypeText
- `xml` → DisplayTypeText

### Numeric Types
- `int2`, `int4`, `int8` → DisplayTypeNumber
- `float4`, `float8` → DisplayTypeNumber
- `numeric`, `money` → DisplayTypeNumber
- `oid` → DisplayTypeNumber

### Date/Time Types
- `timestamp`, `timestamptz` → DisplayTypeTimestamp
- `date` → DisplayTypeTimestamp
- `time`, `timetz` → DisplayTypeTimestamp
- `interval` → DisplayTypeInterval

### Other Types
- `bool` → DisplayTypeBoolean
- `json`, `jsonb` → DisplayTypeJSON
- `bytea` → DisplayTypeBinary
- `uuid` → DisplayTypeUUID
- Array types → DisplayTypeArray

Unknown OIDs default to `DisplayTypeUnknown`.

## Error Codes

Common PostgreSQL error codes:

- `42601` - Syntax error
- `42P01` - Undefined table
- `42703` - Undefined column
- `08003` - Connection does not exist
- `57014` - Query canceled

See [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html) for complete list.

## Performance Considerations

### Memory Usage

Results are fully buffered in memory. For a query returning 100,000 rows with 10 columns:

- Each value: ~8-64 bytes (depends on type)
- Row overhead: ~80 bytes (slice header + values)
- Total: ~8-64 MB

For large result sets:

1. Use LIMIT/OFFSET for pagination
2. Filter data at SQL level (WHERE clauses)
3. Select only needed columns
4. Consider streaming for future enhancement

### Concurrency

The executor handles concurrent queries efficiently:

- Active query tracking uses sync.Map (optimized for reads)
- No global locks during query execution
- Context cancellation propagates immediately

Benchmark (10 concurrent queries, 1000 rows each): ~5ms overhead per query.

## Examples

### Query Timeout

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

result, err := exec.Execute(ctx, connID, longRunningQuery)
if err != nil {
    var execErr *executor.ExecutionError
    if errors.As(err, &execErr) && execErr.Code == "57014" {
        log.Println("Query timed out")
    }
}
```

### Query Cancellation

```go
// Start query in background
go func() {
    result, err := exec.Execute(context.Background(), connID, sql)
    // ...
}()

// Cancel after 1 second
time.Sleep(1 * time.Second)
if err := exec.Cancel(queryID); err != nil {
    log.Printf("Cancel failed: %v", err)
}
```

### Error Handling

```go
result, err := exec.Execute(ctx, connID, "SELECT * FROM missing_table")
if err != nil {
    var execErr *executor.ExecutionError
    if errors.As(err, &execErr) {
        log.Printf("Error: %s", execErr.Message)
        log.Printf("Code: %s", execErr.Code)
        log.Printf("Hint: %s", execErr.Hint)
        log.Printf("Position: %d", execErr.Position)
        log.Printf("SQL: %s", execErr.SQL)
    }
}
```

### Type Inspection

```go
result, err := exec.Execute(ctx, connID, "SELECT * FROM users")
if err != nil {
    return err
}

for _, col := range result.Columns {
    fmt.Printf("Column: %s\n", col.Name)
    fmt.Printf("  Type: %s (OID %d)\n", col.DatabaseType, col.OID)
    fmt.Printf("  Display: %s\n", col.DisplayType)

    if col.TableOID != 0 {
        fmt.Printf("  Source: table %d, column %d\n",
            col.TableOID, col.TableColumn)
    }
}
```

## Future Enhancements

- [ ] Streaming result sets for large queries
- [ ] Prepared statement support
- [ ] Batch query execution
- [ ] Query plan inspection (EXPLAIN)
- [ ] Result set pagination helpers
- [ ] Query caching layer
- [ ] Metrics and observability hooks
- [ ] Support for other databases (MySQL, SQLite)

## License

See repository root for license information.
