package runners

import (
	"database/sql"
	"fmt"
	"log"
	"sequelbook/core/books"
	"sequelbook/core/connections"
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

func (p *Pooler) Connect(c connections.Connection, bookID string) error {
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
		Runner:     NewQueryRunner(db),
	}

	return nil
}

func (p *Pooler) Disconnect(bookID string) error {
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

func (p *Pooler) Run(connection connections.Connection, book books.Book, cell books.Cell) (string, error) {
	if cell.Type != books.BlockTypeCode {
		return "", fmt.Errorf("unsupported cell type: %s", cell.ID)
	}

	conn, ok := p.Connections[book.ID]

	if !ok {
		fmt.Println("Connecting to the database...")
		err := p.Connect(connection, book.ID)

		if err != nil {
			return "", err
		}

		conn = p.Connections[book.ID]
	}

	fmt.Println("Running cell: ", cell.Content)

	result, err := conn.Runner.Query(cell.Content)

	if err != nil {
		log.Println("Failed to run cell: ", err)
		return "", err
	}

	return result, nil

}
