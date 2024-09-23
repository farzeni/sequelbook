package connections

import (
	"encoding/json"
	"fmt"
	"sequelbook/core/storage"
	"sequelbook/core/tools"
)

type ConnectionStore struct {
	connections map[string]*Connection
	storage     *storage.Storage
}

func NewConnectionStore(s *storage.Storage) *ConnectionStore {
	return &ConnectionStore{
		connections: make(map[string]*Connection),
		storage:     s,
	}
}

func (s *ConnectionStore) CreateConnection(d ConnectionData) (*Connection, error) {
	c, err := NewConnection(d)

	if err != nil {
		return nil, err
	}

	s.connections[c.ID] = c

	err = s.storage.SaveEntity(c, c.ID)

	if err != nil {
		return nil, err
	}

	return s.connections[c.ID], nil
}

func (s *ConnectionStore) UpdateConnection(id string, d ConnectionData) (*Connection, error) {
	c, ok := s.connections[id]

	if !ok {
		return nil, fmt.Errorf("connection not found")
	}

	c.Name = d.Name
	c.Type = d.Type
	c.Host = d.Host
	c.Port = d.Port
	c.User = d.User
	c.Pass = d.Pass
	c.DB = d.DB

	err := s.storage.SaveEntity(c, c.ID)

	if err != nil {
		return nil, err
	}

	return c, nil
}

func (s *ConnectionStore) DeleteConnection(id string) {
	delete(s.connections, id)

	s.storage.DeleteEntity(tools.EntityTypesConnection, id)
}

func (s *ConnectionStore) GetConnection(id string) (*Connection, bool) {
	c, ok := s.connections[id]
	return c, ok
}

func (s *ConnectionStore) ListConnections() []*Connection {
	var connections []*Connection
	for _, c := range s.connections {
		connections = append(connections, c)
	}
	return connections
}

func (s *ConnectionStore) LoadConnections() error {
	entities, err := s.storage.LoadEntities(tools.EntityTypesConnection)
	if err != nil {
		return err
	}

	for _, entity := range entities {
		conn := &Connection{}
		err := json.Unmarshal(entity, conn)
		if err != nil {
			continue
		}

		s.connections[conn.ID] = conn
	}
	return nil
}
