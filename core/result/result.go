package result

import (
	"time"

	"github.com/rs/xid"
	"github.com/sequelbook/sequelbook/core/executor"
)

const (
	// DefaultMaxResults is the default LRU cache capacity.
	DefaultMaxResults = 50
	// PageSize is the default page size when limit is not specified.
	PageSize = 50
)

// Page is a paginated window of JSON-safe result rows.
type Page struct {
	ResultID string  `json:"resultId"`
	Rows     [][]any `json:"rows"`    // serialized; nil preserved as JSON null
	Offset   int64   `json:"offset"`
	Limit    int     `json:"limit"`
	Total    int64   `json:"total"`
	HasMore  bool    `json:"hasMore"`
}

// ResultMeta describes a stored result set (no row data).
type ResultMeta struct {
	ResultID   string            `json:"resultId"`
	QueryID    string            `json:"queryId"`
	Columns    []executor.Column `json:"columns"`
	RowCount   int64             `json:"rowCount"`
	StartTime  time.Time         `json:"startTime"`
	EndTime    time.Time         `json:"endTime"`
	Duration   time.Duration     `json:"duration"`
	CommandTag string            `json:"commandTag"`
}

// NewResultID generates a unique result identifier.
// Format: res_<xid> (e.g. res_cn8s7hsc18o0jt80qjbg)
func NewResultID() string {
	return "res_" + xid.New().String()
}
