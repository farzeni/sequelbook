package connection

import "context"

// MultiConnector delegates to the appropriate connector based on config.Type.
type MultiConnector struct {
	pg    *PostgresConnector
	mysql *MySQLConnector
	sqlite *SQLiteConnector
}

// NewMultiConnector creates a MultiConnector with all engine connectors.
func NewMultiConnector() *MultiConnector {
	return &MultiConnector{
		pg:    &PostgresConnector{},
		mysql: &MySQLConnector{},
		sqlite: &SQLiteConnector{},
	}
}

// Connect selects the connector based on config.DBType() and delegates.
func (c *MultiConnector) Connect(ctx context.Context, config ConnectionConfig) (Pool, error) {
	switch config.DBType() {
	case DBTypeMySQL:
		return c.mysql.Connect(ctx, config)
	case DBTypeSQLite:
		return c.sqlite.Connect(ctx, config)
	default:
		return c.pg.Connect(ctx, config)
	}
}
