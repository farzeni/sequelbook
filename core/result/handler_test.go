package result

import (
	"errors"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/sequelbook/sequelbook/core/executor"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// makeResult creates a synthetic executor.Result for testing.
func makeResult(queryID string, numRows int, cols ...executor.Column) *executor.Result {
	if len(cols) == 0 {
		cols = []executor.Column{
			{Name: "id", DisplayType: executor.DisplayTypeNumber},
			{Name: "name", DisplayType: executor.DisplayTypeText},
		}
	}
	rows := make([][]any, numRows)
	for i := range rows {
		row := make([]any, len(cols))
		for j := range cols {
			row[j] = int64(i*100 + j)
		}
		rows[i] = row
	}
	now := time.Now()
	return &executor.Result{
		QueryID: queryID,
		Columns: cols,
		Rows:    rows,
		Meta: executor.QueryMeta{
			StartTime:  now,
			EndTime:    now.Add(10 * time.Millisecond),
			Duration:   10 * time.Millisecond,
			RowCount:   int64(numRows),
			CommandTag: "SELECT " + strings.Repeat("x", 0),
		},
	}
}

// --- ResultID tests ---

func TestNewResultID(t *testing.T) {
	id1 := NewResultID()
	id2 := NewResultID()
	assert.True(t, strings.HasPrefix(id1, "res_"), "expected res_ prefix, got %s", id1)
	assert.True(t, strings.HasPrefix(id2, "res_"), "expected res_ prefix, got %s", id2)
	assert.NotEqual(t, id1, id2, "IDs should be unique")
}

// --- Handler.Store tests ---

func TestHandler_Store_Success(t *testing.T) {
	h := NewHandler(10)
	r := makeResult("qry_1", 5)
	id, err := h.Store(r)
	require.NoError(t, err)
	assert.True(t, strings.HasPrefix(id, "res_"))
}

func TestHandler_Store_SetsRowCount(t *testing.T) {
	h := NewHandler(10)
	r := makeResult("qry_1", 7)
	id, err := h.Store(r)
	require.NoError(t, err)

	meta, err := h.GetMeta(id)
	require.NoError(t, err)
	assert.Equal(t, int64(7), meta.RowCount)
}

func TestHandler_Store_LRUEviction(t *testing.T) {
	cap := 3
	h := NewHandler(cap)

	var firstID string
	for i := 0; i < cap+1; i++ {
		r := makeResult("qry", 1)
		id, err := h.Store(r)
		require.NoError(t, err)
		if i == 0 {
			firstID = id
		}
	}

	_, err := h.GetMeta(firstID)
	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrResultNotFound))
}

// --- Handler.GetPage tests ---

func TestHandler_GetPage_FirstPage(t *testing.T) {
	h := NewHandler(10)
	r := makeResult("qry_1", 300) // > PageSize
	id, _ := h.Store(r)

	page, err := h.GetPage(id, 0, PageSize)
	require.NoError(t, err)
	assert.Equal(t, id, page.ResultID)
	assert.Equal(t, int64(0), page.Offset)
	assert.Equal(t, PageSize, page.Limit)
	assert.Equal(t, int64(300), page.Total)
	assert.Len(t, page.Rows, PageSize)
	assert.True(t, page.HasMore)
}

func TestHandler_GetPage_LastPage(t *testing.T) {
	h := NewHandler(10)
	r := makeResult("qry_1", 250)
	id, _ := h.Store(r)

	page, err := h.GetPage(id, 200, PageSize)
	require.NoError(t, err)
	assert.Len(t, page.Rows, 50)
	assert.False(t, page.HasMore)
}

func TestHandler_GetPage_ExactFit(t *testing.T) {
	h := NewHandler(10)
	r := makeResult("qry_1", PageSize) // exactly PageSize rows
	id, _ := h.Store(r)

	page, err := h.GetPage(id, 0, PageSize)
	require.NoError(t, err)
	assert.Len(t, page.Rows, PageSize)
	assert.False(t, page.HasMore)
}

func TestHandler_GetPage_OffsetAtTotal(t *testing.T) {
	h := NewHandler(10)
	r := makeResult("qry_1", 10)
	id, _ := h.Store(r)

	page, err := h.GetPage(id, 10, PageSize)
	require.NoError(t, err)
	assert.Empty(t, page.Rows)
	assert.False(t, page.HasMore)
	assert.Equal(t, int64(10), page.Total)
}

func TestHandler_GetPage_NotFound(t *testing.T) {
	h := NewHandler(10)
	_, err := h.GetPage("res_doesnotexist", 0, PageSize)
	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrResultNotFound))
}

func TestHandler_GetPage_NegativeOffset(t *testing.T) {
	h := NewHandler(10)
	r := makeResult("qry_1", 5)
	id, _ := h.Store(r)

	_, err := h.GetPage(id, -1, PageSize)
	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrInvalidOffset))
}

func TestHandler_GetPage_ZeroLimit(t *testing.T) {
	h := NewHandler(10)
	r := makeResult("qry_1", 300)
	id, _ := h.Store(r)

	page, err := h.GetPage(id, 0, 0)
	require.NoError(t, err)
	assert.Equal(t, PageSize, page.Limit)
	assert.Len(t, page.Rows, PageSize)
}

