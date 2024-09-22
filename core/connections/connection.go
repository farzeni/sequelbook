package connections

import (
	"fmt"
	"sequelbook/core/tools"

	_ "github.com/go-sql-driver/mysql" // MySQL driver
	_ "github.com/lib/pq"              // Postgres driver
	_ "github.com/mattn/go-sqlite3"    // SQLite driver
)

type ConnType string

const (
	ConnTypePostgres ConnType = "postgres"
	ConnTypeMySQL    ConnType = "mysql"
	ConnTypeSQLite   ConnType = "sqlite"
)

type Connection struct {
	ID   string   `json:"id"`
	Name string   `json:"name"`
	Type ConnType `json:"type"`
	Host string   `json:"host"`
	Port int      `json:"port"`
	User string   `json:"user"`
	Pass string   `json:"pass"`
	DB   string   `json:"db"`
}

type ConnectionData struct {
	Name string   `json:"name"`
	Type ConnType `json:"type"`
	Host string   `json:"host"`
	Port int      `json:"port"`
	User string   `json:"user"`
	Pass string   `json:"pass"`
	DB   string   `json:"db"`
}

func (c *Connection) GetEntityPrefix() string {
	return "con"
}

func NewConnection(c ConnectionData) (*Connection, error) {
	connectionID := tools.GenerateID(tools.EntityTypesConnection)

	return &Connection{
		ID:   connectionID,
		Name: c.Name,
		Type: c.Type,
		Host: c.Host,
		Port: c.Port,
		User: c.User,
		Pass: c.Pass,
		DB:   c.DB,
	}, nil
}

func (c *Connection) GetDSN() *string {
	var dsn string

	switch c.Type {
	case ConnTypePostgres:
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable", c.User, c.Pass, c.Host, c.Port, c.DB)
	case ConnTypeMySQL:
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s", c.User, c.Pass, c.Host, c.Port, c.DB)
	case ConnTypeSQLite:
		dsn = c.DB // For SQLite, DSN is the path to the database file
	}

	return &dsn
}
