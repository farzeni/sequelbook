package schema

import (
	"context"

	"github.com/sequelbook/sequelbook/core/connection"
)

// SQLiteInspector implements Inspector for SQLite.
type SQLiteInspector struct{}

// ListSchemas returns schemas. SQLite has no schemas; returns empty or "main".
func (i *SQLiteInspector) ListSchemas(ctx context.Context, pool connection.Pool) ([]Schema, error) {
	// SQLite uses a single schema "main" by default
	return []Schema{{Name: "main"}}, nil
}

// ListTables returns all tables. Schema is ignored for SQLite.
func (i *SQLiteInspector) ListTables(ctx context.Context, pool connection.Pool, schema string) ([]Table, error) {
	db := pool.(*connection.SQLDBAdapter).DB()

	rows, err := db.QueryContext(ctx, `
		SELECT NULL AS schema, name AS table_name, type AS table_type
		FROM sqlite_master
		WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
		ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []Table
	for rows.Next() {
		var s *string
		var n, t string
		if err := rows.Scan(&s, &n, &t); err != nil {
			return nil, err
		}
		schemaName := ""
		if s != nil {
			schemaName = *s
		}
		tables = append(tables, Table{Schema: schemaName, Name: n, Type: t})
	}
	return tables, rows.Err()
}

// ListColumns returns all columns for the given table. Schema is ignored.
func (i *SQLiteInspector) ListColumns(ctx context.Context, pool connection.Pool, schema string, table string) ([]Column, error) {
	db := pool.(*connection.SQLDBAdapter).DB()

	rows, err := db.QueryContext(ctx, `
		SELECT name AS column_name, type AS data_type,
			CASE WHEN "notnull" = 0 THEN true ELSE false END AS is_nullable,
			dflt_value AS column_default,
			CASE WHEN pk = 1 THEN true ELSE false END AS is_primary_key
		FROM pragma_table_info(?)
		ORDER BY cid
	`, table)
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
