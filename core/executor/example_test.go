package executor_test

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sequelbook/sequelbook/core/connection"
	"github.com/sequelbook/sequelbook/core/executor"
)

// simpleResolver is a minimal ConnectionResolver implementation for examples.
type simpleResolver struct {
	pool *pgxpool.Pool
}

func (r *simpleResolver) GetConnection(connID string) (connection.Pool, connection.DBType, error) {
	if r.pool == nil {
		return nil, "", errors.New("no connection available")
	}
	return connection.NewPgxPoolAdapter(r.pool), connection.DBTypePostgres, nil
}

// Example demonstrates basic query execution with the executor package.
func Example() {
	// In a real application, you would get a pool from your
	// connection manager and create a resolver.
	var pool *pgxpool.Pool // = myConnectionManager.GetPool()

	resolver := &simpleResolver{pool: pool}
	exec := executor.NewPostgresExecutor(resolver)
	defer exec.Close()

	// Execute query
	result, err := exec.Execute(
		context.Background(),
		"my_connection",
		"SELECT id, name FROM users LIMIT 5",
	)
	if err != nil {
		log.Fatal(err)
	}

	// Print results
	fmt.Printf("Query ID: %s\n", result.QueryID)
	fmt.Printf("Columns: %d\n", len(result.Columns))
	fmt.Printf("Rows: %d\n", len(result.Rows))
	fmt.Printf("Duration: %s\n", result.Meta.Duration)
}

// ExamplePostgresExecutor_Execute_errorHandling demonstrates error handling.
func ExamplePostgresExecutor_Execute_errorHandling() {
	var exec executor.Executor // = executor.NewPostgresExecutor(resolver)

	_, err := exec.Execute(
		context.Background(),
		"conn_id",
		"SELECT * FROM nonexistent_table",
	)
	if err != nil {
		// Extract PostgreSQL error details
		var execErr *executor.ExecutionError
		if errors.As(err, &execErr) {
			fmt.Printf("Error: %s\n", execErr.Message)
			fmt.Printf("Code: %s\n", execErr.Code)
			if execErr.Hint != "" {
				fmt.Printf("Hint: %s\n", execErr.Hint)
			}
		}
	}
}

// ExamplePostgresExecutor_Cancel demonstrates query cancellation.
func ExamplePostgresExecutor_Cancel() {
	var exec executor.Executor // = executor.NewPostgresExecutor(resolver)

	// Start a long-running query
	go func() {
		_, err := exec.Execute(
			context.Background(),
			"conn_id",
			"SELECT pg_sleep(60)",
		)
		if err != nil {
			fmt.Println("Query was cancelled")
		}
	}()

	// Cancel the query
	queryID := "qry_abc123" // Obtained from result or tracked separately
	if err := exec.Cancel(queryID); err != nil {
		log.Printf("Cancel failed: %v", err)
	}
}

// ExampleDisplayType demonstrates type mapping.
func ExampleDisplayType() {
	// When you execute a query, each column has a DisplayType
	// that helps the frontend render the data appropriately.

	var result *executor.Result // = exec.Execute(...)

	for _, col := range result.Columns {
		switch col.DisplayType {
		case executor.DisplayTypeText:
			fmt.Printf("%s: render as text\n", col.Name)
		case executor.DisplayTypeNumber:
			fmt.Printf("%s: render as number\n", col.Name)
		case executor.DisplayTypeBoolean:
			fmt.Printf("%s: render as boolean\n", col.Name)
		case executor.DisplayTypeTimestamp:
			fmt.Printf("%s: render as timestamp\n", col.Name)
		case executor.DisplayTypeJSON:
			fmt.Printf("%s: render as JSON\n", col.Name)
		default:
			fmt.Printf("%s: unknown type\n", col.Name)
		}
	}
}
