package events

import "sync"

// nopEmitter discards all events.
type nopEmitter struct{}

func (nopEmitter) Emit(_ string, _ any) {}

// NopEmitter is an Emitter that silently discards every event.
// Use it in tests or when event emission is not needed.
var NopEmitter Emitter = nopEmitter{}

// RecordedEvent holds a single captured event from RecordingEmitter.
type RecordedEvent struct {
	Name string
	Data any
}

// RecordingEmitter is a thread-safe Emitter that records all emitted events.
// It is exported for use by other packages' tests.
type RecordingEmitter struct {
	mu     sync.Mutex
	events []RecordedEvent
}

// Emit records the event.
func (r *RecordingEmitter) Emit(name string, data any) {
	r.mu.Lock()
	r.events = append(r.events, RecordedEvent{Name: name, Data: data})
	r.mu.Unlock()
}

// Events returns a snapshot of all recorded events in emission order.
func (r *RecordingEmitter) Events() []RecordedEvent {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]RecordedEvent, len(r.events))
	copy(out, r.events)
	return out
}

// EventsByName returns a snapshot of all recorded events with the given name.
func (r *RecordingEmitter) EventsByName(name string) []RecordedEvent {
	r.mu.Lock()
	defer r.mu.Unlock()
	var out []RecordedEvent
	for _, e := range r.events {
		if e.Name == name {
			out = append(out, e)
		}
	}
	return out
}

// Count returns the total number of recorded events.
func (r *RecordingEmitter) Count() int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return len(r.events)
}

// Reset clears all recorded events.
func (r *RecordingEmitter) Reset() {
	r.mu.Lock()
	r.events = r.events[:0]
	r.mu.Unlock()
}
