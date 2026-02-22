package connection

import (
	"context"
	"database/sql"
	"fmt"
	"net/url"

	_ "github.com/go-sql-driver/mysql"
)

// MySQLConnector implements Connector for MySQL via database/sql.
type MySQLConnector struct{}

// Connect dials MySQL using the DSN format: user:password@tcp(host:port)/dbname.
// Password is URL-encoded to handle special characters.
func (c *MySQLConnector) Connect(ctx context.Context, config ConnectionConfig) (Pool, error) {
	userInfo := url.UserPassword(config.User, config.Password)
	dsn := fmt.Sprintf("%s@tcp(%s:%d)/%s",
		userInfo.String(),
		config.Host,
		config.Port,
		config.Database,
	)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	// Verify connection
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, err
	}

	return NewSQLDBAdapter(db), nil
}
