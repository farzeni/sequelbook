package result

import (
	"github.com/sequelbook/sequelbook/core/executor"
)

// storedResult is the internal representation of a cached result set.
// Rows are serialized eagerly at Store time.
type storedResult struct {
	id      string
	queryID string
	columns []executor.Column
	rows    [][]any         // already JSON-safe (serialized at Store time)
	meta    executor.QueryMeta
}

// Handler stores and paginates executor results.
// All public methods are safe for concurrent use.
type Handler struct {
	lru *lruCache // thread-safety owned by lruCache.mu
}

// NewHandler creates a new Handler with the given LRU capacity.
// If maxResults <= 0, uses DefaultMaxResults.
func NewHandler(maxResults int) *Handler {
	if maxResults <= 0 {
		maxResults = DefaultMaxResults
	}
	return &Handler{
		lru: newLRUCache(maxResults),
	}
}

// Store serializes and caches a result. Returns the assigned result ID.
// If the cache is full, the least-recently-used result is evicted silently.
func (h *Handler) Store(result *executor.Result) (string, error) {
	id := NewResultID()

	serializedRows := make([][]any, len(result.Rows))
	for i, row := range result.Rows {
		serializedRows[i] = serializeRow(row, result.Columns)
	}

	sr := &storedResult{
		id:      id,
		queryID: result.QueryID,
		columns: result.Columns,
		rows:    serializedRows,
		meta:    result.Meta,
	}

	h.lru.put(id, sr)
	return id, nil
}

// GetPage returns a window of serialized rows [offset, offset+limit).
// If offset >= total, returns an empty page (HasMore=false) — not an error.
// If limit <= 0, uses PageSize.
func (h *Handler) GetPage(resultID string, offset int64, limit int) (*Page, error) {
	if offset < 0 {
		return nil, &ResultError{
			ResultID:    resultID,
			Operation:   "page",
			Message:     ErrInvalidOffset.Error(),
			OriginalErr: ErrInvalidOffset,
		}
	}
	if limit <= 0 {
		limit = PageSize
	}

	sr, ok := h.lru.get(resultID)
	if !ok {
		return nil, &ResultError{
			ResultID:    resultID,
			Operation:   "page",
			Message:     ErrResultNotFound.Error(),
			OriginalErr: ErrResultNotFound,
		}
	}

	total := int64(len(sr.rows))

	page := &Page{
		ResultID: resultID,
		Offset:   offset,
		Limit:    limit,
		Total:    total,
	}

	if offset >= total {
		page.Rows = [][]any{}
		page.HasMore = false
		return page, nil
	}

	end := offset + int64(limit)
	if end > total {
		end = total
	}

	// Copy the slice window to avoid exposing internal state.
	window := sr.rows[offset:end]
	rows := make([][]any, len(window))
	copy(rows, window)
	page.Rows = rows
	page.HasMore = end < total

	return page, nil
}

// GetMeta returns metadata for a stored result (no row data).
func (h *Handler) GetMeta(resultID string) (*ResultMeta, error) {
	sr, ok := h.lru.get(resultID)
	if !ok {
		return nil, &ResultError{
			ResultID:    resultID,
			Operation:   "meta",
			Message:     ErrResultNotFound.Error(),
			OriginalErr: ErrResultNotFound,
		}
	}

	return &ResultMeta{
		ResultID:   sr.id,
		QueryID:    sr.queryID,
		Columns:    sr.columns,
		RowCount:   int64(len(sr.rows)),
		StartTime:  sr.meta.StartTime,
		EndTime:    sr.meta.EndTime,
		Duration:   sr.meta.Duration,
		CommandTag: sr.meta.CommandTag,
	}, nil
}

// Dispose removes a result set from the cache.
// No-op and no error if resultID is not found.
func (h *Handler) Dispose(resultID string) {
	h.lru.delete(resultID)
}
