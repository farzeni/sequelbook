package runners

import "sequelbook/core/connections"

type DatabaseInspectionQuery struct {
	GetTablesQuery       string
	GetTableColumnsQuery string
	GetDatabasesQuery    string
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

	GetTableColumnsQuery: `
		SELECT 
			column_name, 
			data_type, 
			is_nullable, 
			column_default 
		FROM information_schema.columns 
		WHERE table_name = '%s';
	`,

	GetDatabasesQuery: `
		SELECT datname AS database_name 
		FROM pg_database;
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

	GetTableColumnsQuery: `
		SELECT 
			name AS column_name, 
			type AS data_type, 
			CASE WHEN notnull = 0 THEN 'YES' ELSE 'NO' END AS is_nullable, 
			dflt_value AS column_default 
		FROM pragma_table_info('%s');
	`,

	GetDatabasesQuery: `
		SELECT 'main' AS database_name;
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

	GetTableColumnsQuery: `
		SELECT 
			column_name, 
			data_type, 
			is_nullable, 
			column_default 
		FROM information_schema.columns 
		WHERE table_name = "%s";
	`,

	GetDatabasesQuery: `
		SELECT schema_name AS database_name 
		FROM information_schema.schemata;
	`,
}

var QueryDictionary = map[connections.ConnType]DatabaseInspectionQuery{
	connections.ConnTypePostgres: PostgresQueries,
	connections.ConnTypeSQLite:   SQliteQueries,
	connections.ConnTypeMySQL:    MysqlQueries,
}
