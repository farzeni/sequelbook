package connection

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
)

// activeConnection holds all runtime state for a live connection.
type activeConnection struct {
	id           string
	conn         Pool
	dbType       DBType
	config       ConnectionConfig
	state        State
	lastError    error
	cancelHealth context.CancelFunc // stops the health check goroutine
	tunnel       *Tunnel            // nil when no SSH tunnel is used
}

// Manager manages a single active database connection.
// All public methods are safe for concurrent use.
type Manager struct {
	mu        sync.RWMutex
	active    *activeConnection // nil when disconnected
	connector Connector
	emitter   StateEmitter // may be nil
	closed    atomic.Bool
}

// NewManager creates a new Manager with the given connector and optional emitter.
// A nil emitter is valid; all state emissions become no-ops.
func NewManager(connector Connector, emitter StateEmitter) *Manager {
	return &Manager{
		connector: connector,
		emitter:   emitter,
	}
}

// emitState sends a state change notification to the emitter, if set.
func (m *Manager) emitState(connID string, state State, err error) {
	if m.emitter != nil {
		m.emitter.EmitConnectionState(connID, state, err)
	}
}

// Connect establishes a new connection.
// Returns ErrAlreadyConnected if a connection is already active.
// Emits StateConnecting → StateConnected on success, or StateError on failure.
// Starts a health check goroutine on success.
func (m *Manager) Connect(ctx context.Context, config ConnectionConfig) (string, error) {
	if m.closed.Load() {
		return "", &ConnectionError{
			Operation:   "connect",
			Message:     ErrManagerClosed.Error(),
			OriginalErr: ErrManagerClosed,
		}
	}

	m.mu.Lock()
	if m.active != nil {
		m.mu.Unlock()
		return "", &ConnectionError{
			Operation:   "connect",
			Message:     ErrAlreadyConnected.Error(),
			OriginalErr: ErrAlreadyConnected,
		}
	}

	connID := NewConnectionID()

	// Start SSH tunnel if configured.
	var tunnel *Tunnel
	if config.SSH != nil {
		tunnel = NewTunnel(*config.SSH)
		localHost, localPort, err := tunnel.Start(ctx)
		if err != nil {
			m.mu.Unlock()
			return "", &ConnectionError{
				ConnID:      connID,
				Operation:   "connect",
				Message:     fmt.Sprintf("SSH tunnel: %s", err),
				OriginalErr: err,
			}
		}
		config.Host = localHost
		config.Port = localPort
	}

	m.active = &activeConnection{
		id:     connID,
		config: config,
		state:  StateConnecting,
		tunnel: tunnel,
	}
	m.mu.Unlock()

	m.emitState(connID, StateConnecting, nil)

	conn, err := m.connector.Connect(ctx, config)
	if err != nil {
		m.mu.Lock()
		m.active = nil
		m.mu.Unlock()

		if tunnel != nil {
			tunnel.Close()
		}

		connErr := &ConnectionError{
			ConnID:      connID,
			Operation:   "connect",
			Message:     err.Error(),
			OriginalErr: err,
		}
		m.emitState(connID, StateError, connErr)
		return "", connErr
	}

	healthCtx, cancelHealth := context.WithCancel(context.Background())

	m.mu.Lock()
	m.active.conn = conn
	m.active.dbType = config.DBType()
	m.active.state = StateConnected
	m.active.cancelHealth = cancelHealth
	m.mu.Unlock()

	m.emitState(connID, StateConnected, nil)
	m.startHealthCheck(healthCtx, connID)

	return connID, nil
}

// Disconnect closes the named connection.
// Returns ErrNotConnected if no connection is active, or ErrConnectionNotFound
// if the given connID doesn't match the active connection.
// Emits StateDisconnected. The health check goroutine is cancelled first.
func (m *Manager) Disconnect(connID string) error {
	if m.closed.Load() {
		return &ConnectionError{
			ConnID:      connID,
			Operation:   "disconnect",
			Message:     ErrManagerClosed.Error(),
			OriginalErr: ErrManagerClosed,
		}
	}

	m.mu.Lock()
	if m.active == nil {
		m.mu.Unlock()
		return &ConnectionError{
			ConnID:      connID,
			Operation:   "disconnect",
			Message:     ErrNotConnected.Error(),
			OriginalErr: ErrNotConnected,
		}
	}
	if m.active.id != connID {
		m.mu.Unlock()
		return &ConnectionError{
			ConnID:      connID,
			Operation:   "disconnect",
			Message:     ErrConnectionNotFound.Error(),
			OriginalErr: ErrConnectionNotFound,
		}
	}
	ac := m.active
	m.active = nil
	m.mu.Unlock()

	// Cancel health check goroutine before closing the connection.
	if ac.cancelHealth != nil {
		ac.cancelHealth()
	}

	// Close the pool; safe to call even if already closed.
	if ac.conn != nil {
		ac.conn.Close()
	}

	// Close SSH tunnel after the pool.
	if ac.tunnel != nil {
		ac.tunnel.Close()
	}

	m.emitState(connID, StateDisconnected, nil)
	return nil
}

