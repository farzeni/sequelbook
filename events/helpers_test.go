package events_test

import (
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/sequelbook/sequelbook/events"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestEmitConnectionStateChanged_NilEmitter(t *testing.T) {
	// Must not panic.
	assert.NotPanics(t, func() {
		events.EmitConnectionStateChanged(nil, "con_1", "connected", nil)
	})
}

func TestEmitConnectionStateChanged_WithError(t *testing.T) {
	rec := &events.RecordingEmitter{}
	events.EmitConnectionStateChanged(rec, "con_1", "error", errors.New("timeout"))

	evts := rec.EventsByName(events.ConnectionStateChanged)
	require.Len(t, evts, 1)
	p, ok := evts[0].Data.(events.ConnectionStateChangedPayload)
	require.True(t, ok)
	assert.Equal(t, "con_1", p.ConnID)
	assert.Equal(t, "error", p.State)
	assert.Equal(t, "timeout", p.Error)
}

func TestEmitConnectionStateChanged_NoError(t *testing.T) {
	rec := &events.RecordingEmitter{}
	events.EmitConnectionStateChanged(rec, "con_2", "connected", nil)

	evts := rec.EventsByName(events.ConnectionStateChanged)
	require.Len(t, evts, 1)
	p := evts[0].Data.(events.ConnectionStateChangedPayload)
	assert.Empty(t, p.Error)
}

func TestEmitQueryStarted_TruncatesLongSQL(t *testing.T) {
	rec := &events.RecordingEmitter{}
	longSQL := strings.Repeat("x", 200)
	events.EmitQueryStarted(rec, "q1", longSQL)

	evts := rec.EventsByName(events.QueryStarted)
	require.Len(t, evts, 1)
	p := evts[0].Data.(events.QueryStartedPayload)
	assert.Equal(t, "q1", p.QueryID)
	assert.True(t, len([]rune(p.SQLPreview)) <= 123, "truncated preview should be at most 123 runes (120 + ...)")
	assert.True(t, strings.HasSuffix(p.SQLPreview, "..."), "truncated SQL should end with ...")
}

func TestEmitQueryStarted_ShortSQL(t *testing.T) {
	rec := &events.RecordingEmitter{}
	events.EmitQueryStarted(rec, "q2", "SELECT 1")

	evts := rec.EventsByName(events.QueryStarted)
	require.Len(t, evts, 1)
	p := evts[0].Data.(events.QueryStartedPayload)
	assert.Equal(t, "SELECT 1", p.SQLPreview)
}

func TestEmitQueryCompleted(t *testing.T) {
	rec := &events.RecordingEmitter{}
	events.EmitQueryCompleted(rec, "q3", 42, 5*time.Millisecond)

	evts := rec.EventsByName(events.QueryCompleted)
	require.Len(t, evts, 1)
	p := evts[0].Data.(events.QueryCompletedPayload)
	assert.Equal(t, "q3", p.QueryID)
	assert.Equal(t, int64(42), p.RowCount)
	assert.Equal(t, 5*time.Millisecond, p.Duration)
}

func TestEmitQueryFailed(t *testing.T) {
	rec := &events.RecordingEmitter{}
	events.EmitQueryFailed(rec, "q4", "syntax error", 15)

	evts := rec.EventsByName(events.QueryFailed)
	require.Len(t, evts, 1)
	p := evts[0].Data.(events.QueryFailedPayload)
	assert.Equal(t, "q4", p.QueryID)
	assert.Equal(t, "syntax error", p.Error)
	assert.Equal(t, int32(15), p.Position)
}

func TestEmitQueryCancelled(t *testing.T) {
	rec := &events.RecordingEmitter{}
	events.EmitQueryCancelled(rec, "q5")

	evts := rec.EventsByName(events.QueryCancelled)
	require.Len(t, evts, 1)
	p := evts[0].Data.(events.QueryCancelledPayload)
	assert.Equal(t, "q5", p.QueryID)
}

func TestEmitNotification_AllSeverities(t *testing.T) {
	tests := []struct {
		severity events.Severity
	}{
		{events.SeverityInfo},
		{events.SeverityWarning},
		{events.SeverityError},
	}
	for _, tc := range tests {
		t.Run(string(tc.severity), func(t *testing.T) {
			rec := &events.RecordingEmitter{}
			events.EmitNotification(rec, tc.severity, "title", "msg")

			evts := rec.EventsByName(events.Notification)
			require.Len(t, evts, 1)
			p := evts[0].Data.(events.NotificationPayload)
			assert.Equal(t, tc.severity, p.Severity)
			assert.Equal(t, "title", p.Title)
			assert.Equal(t, "msg", p.Message)
		})
	}
}

func TestTruncateSQL(t *testing.T) {
	// We test truncation behavior through EmitQueryStarted since truncateSQL is unexported.
	tests := []struct {
		name     string
		input    string
		wantSufx string
		wantLen  int // expected rune len of SQLPreview; -1 means exact match to input
	}{
		{"empty", "", "", 0},
		{"short", "SELECT 1", "", 8},
		{"exact 120", strings.Repeat("a", 120), "", 120},
		{"over 120", strings.Repeat("b", 121), "...", 123},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rec := &events.RecordingEmitter{}
			events.EmitQueryStarted(rec, "q", tc.input)
			p := rec.Events()[0].Data.(events.QueryStartedPayload)

			runes := []rune(p.SQLPreview)
			if tc.wantSufx != "" {
				assert.True(t, strings.HasSuffix(p.SQLPreview, tc.wantSufx))
				assert.Equal(t, tc.wantLen, len(runes))
			} else {
				assert.Equal(t, tc.input, p.SQLPreview)
			}
		})
	}
}
