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

export interface BookTab {
  type: "book"
  bookId: string
  cellId: string | null
  connectionId: string | null
}

export interface DatabaseTab {
  type: "connection"
  connectionId: string
  cellId?: null
  bookId?: null
}

export interface AppState {
  books: BookMap
  connections: ConnectionMap
  results: ResultMap
  editor: EditorState
}

export type SidebarSection = "contents" | "books" | "connections"

export type Pane = ContentPane | SplitPane

export interface ContentPane {
  type: "leaf"
  id: string
  tabs: {
    [tabId: string]: BookTab | DatabaseTab
  }
  tabsOrder: string[]
  tabId: string | null
}

export interface SplitPane {
  id: string
  type: "split"
  direction: "horizontal" | "vertical"
  children: [Pane, Pane]
}

export interface EditorState {
  sidebar: SidebarSection | null

  pane: Pane

  currentTabId: string | null
  currentPaneId?: string | null

  tabs: {
    [tabId: string]: Tab
  }
  tabsOrder: string[]
}
