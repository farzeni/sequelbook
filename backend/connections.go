package backend

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/oklog/ulid/v2"

	_ "github.com/go-sql-driver/mysql" // MySQL driver
	_ "github.com/lib/pq"              // Postgres driver
	_ "github.com/mattn/go-sqlite3"    // SQLite driver
)

type ConnectionType string

const (
	ConnectionTypePostgres ConnectionType = "postgres"
	ConnectionTypeMySQL    ConnectionType = "mysql"
	ConnectionTypeSQLite   ConnectionType = "sqlite"
)

type Connection struct {
	ID     string         `json:"id"`
	Name   string         `json:"name"`
	Type   ConnectionType `json:"type"`
	Host   string         `json:"host"`
	Port   int            `json:"port"`
	User   string         `json:"user"`
	Pass   string         `json:"pass"`
	DB     string         `json:"db"`
	DBConn *sql.DB        `json:"-"`
}

type ConnectionCreateData struct {
	Name string         `json:"name"`
	Type ConnectionType `json:"type"`
	Host string         `json:"host"`
	Port int            `json:"port"`
	User string         `json:"user"`
	Pass string         `json:"pass"`
	DB   string         `json:"db"`
}

type ConnectionStore struct {
	connections map[string]*Connection
}

func (c *Connection) Connect() error {
	var dsn string

	switch c.Type {
	case ConnectionTypePostgres:
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable", c.User, c.Pass, c.Host, c.Port, c.DB)
	case ConnectionTypeMySQL:
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s", c.User, c.Pass, c.Host, c.Port, c.DB)
	case ConnectionTypeSQLite:
		dsn = c.DB // For SQLite, DSN is the path to the database file
	default:
		return fmt.Errorf("unsupported connection type: %s", c.Type)
	}

	db, err := sql.Open(string(c.Type), dsn)
	if err != nil {
		return fmt.Errorf("failed to connect: %v", err)
	}

	// Test the connection
	err = db.Ping()
	if err != nil {
		return fmt.Errorf("failed to ping the database: %v", err)
	}

	c.DBConn = db
	return nil
}

func (c *Connection) Disconnect() error {
	if c.DBConn == nil {
		return fmt.Errorf("no active connection to disconnect")
	}

	err := c.DBConn.Close()
	if err != nil {
		return fmt.Errorf("failed to disconnect: %v", err)
	}

	c.DBConn = nil
	return nil
}

func (c *Connection) QueryExecute(query string) (*sql.Rows, error) {
	if c.DBConn == nil {
		return nil, fmt.Errorf("no active database connection")
	}

	rows, err := c.DBConn.Query(query)
	if err != nil {
		return nil, fmt.Errorf("query execution failed: %v", err)
	}

	return rows, nil
}

func NewConnectionStore() *ConnectionStore {
	return &ConnectionStore{
		connections: make(map[string]*Connection),
	}
}

func generateID() string {
	return "con_" + ulid.Make().String()
}

func (s *ConnectionStore) Add(c ConnectionCreateData) *Connection {
	connectionID := generateID()

	s.connections[connectionID] = &Connection{
		ID:   connectionID,
		Name: c.Name,
		Type: c.Type,
		Host: c.Host,
		Port: c.Port,
		User: c.User,
		Pass: c.Pass,
		DB:   c.DB,
	}

	return s.connections[connectionID]
}

func (s *ConnectionStore) Get(id string) (*Connection, bool) {
	c, ok := s.connections[id]
	return c, ok
}

func (s *ConnectionStore) Update(id string, c *Connection) {
	s.connections[id] = c
}

func (s *ConnectionStore) GetAll() []*Connection {
	var connections []*Connection
	for _, c := range s.connections {
		connections = append(connections, c)
	}
	return connections
}

func (s *ConnectionStore) Delete(id string) {
	delete(s.connections, id)
}

func (s *ConnectionStore) Query(connectionID, query string) (string, error) {
	c, ok := s.Get(connectionID)

	if !ok {
		return "", fmt.Errorf("connection not found")
	}

	err := c.Connect()

	if err != nil {
		return "", fmt.Errorf("failed to connect to database: %v", err)
	}

	result, err := c.QueryExecute(query)

	if err != nil {
		return "", fmt.Errorf("failed to execute query: %v", err)
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
	// Ottieni i nomi delle colonne
	columns, err := rows.Columns()
	if err != nil {
		return nil, fmt.Errorf("failed to get columns: %v", err)
	}

	// Crea una slice per memorizzare i risultati
	var results []map[string]interface{}

	// Itera attraverso le righe
	for rows.Next() {
		// Crea una slice per contenere i valori delle colonne
		columnValues := make([]interface{}, len(columns))
		columnPointers := make([]interface{}, len(columns))

		// Popola columnPointers con indirizzi delle colonne
		for i := range columnValues {
			columnPointers[i] = &columnValues[i]
		}

		// Scansiona la riga corrente
		if err := rows.Scan(columnPointers...); err != nil {
			return nil, fmt.Errorf("failed to scan row: %v", err)
		}

		// Crea una mappa per ogni riga
		rowMap := make(map[string]interface{})
		for i, colName := range columns {
			val := columnValues[i]

			// Gestisci il caso dei valori NULL
			b, ok := val.([]byte)
			if ok {
				rowMap[colName] = string(b)
			} else {
				rowMap[colName] = val
			}
		}

		// Aggiungi la riga alla slice dei risultati
		results = append(results, rowMap)
	}

	// Converti la slice dei risultati in JSON
	jsonData, err := json.Marshal(results)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal results to JSON: %v", err)
	}

	return jsonData, nil
}
