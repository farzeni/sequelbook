package runners

import (
	"database/sql"
	"encoding/json"
	"fmt"
)

type QueryRunner struct {
	ID     string  `json:"id"`
	DBConn *sql.DB `json:"-"`
}

func NewQueryRunner(db *sql.DB) *QueryRunner {
	return &QueryRunner{
		DBConn: db,
	}
}

func (r *QueryRunner) Query(query string) (string, error) {
	if r.DBConn == nil {
		return "", fmt.Errorf("no active database connection")
	}

	result, err := r.DBConn.Query(query)

	if err != nil {
		return "", fmt.Errorf("query execution failed: %v", err)
	}

	if result == nil {
		return "", fmt.Errorf("failed to execute query")
	}

	defer result.Close()

	data, err := rowsToJSON(result)

	if err != nil {
		return "", fmt.Errorf("failed to convert rows to JSON: %v", err)
	}

	return string(data), nil
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
