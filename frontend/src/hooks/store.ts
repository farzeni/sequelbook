import * as booksStore from "@lib/wailsjs/go/books/BooksStore"
import * as connectionsStore from "@lib/wailsjs/go/connections/ConnectionStore"
import * as core from "@lib/wailsjs/go/core/Backend"
import { books, connections, runners } from "@lib/wailsjs/go/models"
import * as pooler from "@lib/wailsjs/go/runners/Pooler"
import { produce } from "immer"
import { create } from "zustand"

export type BookMap = {
  [id: string]: books.Book
}

export type ConnectionMap = {
  [id: string]: connections.Connection
}

export type ResultMap = {
  [cellId: string]: runners.QueryResult
}

export type TabType = "book" | "connection"
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

export type SidebarSection = "books" | "connections"
export interface EditorState {
  sidebar: SidebarSection | null
  currentTabId: string | null
  tabs: {
    [tabId: string]: BookTab | DatabaseTab
  }
  tabsOrder: string[]
}

export function isBookTab(tab: BookTab | DatabaseTab): tab is BookTab {
  return tab.type === "book"
}
export function isBookID(tabId: string): boolean {
  return tabId.startsWith("bok")
}

export function isDatabaseTab(tab: BookTab | DatabaseTab): tab is DatabaseTab {
  return tab.type === "connection"
}

export function isDatabaseID(tabId: string): boolean {
  return tabId.startsWith("con")
}

export const useStore = create<AppState>()(() => ({
  books: {},
  connections: {},
  results: {},
  editor: {
    sidebar: "books",
    currentTabId: null,
    tabs: {},
    tabsOrder: [],
  },
}))

export async function InitStore() {
  await LoadBooks()
  await LoadConnections()
  await LoadEditorState()
}

export async function LoadEditorState() {
  const state = await core.LoadEditorState()

  try {
    const editorState = JSON.parse(state)
    useStore.setState(
      produce((state: AppState) => {
        state.editor = {
          ...state.editor,
          ...editorState,
        }
      })
    )
  } catch (error) {
    console.error("Error loading editor state", error)
  }
}

export async function SaveEditorState() {
  const state = useStore.getState().editor

  try {
    await core.SaveEditorState(JSON.stringify(state))
  } catch (error) {
    console.error("Error saving editor state", error)
  }
}

export function SetSidebar(section: SidebarSection | null) {
  useStore.setState(
    produce((state: AppState) => {
      state.editor.sidebar =
        state.editor.sidebar === section && !!section ? null : section
    })
  )
}

export async function LoadConnections() {
  const connections = await connectionsStore.ListConnections()
  let connectionStore: ConnectionMap = {}

  for (const connection of connections || []) {
    connectionStore[connection.id] = connection
  }

  useStore.setState(
    produce((state: AppState) => {
      state.connections = connectionStore
    })
  )
}

export async function AddConnection(data: connections.ConnectionData) {
  const newConnection = await connectionsStore.CreateConnection(data)

  useStore.setState(
    produce((state: AppState) => {
      state.connections[newConnection.id] = newConnection
    })
  )
}

export async function UpdateConnection(
  connectionId: string,
  data: connections.ConnectionData
) {
  const c = await connectionsStore.UpdateConnection(connectionId, data)

  useStore.setState(
    produce((state: AppState) => {
      state.connections[connectionId] = c
    })
  )
}

export async function RemoveConnection(connectionId: string) {
  useStore.setState(
    produce((state: AppState) => {
      delete state.connections[connectionId]

      for (const tab of Object.keys(state.editor.tabs)) {
        if (state.editor.tabs[tab].connectionId === connectionId) {
          state.editor.tabs[tab].connectionId = null
        }
      }
    })
  )

  await connectionsStore.DeleteConnection(connectionId)

  SaveEditorState()
}

export function BookSelectConnection(bookId: string, connectionId: string) {
  const connection = useStore.getState().connections[connectionId]

  if (!connection) {
    return
  }

  const tab = useStore.getState().editor.tabs[bookId]

  if (!tab) {
    return
  }

  useStore.setState(
    produce((state: AppState) => {
      state.editor.tabs[bookId].connectionId = connection.id
    })
  )

  SaveEditorState()
}

export async function LoadBooks() {
  const books = await booksStore.ListBooks()

  let bookStore: BookMap = {}

  for (const book of books || []) {
    bookStore[book.id] = book
  }

  useStore.setState(
    produce((state: AppState) => {
      state.books = bookStore
    })
  )
}

