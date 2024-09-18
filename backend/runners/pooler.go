package runners

import (
	"database/sql"
	"fmt"
	"sequelbook/backend/connections"
)

type PoolerConnection struct {
	DB         *sql.DB
	Connection connections.Connection
	Runners    map[string]*QueryRunner
}

type Pooler struct {
	Connections map[string]PoolerConnection
}

func NewPooler() *Pooler {
	return &Pooler{
		Connections: make(map[string]PoolerConnection),
	}
}

func (p *Pooler) Connect(c connections.Connection) error {
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

	p.Connections[c.ID] = PoolerConnection{
		DB:         db,
		Connection: c,
	}

	return nil
}

func (p *Pooler) Disconnect(cID string) error {
	c, ok := p.Connections[cID]

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

	delete(p.Connections, cID)

	return nil
}
