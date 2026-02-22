// Package connection manages PostgreSQL connection lifecycle for SequelBook.
//
// It provides a thread-safe Manager that maintains a single active database
// connection, tracks connection state, performs periodic health checks, and
// implements the executor.ConnectionResolver interface so the executor can
// resolve connection IDs to live *pgx.Conn handles.
//
// Basic usage:
//
//	mgr := connection.NewManager(&connection.PostgresConnector{}, emitter)
//	connID, err := mgr.Connect(ctx, connection.ConnectionConfig{
//	    Host:     "localhost",
//	    Port:     5432,
//	    Database: "mydb",
//	    User:     "myuser",
//	    Password: "mypassword",
//	    SSLMode:  "disable",
//	})
//
// Wiring with the executor:
//
//	exec := executor.NewPostgresExecutor(mgr) // *Manager satisfies ConnectionResolver
package connection
