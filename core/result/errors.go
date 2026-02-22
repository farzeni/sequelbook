package result

import (
	"errors"
	"fmt"
)

// ResultError represents a result operation failure.
type ResultError struct {
	ResultID    string // empty before ID is assigned
	Operation   string // "store" | "page" | "meta"
	Message     string
	OriginalErr error
}

// Error implements the error interface.
// Format: "[res_xxx] page: message" or "page: message" when ResultID is empty.
func (e *ResultError) Error() string {
	if e.ResultID != "" {
		return fmt.Sprintf("[%s] %s: %s", e.ResultID, e.Operation, e.Message)
	}
	return fmt.Sprintf("%s: %s", e.Operation, e.Message)
}

// Unwrap returns the underlying error for error chain support.
func (e *ResultError) Unwrap() error {
	return e.OriginalErr
}

// Sentinel errors for errors.Is checks.
var (
	ErrResultNotFound = errors.New("result not found")
	ErrInvalidOffset  = errors.New("offset must be non-negative")
)
