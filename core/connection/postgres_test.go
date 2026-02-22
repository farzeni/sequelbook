package connection

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// testConfig returns a ConnectionConfig for the local test PostgreSQL instance.
//
// To start the test database:
//
//	docker run --name sequelbook-test-db \
//	  -e POSTGRES_PASSWORD=test -e POSTGRES_DB=sequelbook_test \
//	  -p 5432:5432 -d postgres:16-alpine
func testConfig() ConnectionConfig {
	return ConnectionConfig{
		Host:     "localhost",
		Port:     5432,
		Database: "sequelbook_test",
		User:     "postgres",
		Password: "test",
		SSLMode:  "disable",
	}
}

// newTestManager creates a Manager backed by a real PostgresConnector.
func newTestManager(t *testing.T) *Manager {
	t.Helper()
	return NewManager(&PostgresConnector{}, nil)
}

func TestManager_Connect_Success(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	mgr := newTestManager(t)
	defer mgr.Close()

	connID, err := mgr.Connect(context.Background(), testConfig())
	require.NoError(t, err)
	assert.True(t, len(connID) > 4)
	assert.True(t, len(connID) > len("con_"))

	id, ok := mgr.ActiveConnection()
	assert.True(t, ok)
	assert.Equal(t, connID, id)
}

func TestManager_ConnectDisconnect_Cycle(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	mgr := newTestManager(t)
	defer mgr.Close()

	cfg := testConfig()
	for i := 0; i < 3; i++ {
		connID, err := mgr.Connect(context.Background(), cfg)
		require.NoError(t, err, "connect attempt %d", i)

		err = mgr.Disconnect(connID)
		require.NoError(t, err, "disconnect attempt %d", i)

		_, ok := mgr.ActiveConnection()
		assert.False(t, ok, "should have no active connection after disconnect %d", i)
	}
}

func TestManager_TestConnection_Valid(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	mgr := newTestManager(t)

	err := mgr.TestConnection(context.Background(), testConfig())
	assert.NoError(t, err)

	// TestConnection must not persist any state.
	_, ok := mgr.ActiveConnection()
	assert.False(t, ok)
}

func TestManager_TestConnection_BadCreds(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	mgr := newTestManager(t)

	badCfg := testConfig()
	badCfg.Password = "wrong_password_xyz123"
	badCfg.User = "nonexistent_user_xyz123"

	err := mgr.TestConnection(context.Background(), badCfg)
	assert.Error(t, err)

	// No state should have been persisted.
	_, ok := mgr.ActiveConnection()
	assert.False(t, ok)
}

func TestManager_GetConnection_Valid(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	mgr := newTestManager(t)
	defer mgr.Close()

	connID, err := mgr.Connect(context.Background(), testConfig())
	require.NoError(t, err)

	pool, _, err := mgr.GetConnection(connID)
	require.NoError(t, err)
	require.NotNil(t, pool)

	// Verify the returned connection is usable (PostgresConnector returns PgxPoolAdapter).
	pgxPool := pool.(*PgxPoolAdapter).PgxPool()
	rows, queryErr := pgxPool.Query(context.Background(), "SELECT 1")
	require.NoError(t, queryErr)
	rows.Close()
}

func TestManager_HealthCheck_StopsOnDisconnect(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	mgr := newTestManager(t)

	connID, err := mgr.Connect(context.Background(), testConfig())
	require.NoError(t, err)

	// Allow goroutine to start.
	time.Sleep(50 * time.Millisecond)

	err = mgr.Disconnect(connID)
	require.NoError(t, err)

	// Give the goroutine time to observe ctx cancellation and exit.
	time.Sleep(50 * time.Millisecond)

	_, ok := mgr.ActiveConnection()
	assert.False(t, ok)
}

func TestManager_Concurrency(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	mgr := newTestManager(t)
	defer mgr.Close()

	connID, err := mgr.Connect(context.Background(), testConfig())
	require.NoError(t, err)

	const n = 50
	var wg sync.WaitGroup
	errs := make([]error, n)

	for i := 0; i < n; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			_, _, errs[idx] = mgr.GetConnection(connID)
		}(i)
	}

	wg.Wait()

	for i, err := range errs {
		assert.NoError(t, err, "goroutine %d GetConnection failed", i)
	}
}
