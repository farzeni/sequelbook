package connection

import (
	"context"
	"errors"
	"strings"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockPool is a test double for the Pool interface.
type mockPool struct {
	pingFn func(ctx context.Context) error
}

func (m *mockPool) Ping(ctx context.Context) error {
	if m.pingFn != nil {
		return m.pingFn(ctx)
	}
	return nil
}

func (m *mockPool) Close() {}

// mockConnector is a test double for the Connector interface.
type mockConnector struct {
	connectFn func(ctx context.Context, config ConnectionConfig) (Pool, error)
}

func (m *mockConnector) Connect(ctx context.Context, config ConnectionConfig) (Pool, error) {
	if m.connectFn != nil {
		return m.connectFn(ctx, config)
	}
	return nil, errors.New("connect not implemented")
}

// errorConnector returns a Connector that always fails with the given error.
func errorConnector(err error) *mockConnector {
	return &mockConnector{
		connectFn: func(_ context.Context, _ ConnectionConfig) (Pool, error) {
			return nil, err
		},
	}
}

// mockEmitter captures emitted state changes for assertions.
type mockEmitter struct {
	mu    sync.Mutex
	calls []emitCall
}

type emitCall struct {
	connID string
	state  State
	err    error
}

func (e *mockEmitter) EmitConnectionState(connID string, state State, err error) {
	e.mu.Lock()
	e.calls = append(e.calls, emitCall{connID: connID, state: state, err: err})
	e.mu.Unlock()
}

func (e *mockEmitter) snapshot() []emitCall {
	e.mu.Lock()
	defer e.mu.Unlock()
	out := make([]emitCall, len(e.calls))
	copy(out, e.calls)
	return out
}

// --- Tests ---

func TestNewConnectionID(t *testing.T) {
	id1 := NewConnectionID()
	id2 := NewConnectionID()
	assert.True(t, strings.HasPrefix(id1, "con_"), "ID should start with con_")
	assert.True(t, strings.HasPrefix(id2, "con_"), "ID should start with con_")
	assert.NotEqual(t, id1, id2, "IDs should be unique")
}

func TestManager_Connect_AlreadyConnected(t *testing.T) {
	mgr := &Manager{
		connector: errorConnector(errors.New("should not be called")),
	}
	// Simulate an existing active connection.
	mgr.active = &activeConnection{id: "con_existing"}

	_, err := mgr.Connect(context.Background(), ConnectionConfig{})
	require.Error(t, err)

	var connErr *ConnectionError
	require.True(t, errors.As(err, &connErr))
	assert.True(t, errors.Is(err, ErrAlreadyConnected))
}

func TestManager_Connect_DialFailure(t *testing.T) {
	dialErr := errors.New("dial timeout")
	emitter := &mockEmitter{}
	mgr := NewManager(errorConnector(dialErr), emitter)

	_, err := mgr.Connect(context.Background(), ConnectionConfig{})
	require.Error(t, err)

	var connErr *ConnectionError
	require.True(t, errors.As(err, &connErr))
	assert.Equal(t, "connect", connErr.Operation)
	assert.True(t, errors.Is(err, dialErr))

	// Manager should have no active connection after failure.
	_, ok := mgr.ActiveConnection()
	assert.False(t, ok)

	// Emitter should have received StateConnecting then StateError.
	calls := emitter.snapshot()
	require.Len(t, calls, 2)
	assert.Equal(t, StateConnecting, calls[0].state)
	assert.Equal(t, StateError, calls[1].state)
	assert.NotNil(t, calls[1].err)
}

func TestManager_Disconnect_NotConnected(t *testing.T) {
	mgr := NewManager(errorConnector(errors.New("unused")), nil)

	err := mgr.Disconnect("con_anything")
	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrNotConnected))
}

func TestManager_Disconnect_WrongID(t *testing.T) {
	mgr := &Manager{
		connector: errorConnector(errors.New("unused")),
	}
	mgr.active = &activeConnection{id: "con_real"}

	err := mgr.Disconnect("con_wrong")
	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrConnectionNotFound))
}

