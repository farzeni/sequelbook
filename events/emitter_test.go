package events_test

import (
	"testing"

	"github.com/sequelbook/sequelbook/events"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockDispatcher records calls to Emit for assertion.
type mockDispatcher struct {
	calls []dispatchCall
}

type dispatchCall struct {
	name string
	data []any
}

func (m *mockDispatcher) Emit(name string, data ...any) bool {
	m.calls = append(m.calls, dispatchCall{name: name, data: data})
	return true
}

func TestWailsEmitter_DelegatesToDispatcher(t *testing.T) {
	d := &mockDispatcher{}
	em := events.NewWailsEmitter(d)

	em.Emit("test-event", "payload")

	require.Len(t, d.calls, 1)
	assert.Equal(t, "test-event", d.calls[0].name)
	assert.Equal(t, []any{"payload"}, d.calls[0].data)
}

func TestWailsEmitter_StructPayload(t *testing.T) {
	d := &mockDispatcher{}
	em := events.NewWailsEmitter(d)

	payload := events.NotificationPayload{
		Severity: events.SeverityInfo,
		Title:    "hello",
		Message:  "world",
	}
	em.Emit(events.Notification, payload)

	require.Len(t, d.calls, 1)
	assert.Equal(t, events.Notification, d.calls[0].name)
	require.Len(t, d.calls[0].data, 1)
	got, ok := d.calls[0].data[0].(events.NotificationPayload)
	require.True(t, ok, "expected NotificationPayload")
	assert.Equal(t, payload, got)
}
