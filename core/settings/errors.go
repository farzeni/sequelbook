package settings

import (
	"errors"
	"fmt"
)

// SettingsError represents a settings operation failure.
type SettingsError struct {
	Operation   string // "load" | "save" | "delete"
	Message     string
	OriginalErr error
}

// Error implements the error interface.
// Format: "load: message"
func (e *SettingsError) Error() string {
	return fmt.Sprintf("%s: %s", e.Operation, e.Message)
}

// Unwrap returns the underlying error for error chain support.
func (e *SettingsError) Unwrap() error {
	return e.OriginalErr
}

// Sentinel errors for errors.Is checks.
var (
	ErrConnectionNotFound = errors.New("connection not found")
)