// TestConnection dials, pings, and immediately closes a connection.
// It never persists any state and does not emit state changes.
func (m *Manager) TestConnection(ctx context.Context, config ConnectionConfig) error {
	// Start SSH tunnel if configured (temporary, torn down after test).
	if config.SSH != nil {
		tunnel := NewTunnel(*config.SSH)
		localHost, localPort, err := tunnel.Start(ctx)
		if err != nil {
			return &ConnectionError{
				Operation:   "test",
				Message:     fmt.Sprintf("SSH tunnel: %s", err),
				OriginalErr: err,
			}
		}
		defer tunnel.Close()
		config.Host = localHost
		config.Port = localPort
	}

	pool, err := m.connector.Connect(ctx, config)
	if err != nil {
		return &ConnectionError{
			Operation:   "test",
			Message:     err.Error(),
			OriginalErr: err,
		}
	}
	defer pool.Close()

	if pingErr := pool.Ping(ctx); pingErr != nil {
		return &ConnectionError{
			Operation:   "test",
			Message:     fmt.Sprintf("ping failed: %s", pingErr),
			OriginalErr: pingErr,
		}
	}

	return nil
}

// ActiveConnection returns the current connection ID and whether a connection exists.
func (m *Manager) ActiveConnection() (string, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if m.active == nil {
		return "", false
	}
	return m.active.id, true
}

// GetConnection returns the Pool and DBType for the given connID.
// This satisfies the executor.ConnectionResolver interface.
// It is intended for internal Go use only and is never exposed to the frontend.
func (m *Manager) GetConnection(connID string) (Pool, DBType, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if m.active == nil {
		return nil, "", &ConnectionError{
			ConnID:      connID,
			Operation:   "resolve",
			Message:     ErrNotConnected.Error(),
			OriginalErr: ErrNotConnected,
		}
	}

	if m.active.id != connID {
		return nil, "", &ConnectionError{
			ConnID:      connID,
			Operation:   "resolve",
			Message:     ErrConnectionNotFound.Error(),
			OriginalErr: ErrConnectionNotFound,
		}
	}

	if m.active.state != StateConnected {
		return nil, "", &ConnectionError{
			ConnID:      connID,
			Operation:   "resolve",
			Message:     fmt.Sprintf("connection is not ready (state: %s)", m.active.state),
			OriginalErr: ErrNotConnected,
		}
	}

	return m.active.conn, m.active.dbType, nil
}

// ConnectionState returns the current lifecycle state for the given connection ID.
// Returns ErrNotConnected if no connection is active, or ErrConnectionNotFound
// if the given connID doesn't match the active connection.
func (m *Manager) ConnectionState(connID string) (State, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if m.active == nil {
		return StateDisconnected, &ConnectionError{
			ConnID:      connID,
			Operation:   "state",
			Message:     ErrNotConnected.Error(),
			OriginalErr: ErrNotConnected,
		}
	}

	if m.active.id != connID {
		return StateDisconnected, &ConnectionError{
			ConnID:      connID,
			Operation:   "state",
			Message:     ErrConnectionNotFound.Error(),
			OriginalErr: ErrConnectionNotFound,
		}
	}

	return m.active.state, nil
}

// Close cancels any active connection and shuts down the manager.
// Returns an error if the manager is already closed.
func (m *Manager) Close() error {
	if !m.closed.CompareAndSwap(false, true) {
		return &ConnectionError{
			Operation:   "close",
			Message:     "manager is already closed",
			OriginalErr: ErrManagerClosed,
		}
	}

	m.mu.Lock()
	ac := m.active
	m.active = nil
	m.mu.Unlock()

	if ac != nil {
		if ac.cancelHealth != nil {
			ac.cancelHealth()
		}
		if ac.conn != nil {
			ac.conn.Close()
		}
		if ac.tunnel != nil {
			ac.tunnel.Close()
		}
	}

	return nil
}
