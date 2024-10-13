package runners

import (
	"database/sql"
	"fmt"
	"log"
	"sequelbook/core/books"
	"sequelbook/core/connections"
	"strings"
)

const (
	directQuery = "query"
)

type PoolerConnection struct {
	DB         *sql.DB
	Connection connections.Connection
	Runner     *QueryRunner
}

type Pooler struct {
	Connections map[string]PoolerConnection
}

func NewPooler() *Pooler {
	return &Pooler{
		Connections: make(map[string]PoolerConnection),
	}
}

func (p *Pooler) Run(connection connections.Connection, book books.Book, cell books.Cell) (*QueryResult, error) {
	if cell.Type != books.BlockTypeCode {
		return nil, fmt.Errorf("unsupported cell type: %s", cell.ID)
	}

	conn, err := p.ensureConnection(connection, book.ID)

	if err != nil {
		return nil, err
	}

	fmt.Println("Running cell: ", cell.Content)

	q := p.cleanQuery(connection, cell.Content)

	fmt.Println("Cleaned query: ", q)

	result, err := conn.Runner.Query(q)

	if err != nil {
		log.Println("Failed to run cell: ", err)
		return nil, err
	}

	return result, nil

}

func (p *Pooler) Query(connection connections.Connection, query string) (*QueryResult, error) {
	conn, err := p.ensureConnection(connection, directQuery)

	if err != nil {
		return nil, err
	}

	q := p.cleanQuery(connection, query)

	fmt.Println("Cleaned query: ", q)

	result, err := conn.Runner.Query(q)

	if err != nil {
		log.Println("Failed to run query: ", err)
		return nil, err
	}

	return result, nil

}

func (p *Pooler) GetTables(c connections.Connection) (*TableResult, error) {
	d := QueryDictionary[c.Type]

	conn, err := p.ensureConnection(c, directQuery)

	if err != nil {
		return nil, err
	}

	result, err := conn.Runner.GetTables(d)

	if err != nil {
		return nil, err
	}

	return result, nil
}

func (p *Pooler) GetColumns(c connections.Connection, table string) (*ColumnResult, error) {
	d := QueryDictionary[c.Type]

	conn, err := p.ensureConnection(c, directQuery)

	if err != nil {
		return nil, err
	}

	result, err := conn.Runner.GetColumns(d, table)

	if err != nil {
		return nil, err
	}

	return result, nil
}

func (p *Pooler) AddRow(c connections.Connection, table string, row map[string]interface{}) error {
	conn, err := p.ensureConnection(c, directQuery)

	if err != nil {
		return err
	}

	err = conn.Runner.AddRow(table, row)

	if err != nil {
		return err
	}

	return nil
}

func (p *Pooler) Close() {
	for _, conn := range p.Connections {
		if conn.DB != nil {
			conn.DB.Close()
		}
	}
}

func (p *Pooler) connect(c connections.Connection, bookID string) error {
	var dsn *string = c.GetDSN()

	if dsn == nil {
		return fmt.Errorf("unsupported connection type: %s", c.Type)
	}

	db, err := sql.Open(string(c.Type), *dsn)
	if err != nil {
		return fmt.Errorf("failed to connect: %v", err)
	}

	// Test the connection
	err = db.Ping()
	if err != nil {
		return fmt.Errorf("failed to ping the database: %v", err)
	}

	p.Connections[bookID] = PoolerConnection{
		DB:         db,
		Connection: c,
		Runner:     NewQueryRunner(db, string(c.Type)),
	}

	return nil
}

func (p *Pooler) disconnect(bookID string) error {
	c, ok := p.Connections[bookID]

	if !ok {
		return fmt.Errorf("connection not found")
	}

	if c.DB == nil {
		return fmt.Errorf("no active connection to disconnect")
	}

	err := c.DB.Close()
	if err != nil {
		return fmt.Errorf("failed to disconnect: %v", err)
	}

	c.DB = nil
	delete(p.Connections, bookID)

	return nil
}

func (p *Pooler) ensureConnection(connection connections.Connection, bookID string) (*PoolerConnection, error) {
	conn, ok := p.Connections[bookID]

	if !ok {
		fmt.Println("Connecting to the database...")
		err := p.connect(connection, bookID)

		if err != nil {
			return nil, err
		}

		conn = p.Connections[bookID]
	} else {
		err := conn.DB.Ping()

		if err != nil {
			fmt.Println("Reconnecting to the database...")
			err := p.disconnect(bookID)

			if err != nil {
				return nil, err
			}

			err = p.connect(connection, bookID)

			if err != nil {
				return nil, err
			}

			conn = p.Connections[bookID]
		}
	}

	return &conn, nil
}

func (p *Pooler) cleanQuery(c connections.Connection, q string) string {
	d := QueryDictionary[c.Type]

	q = strings.TrimSpace(q)

	fmt.Println("Query: ", q)

	switch {
	case q == `\dt`:
		q = d.GetTablesQuery
	case strings.HasPrefix(q, `\d `):
		tableName := strings.TrimSpace(strings.TrimPrefix(q, `\d `))
		q = fmt.Sprintf(d.GetColumnsQuery, tableName)
	}

	q = strings.TrimSpace(q)
	q = strings.ReplaceAll(q, "\n", " ")
	q = strings.ReplaceAll(q, ";", " ")

	return q
}
