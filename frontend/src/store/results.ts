import { atom } from "jotai"
import { cellStatesAtom, resultsAtom } from "./atoms"
import type { CellState, QueryResponse, QueryResult, ResultPage } from "./types"
import * as QueryService from "@/bindings/github.com/sequelbook/sequelbook/bindings/queryservice"

// ─── Converter ───────────────────────────────────────────────────────────────

/** Convert a backend QueryResponse into the frontend-friendly QueryResult shape. */
export function convertQueryResponse(response: QueryResponse, pageSize?: number): QueryResult {
  const meta = response.meta!
  const page = response.page!
  const limit = page.limit > 0 ? page.limit : (pageSize ?? 50)
  return {
    queryId: meta.queryId,
    resultId: response.resultId,
    columns: meta.columns,
    rows: page.rows ?? [],
    meta: {
      startTime: String(meta.startTime),
      endTime: String(meta.endTime),
      duration: Number(meta.duration),
      rowCount: Number(meta.rowCount),
      commandTag: meta.commandTag,
    },
    hasMore: page.hasMore,
    offset: Number(page.offset),
    total: Number(page.total),
    pageSize: limit,
  }
}

// ─── Derived read atoms ───────────────────────────────────────────────────────

/**
 * Returns the full results map.
 * Usage: const results = useAtomValue(resultByIdAtom); results[blockId]
 */
export const resultByIdAtom = atom((get) => get(resultsAtom))

// ─── Write atoms ─────────────────────────────────────────────────────────────

/** Store a result set keyed by blockId. */
export const storeResultAtom = atom(
  null,
  (_get, set, { blockId, result }: { blockId: string; result: QueryResult }) => {
    set(resultsAtom, (prev) => ({ ...prev, [blockId]: result }))
  }
)

/** Free memory for a result set (also calls backend dispose). */
export const disposeResultAtom = atom(
  null,
  async (_get, set, { blockId, resultId }: { blockId: string; resultId: string }) => {
    set(resultsAtom, (prev) => {
      const next = { ...prev }
      delete next[blockId]
      return next
    })
    try {
      await QueryService.DisposeResult(resultId)
    } catch (err) {
      console.warn("disposeResultAtom: backend dispose failed", err)
    }
  }
)

/** Fetch a paginated page of rows for an existing result set. */
export const fetchPageAtom = atom(
  null,
  async (
    _get,
    _set,
    args: { resultId: string; offset: number; limit: number }
  ): Promise<ResultPage | null> => {
    return await QueryService.GetResultPage(args.resultId, args.offset, args.limit)
  }
)

/** Navigate to a page and update the stored result. */
export const navigatePageAtom = atom(
  null,
  async (
    get,
    set,
    args: { blockId: string; resultId: string; offset: number; pageSize: number }
  ) => {
    const page = await QueryService.GetResultPage(
      args.resultId,
      args.offset,
      args.pageSize
    )
    if (!page) return

    const prev = get(resultsAtom)[args.blockId]
    if (!prev || prev.resultId !== args.resultId) return

    set(resultsAtom, (current) => {
      const result = current[args.blockId]
      if (!result || result.resultId !== args.resultId) return current
      return {
        ...current,
        [args.blockId]: {
          ...result,
          rows: page.rows ?? [],
          offset: Number(page.offset),
          total: Number(page.total),
          pageSize: args.pageSize,
          hasMore: page.hasMore,
        },
      }
    })
  }
)

/** Update a single cell's execution state. */
export const setCellStateAtom = atom(
  null,
  (_get, set, { blockId, state }: { blockId: string; state: CellState }) => {
    set(cellStatesAtom, (prev) => ({ ...prev, [blockId]: state }))
  }
)

/** Clear all stored results (e.g., on disconnect). */
export const clearResultsAtom = atom(null, (_get, set) => {
  set(resultsAtom, {})
})
