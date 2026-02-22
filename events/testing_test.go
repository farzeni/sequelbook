package events_test

import (
	"sync"
	"testing"

	"github.com/sequelbook/sequelbook/events"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNopEmitter_DoesNotPanic(t *testing.T) {
	assert.NotPanics(t, func() {
		events.NopEmitter.Emit("any-event", "data")
		events.NopEmitter.Emit("another", 42)
		events.NopEmitter.Emit("struct", events.NotificationPayload{})
	})
}

func TestRecordingEmitter_Records(t *testing.T) {
	rec := &events.RecordingEmitter{}

	rec.Emit("event-a", "payload1")
	rec.Emit("event-b", 99)
	rec.Emit("event-a", "payload2")

	evts := rec.Events()
	require.Len(t, evts, 3)
	assert.Equal(t, "event-a", evts[0].Name)
	assert.Equal(t, "payload1", evts[0].Data)
	assert.Equal(t, "event-b", evts[1].Name)
	assert.Equal(t, "event-a", evts[2].Name)
	assert.Equal(t, "payload2", evts[2].Data)
}

func TestRecordingEmitter_ConcurrentSafe(t *testing.T) {
	rec := &events.RecordingEmitter{}
	var wg sync.WaitGroup
	const goroutines = 50

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			rec.Emit("event", "data")
		}()
	}
	wg.Wait()

	assert.Equal(t, goroutines, rec.Count())
}

func TestRecordingEmitter_EventsByName(t *testing.T) {
	rec := &events.RecordingEmitter{}
	rec.Emit("alpha", 1)
	rec.Emit("beta", 2)
	rec.Emit("alpha", 3)

	alphas := rec.EventsByName("alpha")
	require.Len(t, alphas, 2)
	assert.Equal(t, 1, alphas[0].Data)
	assert.Equal(t, 3, alphas[1].Data)

	betas := rec.EventsByName("beta")
	require.Len(t, betas, 1)

	none := rec.EventsByName("gamma")
	assert.Empty(t, none)
}

func TestRecordingEmitter_Reset(t *testing.T) {
	rec := &events.RecordingEmitter{}
	rec.Emit("x", nil)
	rec.Emit("y", nil)
	assert.Equal(t, 2, rec.Count())

	rec.Reset()
	assert.Equal(t, 0, rec.Count())
	assert.Empty(t, rec.Events())
}

func TestRecordingEmitter_Snapshot(t *testing.T) {
	rec := &events.RecordingEmitter{}
	rec.Emit("e", "v1")

	snap := rec.Events()
	// Mutating the snapshot must not affect internal state.
	snap[0] = events.RecordedEvent{Name: "mutated", Data: "x"}

	internal := rec.Events()
	assert.Equal(t, "e", internal[0].Name, "internal slice should not be affected by snapshot mutation")
}
