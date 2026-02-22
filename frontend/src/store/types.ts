// ─── Re-exports from auto-generated bindings ─────────────────────────────────
// Source of truth is the Go backend. Edit .go files, not the generated bindings.

// Locally imported so they can be referenced in the type definitions below.
import type { Column } from "@/bindings/github.com/sequelbook/sequelbook/core/executor/models"
import type { OpenBook } from "@/bindings/github.com/sequelbook/sequelbook/core/book/models"
import type { ConnectionEntry } from "@/bindings/github.com/sequelbook/sequelbook/core/settings/models"

export type { Block, BlockType, Section, Chapter, Book, OpenBook } from "@/bindings/github.com/sequelbook/sequelbook/core/book/models"
export type { ConnectionConfig } from "@/bindings/github.com/sequelbook/sequelbook/core/connection/models"
export type { Config as AppConfig, ConnectionEntry } from "@/bindings/github.com/sequelbook/sequelbook/core/settings/models"
export type { ConnectionStatus, QueryResponse } from "@/bindings/github.com/sequelbook/sequelbook/bindings/models"
export type { Column, DisplayType } from "@/bindings/github.com/sequelbook/sequelbook/core/executor/models"
export type { Page as ResultPage, ResultMeta } from "@/bindings/github.com/sequelbook/sequelbook/core/result/models"

// ─── Connection state ─────────────────────────────────────────────────────────
// ConnectionStatus.state is `string` in the generated binding; this union adds type-safety.
export type ConnectionState = "disconnected" | "connecting" | "connected" | "error"

// ─── Query result types ───────────────────────────────────────────────────────
// Frontend-convenient flat shapes stored in the results atom.
// These differ from the backend's ResultMeta / Page, which keep metadata and rows separate.

export interface QueryMeta {
  startTime: string   // ISO 8601
  endTime: string     // ISO 8601
  duration: number    // nanoseconds
  rowCount: number
  commandTag: string
}

export interface QueryResult {
  queryId: string
  resultId: string
  columns: Column[]
  rows: unknown[][]
  meta: QueryMeta
  hasMore: boolean
  /** Current page start (0-based). */
  offset: number
  /** Total rows in backend result set. */
  total: number
  /** Rows per page for this result. */
  pageSize: number
}

// ─── Cell execution state ────────────────────────────────────────────────────

export interface CellState {
  status: "idle" | "running" | "success" | "error"
  resultId: string | null
  error: string | null
}

export type CellStateMap = Record<string, CellState>

// ─── Map types ───────────────────────────────────────────────────────────────

export type BookMap = Record<string, OpenBook>

export type ConnectionMap = Record<string, ConnectionEntry>

export type ResultMap = Record<string, QueryResult>

// ─── Editor state types ───────────────────────────────────────────────────────
// Pure frontend state — not persisted to the Go backend model, only to editor state storage.

export type SidebarSection = "books" | "connections" | "contents"

export type TabType = "book" | "connection"

export interface BookTab {
  id: string
  type: "book"
  bookId: string
  /** Currently selected block ID within the book */
  blockId: string | null
  /** Connection ID associated with this tab */
  connectionId: string | null
  /** Absolute file path — stable across restarts, used to reconcile stale bookIds */
  filePath?: string
}

export interface DatabaseTab {
  id: string
  type: "connection"
  connectionId: string
  /** Currently selected table name */
  table: string | null
}

export type Tab = BookTab | DatabaseTab

export type TabMap = Record<string, Tab>

export interface ContentPane {
  type: "leaf"
  id: string
  tabsOrder: string[]
  tabId: string | null
}

export interface SplitPane {
  type: "split"
  id: string
  direction: "horizontal" | "vertical"
  children: [string, string]
}

export type Pane = ContentPane | SplitPane

export type PaneMap = Record<string, Pane>

export interface EditorSelection {
  rootPaneId: string
  tabId: string | null
  paneId: string
}

export interface EditorState {
  sidebar: SidebarSection | null
  tabs: TabMap
  panes: PaneMap
  current: EditorSelection
}
