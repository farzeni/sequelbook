import { books, connections, runners } from "@lib/wailsjs/go/models"

export type BookMap = {
  [id: string]: books.Book
}

export type ConnectionMap = {
  [id: string]: connections.Connection
}

export type ResultMap = {
  [cellId: string]: runners.QueryResult
}

export type Tab = BookTab | DatabaseTab

export type TabType = Tab["type"]

export type TabMap = {
  [id: string]: Tab
}
export interface BookTab {
  id: string
  type: "book"
  bookId: string
  cellId: string | null
  connectionId: string | null
}

export interface DatabaseTab {
  id: string
  type: "connection"
  connectionId: string
  cellId?: null
  bookId?: null
}

export type EditorSelection = {
  rootPaneId: string
  tabId: string | null
  paneId: string
}

export type EditorState = {
  sidebar: SidebarSection | null
  tabs: TabMap
  panes: PaneMap
  current: EditorSelection
}

export type AppState = {
  books: BookMap
  connections: ConnectionMap
  results: ResultMap
  editor: EditorState
}

export type SidebarSection = "contents" | "books" | "connections"

export type Pane = ContentPane | SplitPane

export type PaneMap = {
  [paneId: string]: Pane
}

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
