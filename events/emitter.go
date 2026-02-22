package events

// Emitter is the single method interface the rest of the application uses to
// fire events at the frontend. A nil Emitter is handled gracefully by all
// helpers in helpers.go.
type Emitter interface {
	Emit(name string, data any)
}

// EventDispatcher is a narrow interface matching the subset of the Wails
// EventManager that we need. In production, app.Event satisfies this.
// In tests, a simple mock is used.
type EventDispatcher interface {
	Emit(name string, data ...any) bool
}

// WailsEmitter adapts an EventDispatcher (i.e. app.Event) to the Emitter
// interface used by the rest of the application.
type WailsEmitter struct {
	dispatcher EventDispatcher
}

// NewWailsEmitter creates a WailsEmitter backed by the given dispatcher.
func NewWailsEmitter(dispatcher EventDispatcher) *WailsEmitter {
	return &WailsEmitter{dispatcher: dispatcher}
}

// Emit fires the named event with data to all frontend subscribers.
func (e *WailsEmitter) Emit(name string, data any) {
	e.dispatcher.Emit(name, data)
}
