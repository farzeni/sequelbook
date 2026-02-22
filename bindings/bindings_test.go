package bindings_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/sequelbook/sequelbook/bindings"
	"github.com/sequelbook/sequelbook/core/connection"
	"github.com/sequelbook/sequelbook/core/executor"
	"github.com/sequelbook/sequelbook/core/result"
	"github.com/sequelbook/sequelbook/events"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ── Mock executor ─────────────────────────────────────────────────────────────

type mockExecutor struct {
	result *executor.Result
	err    error
}

func (m *mockExecutor) Execute(_ context.Context, _, _ string) (*executor.Result, error) {
	return m.result, m.err
}

func (m *mockExecutor) Cancel(_ string) error { return nil }
func (m *mockExecutor) Close() error          { return nil }

func successExecutor(queryID string, rowCount int64, duration time.Duration) *mockExecutor {
	return &mockExecutor{
		result: &executor.Result{
			QueryID: queryID,
			Columns: []executor.Column{{Name: "id", DatabaseType: "int4", DisplayType: "number"}},
			Rows:    [][]any{{int64(1)}, {int64(2)}},
			Meta: executor.QueryMeta{
				StartTime:  time.Now().Add(-duration),
				EndTime:    time.Now(),
				Duration:   duration,
				RowCount:   rowCount,
				CommandTag: "SELECT 2",
			},
		},
	}
}

func failExecutor(err error) *mockExecutor {
	return &mockExecutor{err: err}
}

// ── connectionStateAdapter tests ──────────────────────────────────────────────

func TestConnectionStateAdapter_EmitsOnStateChange(t *testing.T) {
	rec := &events.RecordingEmitter{}
	adapter := bindings.NewConnectionStateAdapter(rec)

	adapter.EmitConnectionState("con_123", connection.StateConnected, nil)

	evs := rec.Events()
	require.Len(t, evs, 1)
	assert.Equal(t, events.ConnectionStateChanged, evs[0].Name)

	payload, ok := evs[0].Data.(events.ConnectionStateChangedPayload)
	require.True(t, ok, "expected ConnectionStateChangedPayload, got %T", evs[0].Data)
	assert.Equal(t, "con_123", payload.ConnID)
	assert.Equal(t, "connected", payload.State)
	assert.Empty(t, payload.Error)
}

func TestConnectionStateAdapter_EmitsErrorPayload(t *testing.T) {
	rec := &events.RecordingEmitter{}
	adapter := bindings.NewConnectionStateAdapter(rec)

	connErr := errors.New("timeout")
	adapter.EmitConnectionState("con_456", connection.StateError, connErr)

	evs := rec.Events()
	require.Len(t, evs, 1)

	payload, ok := evs[0].Data.(events.ConnectionStateChangedPayload)
	require.True(t, ok)
	assert.Equal(t, "error", payload.State)
	assert.Equal(t, "timeout", payload.Error)
}

func TestConnectionStateAdapter_AllStates(t *testing.T) {
	states := []struct {
		state    connection.State
		wantStr  string
	}{
		{connection.StateDisconnected, "disconnected"},
		{connection.StateConnecting, "connecting"},
		{connection.StateConnected, "connected"},
		{connection.StateError, "error"},
	}

	for _, tc := range states {
		t.Run(string(tc.state), func(t *testing.T) {
			rec := &events.RecordingEmitter{}
			adapter := bindings.NewConnectionStateAdapter(rec)
			adapter.EmitConnectionState("con_x", tc.state, nil)

			evs := rec.Events()
			require.Len(t, evs, 1)
			payload := evs[0].Data.(events.ConnectionStateChangedPayload)
			assert.Equal(t, tc.wantStr, payload.State)
		})
	}
}

// ── QueryService tests ────────────────────────────────────────────────────────

func newQueryService(exec executor.Executor, emitter events.Emitter) (*bindings.QueryService, *result.Handler) {
	handler := result.NewHandler(10)
	svc := bindings.NewQueryService(exec, handler, emitter)
	return svc, handler
}

func TestQueryService_ExecuteQuery_Success(t *testing.T) {
	rec := &events.RecordingEmitter{}
	exec := successExecutor("qry_test01", 2, 42*time.Millisecond)
	svc, _ := newQueryService(exec, rec)

	resp, err := svc.ExecuteQuery("con_1", "SELECT 1, 2")
	require.NoError(t, err)
	require.NotNil(t, resp)

	assert.NotEmpty(t, resp.ResultID)
	assert.NotNil(t, resp.Page)
	assert.NotNil(t, resp.Meta)
	assert.Equal(t, int64(2), resp.Meta.RowCount)
	assert.Len(t, resp.Page.Rows, 2)
}

func TestQueryService_ExecuteQuery_EmitsEvents(t *testing.T) {
	rec := &events.RecordingEmitter{}
	exec := successExecutor("qry_evtest", 3, 10*time.Millisecond)
	svc, _ := newQueryService(exec, rec)

	_, err := svc.ExecuteQuery("con_1", "SELECT 1")
	require.NoError(t, err)

	named := func(name string) []events.RecordedEvent {
		return rec.EventsByName(name)
	}

	// QueryStarted should be emitted before execution.
	assert.Len(t, named(events.QueryStarted), 1, "QueryStarted should be emitted once")
	// QueryCompleted should be emitted on success.
	assert.Len(t, named(events.QueryCompleted), 1, "QueryCompleted should be emitted once")
	// No failure events.
	assert.Empty(t, named(events.QueryFailed))
	assert.Empty(t, named(events.QueryCancelled))
}

