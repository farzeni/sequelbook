// Package result is the serialization boundary between the Go backend and the
// Wails frontend.
//
// It receives a raw *executor.Result (which contains untyped [][]any rows from
// pgx), stores it in a bounded LRU cache, and serves paginated, JSON-safe
// slices on demand. Nothing above this package sees pgx types; nothing below it
// sees []any.
//
// # Usage
//
//	h := result.NewHandler(50)
//
//	// Store a result from the executor.
//	id, err := h.Store(execResult)
//
//	// Retrieve a page of rows.
//	page, err := h.GetPage(id, 0, result.PageSize)
//
//	// Retrieve metadata only.
//	meta, err := h.GetMeta(id)
//
//	// Release the result when done.
//	h.Dispose(id)
package result
