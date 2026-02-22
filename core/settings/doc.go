// Package settings manages persistent application configuration stored in
// ~/.sequelbook/. It provides a thread-safe Store that reads and writes two
// JSON files:
//
//   - config.json: app-level preferences (e.g. page size)
//   - connections.json: saved database connection entries
//
// The Store is the persistence layer consumed by core/connection.Manager at
// runtime. It has no dependencies on other core packages.
package settings