func TestManager_ActiveConnection_Empty(t *testing.T) {
	mgr := NewManager(errorConnector(errors.New("unused")), nil)

	id, ok := mgr.ActiveConnection()
	assert.Equal(t, "", id)
	assert.False(t, ok)
}

func TestManager_GetConnection_NotConnected(t *testing.T) {
	mgr := NewManager(errorConnector(errors.New("unused")), nil)

	pool, _, err := mgr.GetConnection("con_anything")
	assert.Nil(t, pool)
	require.Error(t, err)

	var connErr *ConnectionError
	require.True(t, errors.As(err, &connErr))
	assert.True(t, errors.Is(err, ErrNotConnected))
}

func TestManager_GetConnection_WrongID(t *testing.T) {
	mgr := &Manager{
		connector: errorConnector(errors.New("unused")),
	}
	mgr.active = &activeConnection{id: "con_real", conn: nil}

	pool, _, err := mgr.GetConnection("con_wrong")
	assert.Nil(t, pool)
	require.Error(t, err)

	var connErr *ConnectionError
	require.True(t, errors.As(err, &connErr))
	assert.True(t, errors.Is(err, ErrConnectionNotFound))
}

func TestManager_GetConnection_NotReady(t *testing.T) {
	mgr := &Manager{
		connector: errorConnector(errors.New("unused")),
	}
	// Simulate connection still in the connecting state (conn is nil, state is connecting).
	mgr.active = &activeConnection{id: "con_real", conn: nil, state: StateConnecting}

	pool, _, err := mgr.GetConnection("con_real")
	assert.Nil(t, pool)
	require.Error(t, err)

	var connErr *ConnectionError
	require.True(t, errors.As(err, &connErr))
	assert.True(t, errors.Is(err, ErrNotConnected))
	assert.Contains(t, connErr.Message, "connecting")
}

func TestManager_ConnectionState_NotConnected(t *testing.T) {
	mgr := NewManager(errorConnector(errors.New("unused")), nil)

	state, err := mgr.ConnectionState("con_anything")
	assert.Equal(t, StateDisconnected, state)
	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrNotConnected))
}

func TestManager_ConnectionState_WrongID(t *testing.T) {
	mgr := &Manager{
		connector: errorConnector(errors.New("unused")),
	}
	mgr.active = &activeConnection{id: "con_real", state: StateConnected}

	state, err := mgr.ConnectionState("con_wrong")
	assert.Equal(t, StateDisconnected, state)
	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrConnectionNotFound))
}

func TestManager_ConnectionState_ValidStates(t *testing.T) {
	for _, s := range []State{StateConnecting, StateConnected, StateError} {
		mgr := &Manager{
			connector: errorConnector(errors.New("unused")),
		}
		mgr.active = &activeConnection{id: "con_real", state: s}

		state, err := mgr.ConnectionState("con_real")
		assert.NoError(t, err)
		assert.Equal(t, s, state)
	}
}

func TestEscapeDSNValue(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"simple", "simple"},
		{"with'quote", `with\'quote`},
		{`with\backslash`, `with\\backslash`},
		{`foo\'bar`, `foo\\\'bar`}, // backslash then quote — both must be escaped
		{"", ""},
	}
	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			assert.Equal(t, tt.expected, escapeDSNValue(tt.input))
		})
	}
}

func TestManager_Close_Idempotent(t *testing.T) {
	mgr := NewManager(errorConnector(errors.New("unused")), nil)

	err := mgr.Close()
	assert.NoError(t, err)

	// Second close should return an error.
	err = mgr.Close()
	assert.Error(t, err)
	assert.True(t, errors.Is(err, ErrManagerClosed))
}

func TestManager_NilEmitter(t *testing.T) {
	dialErr := errors.New("dial failed")
	mgr := NewManager(errorConnector(dialErr), nil) // nil emitter

	// Should not panic when emitter is nil.
	_, err := mgr.Connect(context.Background(), ConnectionConfig{})
	assert.Error(t, err)
}

