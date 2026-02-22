package bindings

import (
	"context"
	"fmt"

	"github.com/sequelbook/sequelbook/core/connection"
	"github.com/sequelbook/sequelbook/core/settings"
	"github.com/sequelbook/sequelbook/events"
)

// connectionStateAdapter bridges connection.StateEmitter to events.Emitter.
// It lives here to keep events/ free of core/ imports.
type connectionStateAdapter struct {
	emitter events.Emitter
}

// EmitConnectionState satisfies connection.StateEmitter.
// It converts the typed connection.State to a plain string before forwarding.
func (a *connectionStateAdapter) EmitConnectionState(connID string, state connection.State, err error) {
	events.EmitConnectionStateChanged(a.emitter, connID, string(state), err)
}

// NewConnectionStateAdapter creates an adapter backed by the given emitter.
// It is exported so main.go can pass it to connection.NewManager.
func NewConnectionStateAdapter(emitter events.Emitter) *connectionStateAdapter {
	return &connectionStateAdapter{emitter: emitter}
}

// ConnectionStatus is the JSON shape returned by GetConnectionStatus.
type ConnectionStatus struct {
	ConnID    string `json:"connId"`
	State     string `json:"state"`
	Connected bool   `json:"connected"`
}

// ConnectionService exposes connection management to the Wails frontend.
type ConnectionService struct {
	manager  *connection.Manager
	settings *settings.Store
}

// NewConnectionService creates a ConnectionService with injected dependencies.
func NewConnectionService(manager *connection.Manager, settingsStore *settings.Store) *ConnectionService {
	return &ConnectionService{
		manager:  manager,
		settings: settingsStore,
	}
}

// Connect establishes a new database connection.
// Returns the connection ID on success.
func (s *ConnectionService) Connect(config connection.ConnectionConfig) (string, error) {
	return s.manager.Connect(context.Background(), config)
}

// Disconnect closes the named connection.
func (s *ConnectionService) Disconnect(connID string) error {
	return s.manager.Disconnect(connID)
}

// TestConnection validates credentials without persisting a connection.
func (s *ConnectionService) TestConnection(config connection.ConnectionConfig) error {
	return s.manager.TestConnection(context.Background(), config)
}

// GetConnectionStatus returns the current connection state.
func (s *ConnectionService) GetConnectionStatus() ConnectionStatus {
	connID, ok := s.manager.ActiveConnection()
	if !ok {
		return ConnectionStatus{State: string(connection.StateDisconnected)}
	}

	state, err := s.manager.ConnectionState(connID)
	if err != nil {
		return ConnectionStatus{ConnID: connID, State: string(connection.StateError)}
	}

	return ConnectionStatus{
		ConnID:    connID,
		State:     string(state),
		Connected: state == connection.StateConnected,
	}
}

// ListSavedConnections returns all saved connection entries sorted by name.
func (s *ConnectionService) ListSavedConnections() []settings.ConnectionEntry {
	return s.settings.ListConnections()
}

// SaveConnection adds or updates a saved connection entry.
// If entry.ID is empty, a new ID is assigned. Returns the entry with ID set.
func (s *ConnectionService) SaveConnection(entry settings.ConnectionEntry) (*settings.ConnectionEntry, error) {
	saved, err := s.settings.SaveConnection(entry)
	if err != nil {
		return nil, fmt.Errorf("save connection: %w", err)
	}
	return saved, nil
}

// DeleteConnection removes a saved connection by ID.
func (s *ConnectionService) DeleteConnection(id string) error {
	return s.settings.DeleteConnection(id)
}
