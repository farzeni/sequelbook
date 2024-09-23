package runners

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"sync"
)

type QueryRunner struct {
	DBConn *sql.DB `json:"-"`
	mx     *sync.Mutex
}

func NewQueryRunner(db *sql.DB) *QueryRunner {
	return &QueryRunner{
		DBConn: db,
		mx:     &sync.Mutex{},
	}
}

func (r *QueryRunner) Query(query string) (string, error) {
	r.mx.Lock()

	if r.DBConn == nil {
		fmt.Println("No active database connection")
		r.mx.Unlock()
		return "", fmt.Errorf("no active database connection")
	}

	result, err := r.DBConn.Query(query)

	if err != nil {
		fmt.Println("Query execution failed: ", err)
		r.mx.Unlock()

		return "", fmt.Errorf("query execution failed: %v", err)
	}

	if result == nil {
		fmt.Println("Failed to execute query")
		r.mx.Unlock()

		return "", fmt.Errorf("failed to execute query")
	}

	defer result.Close()

	r.mx.Unlock()

	data, err := rowsToJSON(result)

	if err != nil {
		fmt.Println("Failed to convert rows to JSON: ", err)
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