func TestManager_Connect_ClosedManager(t *testing.T) {
	mgr := NewManager(errorConnector(errors.New("unused")), nil)
	require.NoError(t, mgr.Close())

	_, err := mgr.Connect(context.Background(), ConnectionConfig{})
	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrManagerClosed))
}

func TestManager_Disconnect_ClosedManager(t *testing.T) {
	mgr := NewManager(errorConnector(errors.New("unused")), nil)
	require.NoError(t, mgr.Close())

	err := mgr.Disconnect("con_anything")
	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrManagerClosed))
}

func TestManager_TestConnection_PingFailure(t *testing.T) {
	pingErr := errors.New("ping failed")
	connector := &mockConnector{
		connectFn: func(_ context.Context, _ ConnectionConfig) (Pool, error) {
			return &mockPool{pingFn: func(_ context.Context) error { return pingErr }}, nil
		},
	}
	mgr := NewManager(connector, nil)

	err := mgr.TestConnection(context.Background(), ConnectionConfig{})
	require.Error(t, err)

	var connErr *ConnectionError
	require.True(t, errors.As(err, &connErr))
	assert.Equal(t, "test", connErr.Operation)
	assert.True(t, errors.Is(err, pingErr))

	// No state persisted.
	_, ok := mgr.ActiveConnection()
	assert.False(t, ok)
}

func TestPerformHealthCheck_PingFailure(t *testing.T) {
	pingErr := errors.New("connection lost")
	emitter := &mockEmitter{}

	mgr := NewManager(&mockConnector{}, emitter)
	mgr.active = &activeConnection{
		id:    "con_test",
		conn:  &mockPool{pingFn: func(_ context.Context) error { return pingErr }},
		state: StateConnected,
	}

	mgr.performHealthCheck(context.Background(), "con_test")

	// State should be updated to error.
	mgr.mu.RLock()
	state := mgr.active.state
	lastErr := mgr.active.lastError
	mgr.mu.RUnlock()

	assert.Equal(t, StateError, state)
	assert.Equal(t, pingErr, lastErr)

	// Emitter should have received StateError.
	calls := emitter.snapshot()
	require.Len(t, calls, 1)
	assert.Equal(t, StateError, calls[0].state)
}

func TestPerformHealthCheck_Recovery(t *testing.T) {
	emitter := &mockEmitter{}

	mgr := NewManager(&mockConnector{}, emitter)
	mgr.active = &activeConnection{
		id:    "con_test",
		conn:  &mockPool{}, // ping succeeds (nil pingFn returns nil)
		state: StateError,  // previous error state
	}

	mgr.performHealthCheck(context.Background(), "con_test")

	// State should recover to connected.
	mgr.mu.RLock()
	state := mgr.active.state
	mgr.mu.RUnlock()

	assert.Equal(t, StateConnected, state)

	// Emitter should have received StateConnected (recovery).
	calls := emitter.snapshot()
	require.Len(t, calls, 1)
	assert.Equal(t, StateConnected, calls[0].state)
}

func TestPerformHealthCheck_StaleConnection(t *testing.T) {
	mgr := NewManager(&mockConnector{}, nil)
	// No active connection — performHealthCheck should be a no-op.
	mgr.performHealthCheck(context.Background(), "con_stale")
	// Just verifying no panic occurs.
}

func TestConnectionError_Error(t *testing.T) {
	tests := []struct {
		name     string
		err      *ConnectionError
		expected string
	}{
		{
			name:     "with connID",
			err:      &ConnectionError{ConnID: "con_abc", Operation: "connect", Message: "timeout"},
			expected: "[con_abc] connect: timeout",
		},
		{
			name:     "without connID",
			err:      &ConnectionError{Operation: "resolve", Message: "no active connection"},
			expected: "resolve: no active connection",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.err.Error())
		})
	}
}

func TestConnectionError_Unwrap(t *testing.T) {
	original := errors.New("original cause")
	connErr := &ConnectionError{
		Operation:   "connect",
		Message:     "something failed",
		OriginalErr: original,
	}
	// errors.Is traverses the Unwrap chain.
	assert.True(t, errors.Is(connErr, original))
}
