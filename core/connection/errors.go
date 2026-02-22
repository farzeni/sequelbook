package connection

import (
	"errors"
	"fmt"
)

// ConnectionError represents a connection operation failure.
type ConnectionError struct {
	ConnID      string // empty before ID is assigned
	Operation   string // "connect" | "disconnect" | "test" | "resolve" | "close"
	Message     string
	OriginalErr error
}

// Error implements the error interface.
// Format: "[con_xxx] connect: message" or "connect: message" when ConnID is empty.
func (e *ConnectionError) Error() string {
	if e.ConnID != "" {
		return fmt.Sprintf("[%s] %s: %s", e.ConnID, e.Operation, e.Message)
	}
	return fmt.Sprintf("%s: %s", e.Operation, e.Message)
}

// Unwrap returns the underlying error for error chain support.
func (e *ConnectionError) Unwrap() error {
	return e.OriginalErr
}

// Sentinel errors for errors.Is checks.
var (
	ErrAlreadyConnected   = errors.New("a connection is already active; disconnect first")
	ErrNotConnected       = errors.New("no active connection")
	ErrManagerClosed      = errors.New("manager is closed")
	ErrConnectionNotFound = errors.New("connection ID not found")
)
