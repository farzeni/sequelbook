package runners

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
)

type QueryType string

const (
	QueryTypeSelect QueryType = "SELECT"
	QueryTypeInsert QueryType = "INSERT"
	QueryTypeUpdate QueryType = "UPDATE"
	QueryTypeDelete QueryType = "DELETE"
	QueryTypeOther  QueryType = "OTHER"
)

type InspectionCommand string

const (
	InspectionCommandTables    InspectionCommand = "\\dt"
	InspectionCommandColumns   InspectionCommand = "\\d"
	InspectionCommandDatabases InspectionCommand = "\\l"
)

type QueryResult struct {
	Query        string    `json:"query"`
	Columns      []string  `json:"columns"`
	Json         string    `json:"json"`
	RowsAffected int64     `json:"affected_rows"`
	Type         QueryType `json:"type"`
}

type TableResult struct {
	Tables []TableDef `json:"tables"`
}

type ColumnResult struct {
	Columns []ColumnDef `json:"columns"`
}

func NewQueryResult(query string) (*QueryResult, error) {
	var err error

	r := &QueryResult{
		Query: query,
	}

	r.Type, err = r.getQueryType()

	if err != nil {
		return nil, fmt.Errorf("failed to get query type: %v", err)
	}

	return r, nil
}

func (qr *QueryResult) getQueryType() (QueryType, error) {
	if len(qr.Query) == 0 {
		return "", fmt.Errorf("empty query")
	}

	var queryType QueryType

	query := strings.TrimSpace(strings.ToUpper(qr.Query))

	if strings.HasPrefix(query, "WITH") {
		if strings.Contains(query, "SELECT") {
			return QueryTypeSelect, nil
		}
		return QueryTypeOther, nil
	}

	if strings.HasPrefix(query, "INSERT") {
		queryType = QueryTypeInsert
	} else if strings.HasPrefix(query, "UPDATE") {
		queryType = QueryTypeUpdate
	} else if strings.HasPrefix(query, "DELETE") {
		queryType = QueryTypeDelete
	} else if strings.HasPrefix(query, "SELECT") {
		queryType = QueryTypeSelect
	} else {
		queryType = QueryTypeOther
	}

	return queryType, nil
}

type QueryRunner struct {
	DBConn *sql.DB `json:"-"`
	DBType string  `json:"db_type"`
	mx     *sync.Mutex
}

func NewQueryRunner(db *sql.DB, dbType string) *QueryRunner {
	return &QueryRunner{
		DBConn: db,
		DBType: dbType,
		mx:     &sync.Mutex{},
	}
}

func (r *QueryRunner) Query(query string) (*QueryResult, error) {
	res, err := NewQueryResult(query)

	if err != nil {
		return nil, fmt.Errorf("failed to create query result: %v", err)
	}

	r.mx.Lock()
	defer r.mx.Unlock()

	if r.DBConn == nil {
		fmt.Println("No active database connection")
		return nil, fmt.Errorf("no active database connection")
	}

	if res.Type == QueryTypeSelect {
		result, err := r.DBConn.Query(query)

		if err != nil {
			fmt.Println("Query execution failed: ", err)
			return nil, fmt.Errorf("query execution failed: %v", err)
		}

		if result == nil {
			fmt.Println("Failed to execute query")

			return nil, fmt.Errorf("failed to execute query")
		}

		columns, err := result.Columns()

		if err != nil {
			fmt.Println("Failed to get columns: ", err)
			return nil, fmt.Errorf("failed to get columns: %v", err)
		}

		res.Columns = append(res.Columns, columns...)

		data, err := rowsToJSON(result)

		if err != nil {
			fmt.Println("Failed to convert rows to JSON: ", err)
			return nil, fmt.Errorf("failed to convert rows to JSON: %v", err)
		}

		res.Json = string(data)

		if err != nil {
			fmt.Println("Failed to get columns: ", err)
			return nil, fmt.Errorf("failed to get columns: %v", err)
		}

		defer result.Close()

	} else {
		result, err := r.DBConn.Exec(query)

		if err != nil {
			fmt.Println("Query execution failed: ", err)
			return nil, fmt.Errorf("query execution failed: %v", err)
		}

		rowsAffected, err := result.RowsAffected()

		if err != nil {
			fmt.Println("Failed to get rows affected: ", err)
			return nil, fmt.Errorf("failed to get rows affected: %v", err)
		}

		res.RowsAffected = rowsAffected
	}

	return res, nil
}

func (r *QueryRunner) GetTables(queries DatabaseInspectionQuery) (*TableResult, error) {
	var tables []TableDef

	rows, err := r.DBConn.Query(queries.GetTablesQuery)

	if err != nil {
		return nil, fmt.Errorf("failed to get tables: %v", err)
	}

	for rows.Next() {
		var table TableDef
		err := rows.Scan(&table.Schema, &table.TableName, &table.TableType)

		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %v", err)
		}

		tables = append(tables, table)
	}

	return &TableResult{Tables: tables}, nil
}

func (r *QueryRunner) GetColumns(queries DatabaseInspectionQuery, table string) (*ColumnResult, error) {
	var columns []ColumnDef

	q := fmt.Sprintf(queries.GetColumnsQuery, table, table)

	fmt.Println("Query: ", table, q)

	rows, err := r.DBConn.Query(q)

	if err != nil {
		return nil, fmt.Errorf("failed to get columns: %v", err)
	}

	for rows.Next() {
		var column ColumnDef
		err := rows.Scan(
			&column.ColumnName,
			&column.DataType,
			&column.IsNullable,
			&column.ColumnDefault,
			&column.IsPrimaryKey,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %v", err)
		}

		columns = append(columns, column)
	}

	return &ColumnResult{Columns: columns}, nil
}

func (r *QueryRunner) AddRow(table string, row map[string]interface{}) error {
	var columns []string
	var placeholders []string
	var values []interface{}

	for k, v := range row {
		columns = append(columns, k)
		if r.DBType == "postgres" {
			placeholders = append(placeholders, fmt.Sprintf("$%d", len(placeholders)+1))
		} else {
			placeholders = append(placeholders, "?")
		}
		values = append(values, v)
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", table, strings.Join(columns, ", "), strings.Join(placeholders, ", "))

	fmt.Println("Query: ", query)

	_, err := r.DBConn.Exec(query, values...)

	if err != nil {
		return fmt.Errorf("failed to add row: %v", err)
	}

	return nil
}

func rowsToJSON(rows *sql.Rows) ([]byte, error) {
	columns, err := rows.Columns()
	if err != nil {
		return nil, fmt.Errorf("failed to get columns: %v", err)
	}

	var results []map[string]interface{}

	for rows.Next() {
		columnValues := make([]interface{}, len(columns))
		columnPointers := make([]interface{}, len(columns))

		for i := range columnValues {
			columnPointers[i] = &columnValues[i]
		}

		if err := rows.Scan(columnPointers...); err != nil {
			return nil, fmt.Errorf("failed to scan row: %v", err)
		}

		rowMap := make(map[string]interface{})
		for i, colName := range columns {
			val := columnValues[i]

			b, ok := val.([]byte)
			if ok {
				rowMap[colName] = string(b)
			} else {
				rowMap[colName] = val
			}
		}

		results = append(results, rowMap)
	}

	jsonData, err := json.Marshal(results)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal results to JSON: %v", err)
	}

	return jsonData, nil
}
