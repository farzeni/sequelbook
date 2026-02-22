package bindings

import (
	"context"
	"errors"

	"github.com/sequelbook/sequelbook/core/executor"
	"github.com/sequelbook/sequelbook/core/result"
	"github.com/sequelbook/sequelbook/events"
)

// QueryResponse is the value returned by ExecuteQuery.
// It bundles the result ID with the first page of rows and result metadata
// so the frontend can display results immediately without a follow-up call.
type QueryResponse struct {
	ResultID string             `json:"resultId"`
	Page     *result.Page       `json:"page"`
	Meta     *result.ResultMeta `json:"meta"`
}

// QueryService exposes query execution to the Wails frontend.
type QueryService struct {
	executor executor.Executor
	handler  *result.Handler
	emitter  events.Emitter
}

// NewQueryService creates a QueryService with injected dependencies.
func NewQueryService(exec executor.Executor, handler *result.Handler, emitter events.Emitter) *QueryService {
	return &QueryService{
		executor: exec,
		handler:  handler,
		emitter:  emitter,
	}
}

// ExecuteQuery runs a SQL query against the given connection.
//
// Event sequence:
//  1. QueryStarted — emitted before execution (queryID is unknown at this point,
//     so an empty string is used; the frontend uses it as a loading signal only).
//  2. QueryCompleted — emitted on success with the real queryID and stats.
//  3. QueryFailed / QueryCancelled — emitted on failure.
//
// On success the result is stored in the handler and the first page + metadata
// are returned in QueryResponse so the frontend needs no follow-up call.
func (s *QueryService) ExecuteQuery(connID, sql string) (*QueryResponse, error) {
	// Signal that a query is starting. The executor will assign the real queryID.
	events.EmitQueryStarted(s.emitter, "", sql)

	res, err := s.executor.Execute(context.Background(), connID, sql)
	if err != nil {
		var execErr *executor.ExecutionError
		if errors.As(err, &execErr) {
			if execErr.Message == "query cancelled by user" {
				events.EmitQueryCancelled(s.emitter, execErr.QueryID)
			} else {
				events.EmitQueryFailed(s.emitter, execErr.QueryID, execErr.Error(), execErr.Position)
			}
		} else {
			events.EmitQueryFailed(s.emitter, "", err.Error(), 0)
		}
		return nil, err
	}

	resultID, storeErr := s.handler.Store(res)
	if storeErr != nil {
		events.EmitQueryFailed(s.emitter, res.QueryID, storeErr.Error(), 0)
		return nil, storeErr
	}

	page, pageErr := s.handler.GetPage(resultID, 0, 0)
	if pageErr != nil {
		return nil, pageErr
	}
	meta, metaErr := s.handler.GetMeta(resultID)
	if metaErr != nil {
		return nil, metaErr
	}

	events.EmitQueryCompleted(s.emitter, res.QueryID, res.Meta.RowCount, res.Meta.Duration)

	return &QueryResponse{
		ResultID: resultID,
		Page:     page,
		Meta:     meta,
	}, nil
}

// CancelQuery attempts to cancel a running query by its query ID.
func (s *QueryService) CancelQuery(queryID string) error {
	err := s.executor.Cancel(queryID)
	if err == nil {
		events.EmitQueryCancelled(s.emitter, queryID)
	}
	return err
}

// GetResultPage returns a paginated window of rows for an existing result set.
func (s *QueryService) GetResultPage(resultID string, offset int64, limit int) (*result.Page, error) {
	return s.handler.GetPage(resultID, offset, limit)
}

// GetResultMeta returns column metadata and statistics for a stored result set.
func (s *QueryService) GetResultMeta(resultID string) (*result.ResultMeta, error) {
	return s.handler.GetMeta(resultID)
}

// DisposeResult frees memory for a stored result set.
func (s *QueryService) DisposeResult(resultID string) {
	s.handler.Dispose(resultID)
}
