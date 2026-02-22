package schema

import (
	"context"
	"database/sql"
	"errors"

	"github.com/sequelbook/sequelbook/core/connection"
)

// MySQLInspector implements Inspector for MySQL.
type MySQLInspector struct{}

// ListSchemas returns all schemas (databases) excluding system ones.
func (i *MySQLInspector) ListSchemas(ctx context.Context, pool connection.Pool) ([]Schema, error) {
	db := pool.(*connection.SQLDBAdapter).DB()

	rows, err := db.QueryContext(ctx, `
		SELECT schema_name
		FROM information_schema.schemata
		WHERE schema_name NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
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
func (i *MySQLInspector) ListTables(ctx context.Context, pool connection.Pool, schema string) ([]Table, error) {
	db := pool.(*connection.SQLDBAdapter).DB()

	var rows *sql.Rows
	var err error
	if schema != "" {
		rows, err = db.QueryContext(ctx, `
			SELECT table_schema, table_name, table_type
			FROM information_schema.tables
			WHERE table_schema = ?
			ORDER BY table_name
		`, schema)
	} else {
		rows, err = db.QueryContext(ctx, `
			SELECT table_schema, table_name, table_type
			FROM information_schema.tables
			WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
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
func (i *MySQLInspector) ListColumns(ctx context.Context, pool connection.Pool, schema string, table string) ([]Column, error) {
	db := pool.(*connection.SQLDBAdapter).DB()

	s := schema
	if s == "" {
		// MySQL connects to a specific database; use it when schema not provided
		var currentDB sql.NullString
		if err := db.QueryRowContext(ctx, "SELECT DATABASE()").Scan(&currentDB); err != nil {
			return nil, err
		}
		if !currentDB.Valid || currentDB.String == "" {
			return nil, errors.New("no database selected; specify schema for ListColumns")
		}
		s = currentDB.String
	}

	rows, err := db.QueryContext(ctx, `
		SELECT column_name, data_type,
			CASE WHEN is_nullable = 'YES' THEN true ELSE false END,
			column_default,
			CASE WHEN column_key = 'PRI' THEN true ELSE false END
		FROM information_schema.columns
		WHERE table_schema = ? AND table_name = ?
		ORDER BY ordinal_position
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
