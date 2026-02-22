// Package events defines the backend-to-frontend push notification layer for
// sequelbook. It provides event name constants, JSON-serializable payload
// structs, an Emitter abstraction over the Wails event system, nil-safe
// convenience helpers, and exported test doubles for use by other packages.
//
// This package has no dependencies on core/ — only stdlib and Wails. Adapters
// that bridge core/ types (e.g. connection.State → string) live in bindings/.
package events
