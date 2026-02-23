package connection

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/xid"
)

// State represents the lifecycle state of a managed connection.
type State string

const (
	StateDisconnected State = "disconnected"
	StateConnecting   State = "connecting"
	StateConnected    State = "connected"
	StateError        State = "error"
)

// DBType identifies the database engine for a connection.
type DBType string

const (
	DBTypePostgres DBType = "postgres"
	DBTypeMySQL    DBType = "mysql"
	DBTypeSQLite   DBType = "sqlite"
)

// Pool abstracts database connection pools (pgx or database/sql).
// Implementations provide accessors for the underlying concrete type.
type Pool interface {
	Ping(ctx context.Context) error
	Close()
}

// ConnectionConfig holds the parameters needed to connect to a database.
// Type defaults to "postgres" when empty. For SQLite, Database is the file path.
type ConnectionConfig struct {
	Type     string `json:"type"`     // postgres | mysql | sqlite; default postgres
	Host     string `json:"host"`
	Port     uint16 `json:"port"`
	Database string `json:"database"`
	User     string `json:"user"`
	Password string `json:"password"`
	SSLMode  string           `json:"sslMode"`        // disable | require | verify-ca | verify-full (PostgreSQL only)
	SSH      *SSHTunnelConfig `json:"ssh,omitempty"`
}

// DBType returns the effective database type, defaulting to postgres when empty.
func (c ConnectionConfig) DBType() DBType {
	t := strings.TrimSpace(strings.ToLower(c.Type))
	switch t {
	case "mysql":
		return DBTypeMySQL
	case "sqlite":
		return DBTypeSQLite
	default:
		return DBTypePostgres
	}
}

// StateEmitter receives connection state change notifications.
// A nil StateEmitter is valid — emissions become no-ops.
type StateEmitter interface {
	EmitConnectionState(connID string, state State, err error)
}

// Connector abstracts database-specific dialing logic.
type Connector interface {
	Connect(ctx context.Context, config ConnectionConfig) (Pool, error)
}

// PostgresConnector implements Connector for PostgreSQL via pgx.
type PostgresConnector struct{}

// Connect dials PostgreSQL using a key=value DSN to avoid URL-encoding issues
// with special characters in passwords. Returns a connection pool so that
// concurrent queries can be served without "conn busy" errors.
func (c *PostgresConnector) Connect(ctx context.Context, config ConnectionConfig) (Pool, error) {
	sslMode := config.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}
dsn := fmt.Sprintf(
		"host='%s' port=%d dbname='%s' user='%s' password='%s' sslmode=%s",
		escapeDSNValue(config.Host),
		config.Port,
		escapeDSNValue(config.Database),
		escapeDSNValue(config.User),
		escapeDSNValue(config.Password),
		sslMode,
	)
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	return NewPgxPoolAdapter(pool), nil
}

// escapeDSNValue escapes a value for use in a PostgreSQL key=value DSN.
// Both backslashes and single quotes are special in this format:
// backslashes must be escaped first to avoid double-escaping.
func escapeDSNValue(v string) string {
	v = strings.ReplaceAll(v, `\`, `\\`)
	return strings.ReplaceAll(v, `'`, `\'`)
}

// NewConnectionID generates a unique connection identifier.
// Format: con_<xid> (e.g. con_cn8s7hsc18o0jt80qjbg)
func NewConnectionID() string {
	return "con_" + xid.New().String()
}