export function SelectTab(tabId: string) {
  if (isBookID(tabId)) {
    const book = useStore.getState().books[tabId]

    if (!book) {
      return
    }

    useStore.setState(
      produce((state: AppState) => {
        state.editor.currentTabId = book.id

        if (!state.editor.tabs[book.id]) {
          state.editor.tabs[book.id] = {
            type: "book",
            bookId: book.id,
            cellId: null,
            connectionId: null,
          }
        }
      })
    )
  }

  if (isDatabaseID(tabId)) {
    const connection = useStore.getState().connections[tabId]

    if (!connection) {
      return
    }

    useStore.setState(
      produce((state: AppState) => {
        state.editor.currentTabId = connection.id

        if (!state.editor.tabs[connection.id]) {
          state.editor.tabs[connection.id] = {
            type: "connection",
            connectionId: connection.id,
            cellId: null,
            bookId: null,
          }
        }
      })
    )
  }

  AddTab(tabId)
}

export function AddTab(tabId: string) {
  const tab = useStore.getState().editor.tabs[tabId]
  const tabsOrder = useStore.getState().editor.tabsOrder
  const book = useStore.getState().books[tabId]

  if (tab && !tabsOrder.includes(tabId)) {
    useStore.setState(
      produce((state: AppState) => {
        state.editor.tabsOrder.push(tabId)
      })
    )
  }

  if (tab) {
    return
  }

  if (tabId.startsWith("bok")) {
    if (!book) {
      return
    }

    if (!tab) {
      const newTab = {
        bookId: tabId,
        content: book,
        cellId: null,
        connectionId: null,
        results: {},
      }

      useStore.setState(
        produce((state: AppState) => {
          state.editor.tabs[tabId] = {
            type: "book",
            ...newTab,
          }
          state.editor.tabsOrder.push(tabId)
        })
      )
      return
    }
  }

  if (tabId.startsWith("con")) {
    const connection = useStore.getState().connections[tabId]

    if (!connection) {
      return
    }

    if (!tab) {
      const newTab = {
        connectionId: tabId,
        content: connection,
        cellId: null,
        bookId: null,
        results: {},
      }

      useStore.setState(
        produce((state: AppState) => {
          state.editor.tabs[tabId] = {
            type: "connection",
            ...newTab,
          }
          state.editor.tabsOrder.push(tabId)
        })
      )
      return
    }
  }

  SaveEditorState()
}

export function RemoveTab(bookId: string) {
  const editor = useStore.getState().editor
  const tabIdx = editor.tabsOrder.findIndex((id) => id === bookId)

  useStore.setState(
    produce((state: AppState) => {
      delete state.editor.tabs[bookId]
      state.editor.tabsOrder = state.editor.tabsOrder.filter(
        (id: string) => id !== bookId
      )
    })
  )

  if (useStore.getState().editor.currentTabId === bookId) {
    if (editor.tabsOrder.length === 1) {
      useStore.setState(
        produce((state: AppState) => {
          state.editor.currentTabId = null
        })
      )
    } else {
      const newTabIdx = tabIdx === 0 ? 1 : tabIdx - 1
      SelectTab(editor.tabsOrder[newTabIdx])
    }
  }

  SaveEditorState()
}

export function SetSelectedCell(cellId: string) {
  const currentTabId = useStore.getState().editor.currentTabId
  const tabs = useStore.getState().editor.tabs

  if (!currentTabId) {
    return
  }

  useStore.setState(
    produce((state: AppState) => {
      if (isBookTab(state.editor.tabs[currentTabId])) {
        state.editor.tabs[currentTabId].cellId = cellId
      }
    })
  )

  SaveEditorState()
}

export function SelectNextCell() {
  const currentTabId = useStore.getState().editor.currentTabId

  if (!currentTabId) {
    return
  }

  const tab = useStore.getState().editor.tabs[currentTabId]

  if (!tab || tab.type !== "book") {
    return
  }

  const currentCellId = tab.cellId
  const book = useStore.getState().books[currentTabId]

  if (!book) {
    return
  }

  const cellIdx = book.cells.findIndex((cell) => cell.id === currentCellId)

  if (cellIdx === -1) {
    return
  }

  const nextCellIdx = cellIdx + 1

  if (nextCellIdx >= book.cells.length) {
    return
  }

  SetSelectedCell(book.cells[nextCellIdx].id)
}

export function SelectPreviousCell() {
  const currentTabId = useStore.getState().editor.currentTabId

  if (!currentTabId) {
    return
  }

  const book = useStore.getState().books[currentTabId]

  if (!book) {
    return
  }

  const tab = useStore.getState().editor.tabs[currentTabId]

  if (!tab || tab.type !== "book") {
    return
  }

  const currentCellId = tab.cellId

  const cellIdx = book.cells.findIndex((cell) => cell.id === currentCellId)

  if (cellIdx === -1) {
    return
  }

  const previousCellIdx = cellIdx - 1

  if (previousCellIdx < 0) {
    return
  }

  SetSelectedCell(book.cells[previousCellIdx].id)
}

export async function AddBook(data?: { title?: string; cells?: books.Cell[] }) {
  const newBook = await booksStore.CreateBook(
    new books.BookData({
      title: data?.title || "Untitled",
      cells: data?.cells || [],
    })
  )

  useStore.setState(
    produce((state: AppState) => {
      state.books[newBook.id] = newBook
    })
  )

  SelectTab(newBook.id)

  return newBook
}