// --- Handler.GetMeta tests ---

func TestHandler_GetMeta_Valid(t *testing.T) {
	h := NewHandler(10)
	now := time.Now().UTC().Truncate(time.Second)
	r := &executor.Result{
		QueryID: "qry_abc",
		Columns: []executor.Column{{Name: "x", DisplayType: executor.DisplayTypeNumber}},
		Rows:    [][]any{{int64(1)}, {int64(2)}},
		Meta: executor.QueryMeta{
			StartTime:  now,
			EndTime:    now.Add(5 * time.Millisecond),
			Duration:   5 * time.Millisecond,
			RowCount:   2,
			CommandTag: "SELECT 2",
		},
	}
	id, _ := h.Store(r)

	meta, err := h.GetMeta(id)
	require.NoError(t, err)
	assert.Equal(t, id, meta.ResultID)
	assert.Equal(t, "qry_abc", meta.QueryID)
	assert.Equal(t, int64(2), meta.RowCount)
	assert.Equal(t, "SELECT 2", meta.CommandTag)
	assert.Equal(t, now, meta.StartTime)
	assert.Equal(t, 5*time.Millisecond, meta.Duration)
	assert.Len(t, meta.Columns, 1)
	assert.Equal(t, "x", meta.Columns[0].Name)
}

func TestHandler_GetMeta_NotFound(t *testing.T) {
	h := NewHandler(10)
	_, err := h.GetMeta("res_doesnotexist")
	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrResultNotFound))
}

// --- Handler.Dispose tests ---

func TestHandler_Dispose_Valid(t *testing.T) {
	h := NewHandler(10)
	r := makeResult("qry_1", 5)
	id, _ := h.Store(r)

	h.Dispose(id)

	_, err := h.GetMeta(id)
	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrResultNotFound))
}

func TestHandler_Dispose_NotFound(t *testing.T) {
	h := NewHandler(10)
	// Should not panic.
	assert.NotPanics(t, func() {
		h.Dispose("res_doesnotexist")
	})
}

// --- Concurrency test ---

func TestHandler_Concurrency(t *testing.T) {
	h := NewHandler(5)
	const goroutines = 20

	var wg sync.WaitGroup
	wg.Add(goroutines)

	for i := 0; i < goroutines; i++ {
		go func() {
			defer wg.Done()
			r := makeResult("qry_concurrent", 50)
			id, err := h.Store(r)
			if err != nil {
				return
			}
			_, _ = h.GetPage(id, 0, 10)
			_, _ = h.GetMeta(id)
			h.Dispose(id)
		}()
	}

	wg.Wait()
}

// --- ResultError tests ---

func TestResultError_Error(t *testing.T) {
	t.Run("with ResultID", func(t *testing.T) {
		e := &ResultError{
			ResultID:  "res_abc",
			Operation: "page",
			Message:   "something went wrong",
		}
		assert.Equal(t, "[res_abc] page: something went wrong", e.Error())
	})

	t.Run("without ResultID", func(t *testing.T) {
		e := &ResultError{
			Operation: "page",
			Message:   "something went wrong",
		}
		assert.Equal(t, "page: something went wrong", e.Error())
	})
}

func TestResultError_Unwrap(t *testing.T) {
	sentinel := errors.New("underlying error")
	e := &ResultError{
		ResultID:    "res_abc",
		Operation:   "store",
		Message:     "wrapped",
		OriginalErr: sentinel,
	}
	assert.True(t, errors.Is(e, sentinel))
}

// --- NewHandler default capacity ---

func TestNewHandler_DefaultCapacity(t *testing.T) {
	h := NewHandler(0)
	// Fill DefaultMaxResults+1 entries; the first should be evicted.
	var firstID string
	for i := 0; i < DefaultMaxResults+1; i++ {
		r := makeResult("qry", 1)
		id, err := h.Store(r)
		require.NoError(t, err)
		if i == 0 {
			firstID = id
		}
	}
	_, err := h.GetMeta(firstID)
	assert.True(t, errors.Is(err, ErrResultNotFound))
}

func TestNewHandler_NegativeCapacity(t *testing.T) {
	h := NewHandler(-5)
	r := makeResult("qry", 1)
	id, err := h.Store(r)
	require.NoError(t, err)
	_, err = h.GetMeta(id)
	assert.NoError(t, err)
}

// --- lruCache direct tests ---

func TestLRUCache_UpdateExistingKey(t *testing.T) {
	c := newLRUCache(3)
	sr1 := &storedResult{id: "a"}
	sr2 := &storedResult{id: "b"}

	c.put("key1", sr1)
	evicted := c.put("key1", sr2) // update existing
	assert.Nil(t, evicted)
	assert.Equal(t, 1, c.len())

	got, ok := c.get("key1")
	assert.True(t, ok)
	assert.Equal(t, "b", got.id)
}

func TestLRUCache_Len(t *testing.T) {
	c := newLRUCache(5)
	assert.Equal(t, 0, c.len())
	c.put("a", &storedResult{id: "a"})
	assert.Equal(t, 1, c.len())
	c.put("b", &storedResult{id: "b"})
	assert.Equal(t, 2, c.len())
	c.delete("a")
	assert.Equal(t, 1, c.len())
}
