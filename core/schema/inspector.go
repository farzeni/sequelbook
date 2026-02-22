package schema

import (
	"context"

	"github.com/sequelbook/sequelbook/core/connection"
)

// Schema represents a database schema (namespace for tables).
type Schema struct {
	Name string `json:"name"`
}

// Table represents a database table.
type Table struct {
	Schema string `json:"schema"`
	Name   string `json:"name"`
	Type   string `json:"type"` // TABLE, VIEW, etc.
}

// Column represents a table column.
type Column struct {
	Name         string  `json:"name"`
	DataType     string  `json:"dataType"`
	IsNullable   bool    `json:"isNullable"`
	ColumnDefault *string `json:"columnDefault,omitempty"`
	IsPrimaryKey bool    `json:"isPrimaryKey"`
}

// Inspector provides database schema introspection.
type Inspector interface {
	ListSchemas(ctx context.Context, pool connection.Pool) ([]Schema, error)
	ListTables(ctx context.Context, pool connection.Pool, schema string) ([]Table, error)
	ListColumns(ctx context.Context, pool connection.Pool, schema string, table string) ([]Column, error)
}
