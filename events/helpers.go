package events

import "time"

const sqlPreviewMaxLen = 120

// EmitConnectionStateChanged emits a ConnectionStateChanged event.
// err may be nil; if non-nil its message is included in the payload.
func EmitConnectionStateChanged(em Emitter, connID, state string, err error) {
	if em == nil {
		return
	}
	p := ConnectionStateChangedPayload{
		ConnID: connID,
		State:  state,
	}
	if err != nil {
		p.Error = err.Error()
	}
	em.Emit(ConnectionStateChanged, p)
}

// EmitQueryStarted emits a QueryStarted event.
// sql is truncated to 120 characters with a trailing "..." if longer.
func EmitQueryStarted(em Emitter, queryID, sql string) {
	if em == nil {
		return
	}
	em.Emit(QueryStarted, QueryStartedPayload{
		QueryID:    queryID,
		SQLPreview: truncateSQL(sql, sqlPreviewMaxLen),
	})
}

// EmitQueryCompleted emits a QueryCompleted event.
func EmitQueryCompleted(em Emitter, queryID string, rowCount int64, duration time.Duration) {
	if em == nil {
		return
	}
	em.Emit(QueryCompleted, QueryCompletedPayload{
		QueryID:  queryID,
		RowCount: rowCount,
		Duration: duration,
	})
}

// EmitQueryFailed emits a QueryFailed event.
func EmitQueryFailed(em Emitter, queryID, errMsg string, position int32) {
	if em == nil {
		return
	}
	em.Emit(QueryFailed, QueryFailedPayload{
		QueryID:  queryID,
		Error:    errMsg,
		Position: position,
	})
}

// EmitQueryCancelled emits a QueryCancelled event.
func EmitQueryCancelled(em Emitter, queryID string) {
	if em == nil {
		return
	}
	em.Emit(QueryCancelled, QueryCancelledPayload{QueryID: queryID})
}

// EmitNotification emits a Notification event.
func EmitNotification(em Emitter, severity Severity, title, message string) {
	if em == nil {
		return
	}
	em.Emit(Notification, NotificationPayload{
		Severity: severity,
		Title:    title,
		Message:  message,
	})
}

// truncateSQL returns s truncated to maxLen runes, appending "..." if truncated.
func truncateSQL(s string, maxLen int) string {
	runes := []rune(s)
	if len(runes) <= maxLen {
		return s
	}
	return string(runes[:maxLen]) + "..."
}