export async function UpdateBookTitle(bookId: string, title: string) {
  useStore.setState(
    produce((state: AppState) => {
      state.books[bookId].title = title
    })
  )

  const book = useStore.getState().books[bookId]

  if (!book) {
    return
  }

  await booksStore.UpdateBook(bookId, book)
}

export async function RemoveBook(bookId: string) {
  useStore.setState(
    produce((state: AppState) => {
      delete state.books[bookId]
      delete state.editor.tabs[bookId]
      state.editor.tabsOrder = state.editor.tabsOrder.filter(
        (id: string) => id !== bookId
      )

      if (state.editor.currentTabId === bookId) {
        state.editor.currentTabId = Object.keys(state.books)[0] || null
      }
    })
  )

  await booksStore.DeleteBook(bookId)

  SaveEditorState()
}

export async function AddCell(type: "code" | "text", position?: number) {
  const currentTabId = useStore.getState().editor.currentTabId

  if (!currentTabId) {
    return
  }

  const newCell: books.Cell = await booksStore.CreateCell(currentTabId, type)

  useStore.setState(
    produce((state: AppState) => {
      if (!state.books[currentTabId].cells) {
        state.books[currentTabId].cells = []
      }

      if (position !== undefined && position >= 0) {
        state.books[currentTabId].cells.splice(position, 0, newCell)
      } else {
        const tab = state.editor.tabs[currentTabId]
        if (isBookTab(tab) && tab.cellId) {
          const cellIdx = state.books[currentTabId].cells.findIndex(
            (cell) => cell.id === tab.cellId
          )
          state.books[currentTabId].cells.splice(cellIdx + 1, 0, newCell)
        } else {
          state.books[currentTabId].cells.push(newCell)
        }
      }
    })
  )

  const book = useStore.getState().books[currentTabId]

  if (!book) {
    return
  }

  SetSelectedCell(newCell.id)

  await booksStore.UpdateBook(currentTabId, book)
}

export async function UpdateCell(
  bookId: string,
  cellId: string,
  source: string
) {
  useStore.setState(
    produce((state: AppState) => {
      const book = state.books[bookId]

      book.cells.map((cell) => {
        if (cell.id === cellId) {
          console.log(cell)
          cell.content = source
        }
      })
    })
  )

  const book = useStore.getState().books[bookId]

  if (!book) {
    return
  }

  await booksStore.UpdateBook(bookId, book)
}

export async function RemoveCell(bookId: string, cellId: string) {
  useStore.setState(
    produce((state: AppState) => {
      const book = state.books[bookId]

      book.cells = book.cells.filter((cell) => cell.id !== cellId)
    })
  )

  const book = useStore.getState().books[bookId]

  if (!book) {
    return
  }

  await booksStore.UpdateBook(bookId, book)
}

export async function SwapCells(position1: number, position2: number) {
  const currentTabId = useStore.getState().editor.currentTabId

  if (!currentTabId) {
    return
  }

  useStore.setState(
    produce((state: AppState) => {
      const book = state.books[currentTabId]

      const temp = book.cells[position1]
      book.cells[position1] = book.cells[position2]
      book.cells[position2] = temp
    })
  )

  const book = useStore.getState().books[currentTabId]

  if (!book) {
    return
  }

  await booksStore.UpdateBook(currentTabId, book)
}

export async function MoveCellUp(bookId: string, cellId: string) {
  const book = useStore.getState().books[bookId]

  if (!book) {
    return
  }

  const cellIdx = book.cells.findIndex((cell) => cell.id === cellId)

  if (cellIdx === 0) {
    return
  }

  await SwapCells(cellIdx, cellIdx - 1)
}

export async function MoveCellDown(bookId: string, cellId: string) {
  const book = useStore.getState().books[bookId]

  if (!book) {
    return
  }

  const cellIdx = book.cells.findIndex((cell) => cell.id === cellId)

  if (cellIdx === book.cells.length - 1) {
    return
  }

  await SwapCells(cellIdx, cellIdx + 1)
}

export async function Execute(cellID: string) {
  const bookId = useStore.getState().editor.currentTabId

  if (!bookId) {
    console.log("No book selected")
    return
  }

  const book = useStore.getState().books[bookId]

  if (!book) {
    console.log("No book found")
    return
  }

  const cell = useStore
    .getState()
    .books[bookId].cells.find((cell) => cell.id === cellID)

  if (!cell) {
    console.log("No cell found")
    return
  }

  const connectionId = useStore.getState().editor.tabs[bookId].connectionId

  if (!connectionId) {
    console.log("No connection selected")
    return
  }

  const connection = useStore.getState().connections[connectionId]

  if (!connection) {
    console.log("No connection found")
    return
  }

  console.log("Executing cell", cell.id)
  const result = await pooler.Run(connection, book, cell)

  useStore.setState(
    produce((state: AppState) => {
      state.results[cell.id] = result
    })
  )

  console.log(result)

  SaveEditorState()

  return result
}
