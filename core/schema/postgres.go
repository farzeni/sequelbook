package schema

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/sequelbook/sequelbook/core/connection"
)

// PostgresInspector implements Inspector for PostgreSQL.
type PostgresInspector struct{}

// ListSchemas returns all schemas excluding system schemas.
func (i *PostgresInspector) ListSchemas(ctx context.Context, pool connection.Pool) ([]Schema, error) {
	pgPool := pool.(*connection.PgxPoolAdapter).PgxPool()

	rows, err := pgPool.Query(ctx, `
		SELECT schema_name
		FROM information_schema.schemata
		WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
		ORDER BY schema_name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schemas []Schema
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		schemas = append(schemas, Schema{Name: name})
	}
	return schemas, rows.Err()
}

// ListTables returns all tables. If schema is non-empty, filters by that schema.
func (i *PostgresInspector) ListTables(ctx context.Context, pool connection.Pool, schema string) ([]Table, error) {
	pgPool := pool.(*connection.PgxPoolAdapter).PgxPool()

	var rows pgx.Rows
	var err error
	if schema != "" {
		rows, err = pgPool.Query(ctx, `
			SELECT table_schema, table_name, table_type
			FROM information_schema.tables
			WHERE table_schema = $1
			ORDER BY table_name
		`, schema)
	} else {
		rows, err = pgPool.Query(ctx, `
			SELECT table_schema, table_name, table_type
			FROM information_schema.tables
			WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
			ORDER BY table_schema, table_name
		`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []Table
	for rows.Next() {
		var s, n, t string
		if err := rows.Scan(&s, &n, &t); err != nil {
			return nil, err
		}
		tables = append(tables, Table{Schema: s, Name: n, Type: t})
	}
	return tables, rows.Err()
}

// ListColumns returns all columns for the given schema.table.
func (i *PostgresInspector) ListColumns(ctx context.Context, pool connection.Pool, schema string, table string) ([]Column, error) {
	pgPool := pool.(*connection.PgxPoolAdapter).PgxPool()

	// Use public schema if not specified
	s := schema
	if s == "" {
		s = "public"
	}

	rows, err := pgPool.Query(ctx, `
		SELECT
			c.column_name,
			c.data_type,
			CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END,
			c.column_default,
			EXISTS (
				SELECT 1 FROM pg_index i
				JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) AND NOT a.attisdropped
				WHERE i.indisprimary
				  AND i.indrelid = (quote_ident($1) || '.' || quote_ident($2))::regclass
				  AND a.attname = c.column_name
			)
		FROM information_schema.columns c
		WHERE c.table_schema = $1 AND c.table_name = $2
		ORDER BY c.ordinal_position
	`, s, table)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var columns []Column
	for rows.Next() {
		var col Column
		var def *string
		if err := rows.Scan(&col.Name, &col.DataType, &col.IsNullable, &def, &col.IsPrimaryKey); err != nil {
			return nil, err
		}
		col.ColumnDefault = def
		columns = append(columns, col)
	}
	return columns, rows.Err()
}
