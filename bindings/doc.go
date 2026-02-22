// Package bindings is the Wails v3 service layer for sequelbook.
// It exposes three services to the frontend via Wails IPC:
//
//   - BookService  — book file I/O, file dialogs, chapter/section/block mutations
//   - ConnectionService — connect/disconnect/test connections, saved connection CRUD
//   - QueryService — execute queries, cancel, paginated result access, dispose
//
// Each service holds its dependencies by injection; all business logic lives in
// the core/ packages. Bindings return Go structs that Wails auto-serializes to
// JSON; errors are returned as Go error values and propagated to the frontend
// as rejected promises.
//
// The connectionStateAdapter in connection.go bridges connection.StateEmitter
// (which uses core/connection types) to events.Emitter (which uses plain
// strings), keeping events/ free of core/ dependencies.
package bindings
