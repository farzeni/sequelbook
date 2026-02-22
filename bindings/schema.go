package bindings

import (
	"context"
	"fmt"
	"strings"

	"github.com/sequelbook/sequelbook/core/connection"
	"github.com/sequelbook/sequelbook/core/schema"
)

// SchemaService exposes schema introspection to the Wails frontend.
type SchemaService struct {
	manager *connection.Manager

	pgInsp    schema.Inspector
	mysqlInsp schema.Inspector
	sqliteInsp schema.Inspector
}

// NewSchemaService creates a SchemaService with the given manager.
func NewSchemaService(manager *connection.Manager) *SchemaService {
	return &SchemaService{
		manager:   manager,
		pgInsp:    &schema.PostgresInspector{},
		mysqlInsp: &schema.MySQLInspector{},
		sqliteInsp: &schema.SQLiteInspector{},
	}
}

// inspector returns the inspector for the active connection's DBType.
func (s *SchemaService) inspector(connID string) (schema.Inspector, connection.Pool, error) {
	pool, dbType, err := s.manager.GetConnection(connID)
	if err != nil {
		return nil, nil, err
	}

	var insp schema.Inspector
	switch dbType {
	case connection.DBTypePostgres:
		insp = s.pgInsp
	case connection.DBTypeMySQL:
		insp = s.mysqlInsp
	case connection.DBTypeSQLite:
		insp = s.sqliteInsp
	default:
		return nil, nil, fmt.Errorf("unsupported database type: %s", dbType)
	}

	return insp, pool, nil
}

// ListTables returns all tables for the given connection.
// If schema is non-empty, filters by that schema.
func (s *SchemaService) ListTables(connID string, schemaName string) ([]schema.Table, error) {
	insp, pool, err := s.inspector(connID)
	if err != nil {
		return nil, err
	}
	return insp.ListTables(context.Background(), pool, schemaName)
}

// ListColumns returns all columns for the given schema.table.
func (s *SchemaService) ListColumns(connID string, schemaName string, tableName string) ([]schema.Column, error) {
	insp, pool, err := s.inspector(connID)
	if err != nil {
		return nil, err
	}
	return insp.ListColumns(context.Background(), pool, schemaName, tableName)
}

// PreviewTableQuery returns a SQL query to fetch the first N rows from a table.
// The query uses database-appropriate quoting for identifiers.
func (s *SchemaService) PreviewTableQuery(connID string, schemaName string, tableName string, limit int) (string, error) {
	_, dbType, err := s.manager.GetConnection(connID)
	if err != nil {
		return "", err
	}

	if limit <= 0 {
		limit = 200
	}

	var qualified string
	switch dbType {
	case connection.DBTypePostgres:
		if schemaName != "" {
			qualified = fmt.Sprintf(`"%s"."%s"`, escapePgIdent(schemaName), escapePgIdent(tableName))
		} else {
			qualified = fmt.Sprintf(`"%s"`, escapePgIdent(tableName))
		}
		return fmt.Sprintf("SELECT * FROM %s LIMIT %d", qualified, limit), nil
	case connection.DBTypeMySQL:
		if schemaName != "" {
			qualified = fmt.Sprintf("`%s`.`%s`", escapeMySQLIdent(schemaName), escapeMySQLIdent(tableName))
		} else {
			qualified = fmt.Sprintf("`%s`", escapeMySQLIdent(tableName))
		}
		return fmt.Sprintf("SELECT * FROM %s LIMIT %d", qualified, limit), nil
	case connection.DBTypeSQLite:
		qualified = fmt.Sprintf(`"%s"`, escapeSQLiteIdent(tableName))
		return fmt.Sprintf("SELECT * FROM %s LIMIT %d", qualified, limit), nil
	default:
		return "", fmt.Errorf("unsupported database type: %s", dbType)
	}
}

// GetCompletionSchema returns a flat map of table names to column name lists
// for use in CodeMirror SQL autocompletion. Keys use "schema.table" format for
// non-default schemas (public for Postgres, main for SQLite).
func (s *SchemaService) GetCompletionSchema(connID string) (map[string][]string, error) {
	insp, pool, err := s.inspector(connID)
	if err != nil {
		return nil, err
	}

	// Determine database type for default schema detection.
	_, dbType, err := s.manager.GetConnection(connID)
	if err != nil {
		return nil, err
	}

	// Determine which schema is the "default" (omitted from key).
	var defaultSchema string
	switch dbType {
	case connection.DBTypePostgres:
		defaultSchema = "public"
	case connection.DBTypeSQLite:
		defaultSchema = "main"
	default:
		defaultSchema = ""
	}

	ctx := context.Background()
	tables, err := insp.ListTables(ctx, pool, "")
	if err != nil {
		return nil, fmt.Errorf("GetCompletionSchema: listing tables: %w", err)
	}

	result := make(map[string][]string, len(tables))
	for _, t := range tables {
		cols, err := insp.ListColumns(ctx, pool, t.Schema, t.Name)
		if err != nil {
			// Skip tables we cannot inspect rather than failing entirely.
			continue
		}
		colNames := make([]string, len(cols))
		for i, c := range cols {
			colNames[i] = c.Name
		}

		key := t.Name
		if t.Schema != "" && t.Schema != defaultSchema {
			key = t.Schema + "." + t.Name
		}
		result[key] = colNames
	}
	return result, nil
}

func escapePgIdent(s string) string {
	return strings.ReplaceAll(s, `"`, `""`)
}

func escapeMySQLIdent(s string) string {
	return strings.ReplaceAll(s, "`", "``")
}

func escapeSQLiteIdent(s string) string {
	return strings.ReplaceAll(s, `"`, `""`)
}
