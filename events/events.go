package events

import "time"

// Event name constants — must match the names registered in register.go and
// subscribed to by the frontend.
const (
	ConnectionStateChanged = "sequelbook:connection-state-changed"
	QueryStarted           = "sequelbook:query-started"
	QueryCompleted         = "sequelbook:query-completed"
	QueryFailed            = "sequelbook:query-failed"
	QueryCancelled         = "sequelbook:query-cancelled"
	Notification           = "sequelbook:notification"
)

// Severity classifies the urgency of a Notification event.
type Severity string

const (
	SeverityInfo    Severity = "info"
	SeverityWarning Severity = "warning"
	SeverityError   Severity = "error"
)

// ConnectionStateChangedPayload is emitted when a connection's lifecycle state
// changes. State is a plain string (e.g. "connected") to avoid importing core/.
type ConnectionStateChangedPayload struct {
	ConnID string `json:"connId"`
	State  string `json:"state"`
	Error  string `json:"error,omitempty"`
}

// QueryStartedPayload is emitted when query execution begins.
// SQLPreview is truncated to 120 characters.
type QueryStartedPayload struct {
	QueryID    string `json:"queryId"`
	SQLPreview string `json:"sqlPreview"`
}

// QueryCompletedPayload is emitted when a query finishes successfully.
// Duration is in nanoseconds (time.Duration = int64); the frontend converts.
type QueryCompletedPayload struct {
	QueryID  string        `json:"queryId"`
	RowCount int64         `json:"rowCount"`
	Duration time.Duration `json:"duration"`
}

// QueryFailedPayload is emitted when a query fails.
// Position is the byte offset of the error in the SQL string, if known.
type QueryFailedPayload struct {
	QueryID  string `json:"queryId"`
	Error    string `json:"error"`
	Position int32  `json:"position,omitempty"`
}

// QueryCancelledPayload is emitted when a query is cancelled by the user.
type QueryCancelledPayload struct {
	QueryID string `json:"queryId"`
}

// NotificationPayload is emitted for user-visible notifications (toasts, etc.).
type NotificationPayload struct {
	Severity Severity `json:"severity"`
	Title    string   `json:"title"`
	Message  string   `json:"message"`
}