func TestQueryService_ExecuteQuery_EmitsQueryStartedWithSQLPreview(t *testing.T) {
	rec := &events.RecordingEmitter{}
	exec := successExecutor("qry_sql", 0, time.Millisecond)
	svc, _ := newQueryService(exec, rec)

	sql := "SELECT id FROM users"
	_, err := svc.ExecuteQuery("con_1", sql)
	require.NoError(t, err)

	startedEvs := rec.EventsByName(events.QueryStarted)
	require.Len(t, startedEvs, 1)

	payload, ok := startedEvs[0].Data.(events.QueryStartedPayload)
	require.True(t, ok)
	assert.Equal(t, sql, payload.SQLPreview)
}

func TestQueryService_ExecuteQuery_EmitsQueryCompletedWithStats(t *testing.T) {
	rec := &events.RecordingEmitter{}
	dur := 99 * time.Millisecond
	exec := successExecutor("qry_stats", 5, dur)
	svc, _ := newQueryService(exec, rec)

	_, err := svc.ExecuteQuery("con_1", "SELECT 1")
	require.NoError(t, err)

	completedEvs := rec.EventsByName(events.QueryCompleted)
	require.Len(t, completedEvs, 1)

	payload, ok := completedEvs[0].Data.(events.QueryCompletedPayload)
	require.True(t, ok)
	assert.Equal(t, int64(5), payload.RowCount)
	assert.Equal(t, dur, payload.Duration)
}

func TestQueryService_ExecuteQuery_ExecutionError(t *testing.T) {
	rec := &events.RecordingEmitter{}
	execErr := &executor.ExecutionError{
		QueryID:  "qry_fail",
		Message:  "relation does not exist",
		Code:     "42P01",
		Position: 7,
	}
	exec := failExecutor(execErr)
	svc, _ := newQueryService(exec, rec)

	resp, err := svc.ExecuteQuery("con_1", "SELECT * FROM missing_table")
	assert.Nil(t, resp)
	require.Error(t, err)

	failedEvs := rec.EventsByName(events.QueryFailed)
	require.Len(t, failedEvs, 1)

	payload, ok := failedEvs[0].Data.(events.QueryFailedPayload)
	require.True(t, ok)
	assert.Equal(t, "qry_fail", payload.QueryID)
	assert.Equal(t, int32(7), payload.Position)
	assert.NotEmpty(t, payload.Error)
}

func TestQueryService_ExecuteQuery_CancellationError(t *testing.T) {
	rec := &events.RecordingEmitter{}
	cancelErr := &executor.ExecutionError{
		QueryID: "qry_cancel",
		Message: "query cancelled by user",
		Code:    "57014",
	}
	exec := failExecutor(cancelErr)
	svc, _ := newQueryService(exec, rec)

	_, err := svc.ExecuteQuery("con_1", "SELECT pg_sleep(100)")
	require.Error(t, err)

	assert.Empty(t, rec.EventsByName(events.QueryFailed))
	cancelledEvs := rec.EventsByName(events.QueryCancelled)
	require.Len(t, cancelledEvs, 1)

	payload, ok := cancelledEvs[0].Data.(events.QueryCancelledPayload)
	require.True(t, ok)
	assert.Equal(t, "qry_cancel", payload.QueryID)
}

func TestQueryService_GetResultPage(t *testing.T) {
	rec := &events.RecordingEmitter{}
	exec := successExecutor("qry_page", 2, time.Millisecond)
	svc, _ := newQueryService(exec, rec)

	resp, err := svc.ExecuteQuery("con_1", "SELECT 1")
	require.NoError(t, err)

	page, err := svc.GetResultPage(resp.ResultID, 0, 10)
	require.NoError(t, err)
	assert.Equal(t, int64(2), page.Total)
}

func TestQueryService_GetResultMeta(t *testing.T) {
	rec := &events.RecordingEmitter{}
	exec := successExecutor("qry_meta", 2, time.Millisecond)
	svc, _ := newQueryService(exec, rec)

	resp, err := svc.ExecuteQuery("con_1", "SELECT 1")
	require.NoError(t, err)

	meta, err := svc.GetResultMeta(resp.ResultID)
	require.NoError(t, err)
	assert.Equal(t, resp.ResultID, meta.ResultID)
	assert.Equal(t, int64(2), meta.RowCount)
}

func TestQueryService_DisposeResult(t *testing.T) {
	rec := &events.RecordingEmitter{}
	exec := successExecutor("qry_dispose", 1, time.Millisecond)
	svc, _ := newQueryService(exec, rec)

	resp, err := svc.ExecuteQuery("con_1", "SELECT 1")
	require.NoError(t, err)

	svc.DisposeResult(resp.ResultID)

	// After dispose, GetResultMeta should return an error.
	_, err = svc.GetResultMeta(resp.ResultID)
	assert.Error(t, err)
}

func TestQueryService_CancelQuery(t *testing.T) {
	rec := &events.RecordingEmitter{}
	exec := &mockExecutor{}
	svc, _ := newQueryService(exec, rec)

	// Cancel a non-existent query — mockExecutor.Cancel returns nil.
	err := svc.CancelQuery("qry_any")
	require.NoError(t, err)

	cancelledEvs := rec.EventsByName(events.QueryCancelled)
	require.Len(t, cancelledEvs, 1)
	payload := cancelledEvs[0].Data.(events.QueryCancelledPayload)
	assert.Equal(t, "qry_any", payload.QueryID)
}
