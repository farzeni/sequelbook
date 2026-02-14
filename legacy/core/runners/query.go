package runners

import "sequelbook/core/connections"

type TableDef struct {
	Schema    string `json:"schema"`
	TableName string `json:"table_name"`
	TableType string `json:"table_type"`
}

type ColumnDef struct {
	ColumnName    string  `json:"column_name"`
	DataType      string  `json:"data_type"`
	IsNullable    bool    `json:"is_nullable"`
	ColumnDefault *string `json:"column_default"`
	IsPrimaryKey  bool    `json:"is_primary_key"`
}

type DatabaseInspectionQuery struct {
	GetTablesQuery  string
	GetColumnsQuery string
}

var PostgresQueries = DatabaseInspectionQuery{
	GetTablesQuery: `
		SELECT 
			table_schema AS schema, 
			table_name, 
			table_type 
		FROM information_schema.tables 
		WHERE table_schema NOT IN ('information_schema', 'pg_catalog');
	`,

	GetColumnsQuery: `
		SELECT 
			column_name, 
			data_type, 
			CASE WHEN is_nullable = 'YES' THEN true ELSE false END AS is_nullable,
			column_default,
			CASE WHEN column_name = ANY (ARRAY(SELECT a.attname
				FROM pg_index i
				JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
				WHERE i.indrelid = '%s'::regclass AND i.indisprimary)) THEN true ELSE false END AS is_primary_key	
		FROM information_schema.columns 
		WHERE table_name = '%s';
	`,
}

var SQliteQueries = DatabaseInspectionQuery{
	GetTablesQuery: `
		SELECT 
			NULL AS schema, 
			name AS table_name, 
			type AS table_type 
		FROM sqlite_master 
		WHERE type='table';
	`,

	GetColumnsQuery: `
		SELECT 
			name AS column_name, 
			type AS data_type, 
			CASE WHEN notnull = 1 THEN false ELSE true END AS is_nullable,
			dflt_value AS column_default,
			CASE WHEN pk = 1 THEN true ELSE false END AS is_primary_key
		FROM pragma_table_info('%s');
	`,
}

var MysqlQueries = DatabaseInspectionQuery{
	GetTablesQuery: `
		SELECT 
			table_schema AS schema, 
			table_name, 
			table_type 
		FROM information_schema.tables 
		WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys');
	`,

	GetColumnsQuery: `
		SELECT 
			column_name, 
			data_type, 
			CASE WHEN is_nullable = 'YES' THEN true ELSE false END AS is_nullable,
			column_default,
			CASE WHEN column_key = 'PRI' THEN true ELSE false END AS is_primary_key
		FROM information_schema.columns 
		WHERE table_name = "%s";
	`,
}

var QueryDictionary = map[connections.ConnType]DatabaseInspectionQuery{
	connections.ConnTypePostgres: PostgresQueries,
	connections.ConnTypeSQLite:   SQliteQueries,
	connections.ConnTypeMySQL:    MysqlQueries,
}
