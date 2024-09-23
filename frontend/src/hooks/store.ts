import * as booksStore from "@lib/wailsjs/go/books/BooksStore"
import * as connectionsStore from "@lib/wailsjs/go/connections/ConnectionStore"
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

export interface BookTab {
  bookId: string
  cellId: string | null
  connectionId: string | null
  results: {
    [cellId: string]: runners.QueryResult
  }
}

export interface AppState {
  books: BookMap
  connections: ConnectionMap
  editor: EditorState
}

export interface EditorState {
  currentBookId: string | null
  tabs: {
    [bookId: string]: BookTab
  }
  tabsOrder: string[]
}

export const useStore = create<AppState>()(() => ({
  books: {},
  connections: {},
  editor: {
    currentBookId: null,
    tabs: {},
    tabsOrder: [],
  },
}))

export async function InitStore() {
  await LoadBooks()
  await LoadConnections()
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
}

export function SetSelectedConnection(bookId: string, connectionId: string) {
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

export function SetSelectedBook(bookId: string) {
  const book = useStore.getState().books[bookId]

  if (!book) {
    return
  }

  useStore.setState(
    produce((state: AppState) => {
      state.editor.currentBookId = book.id

      state.editor.tabs[book.id] = {
        bookId: book.id,
        cellId: null,
        connectionId: null,
        results: {},
      }
    })
  )

  AddTab(bookId)
}

export function AddTab(bookId: string) {
  const tab = useStore.getState().editor.tabs[bookId]
  const tabsOrder = useStore.getState().editor.tabsOrder
  const book = useStore.getState().books[bookId]

  if (!book) {
    return
  }

  if (tab) {
    if (tabsOrder.indexOf(bookId) === -1) {
      console.log("Adding tab", bookId)
      useStore.setState(
        produce((state: AppState) => {
          state.editor.tabsOrder.push(bookId)
        })
      )
    }
  } else {
    const newTab = {
      bookId,
      content: book,
      cellId: null,
      connectionId: null,
      results: {},
    }

    useStore.setState(
      produce((state: AppState) => {
        state.editor.tabs[bookId] = newTab
        state.editor.tabsOrder.push(bookId)
      })
    )
  }
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

  if (useStore.getState().editor.currentBookId === bookId) {
    if (editor.tabsOrder.length === 1) {
      useStore.setState(
        produce((state: AppState) => {
          state.editor.currentBookId = null
        })
      )
    } else {
      const newTabIdx = tabIdx === 0 ? 1 : tabIdx - 1
      SetSelectedBook(editor.tabsOrder[newTabIdx])
    }
  }
}

export function SetSelectedCell(cellId: string) {
  const currentBookId = useStore.getState().editor.currentBookId
  const tabs = useStore.getState().editor.tabs

  if (!currentBookId) {
    return
  }

  useStore.setState(
    produce((state: AppState) => {
      state.editor.tabs[currentBookId].cellId = cellId
    })
  )
}

export async function AddBook() {
  const newBook = await booksStore.CreateBook(
    new books.BookData({
      title: "Untitled",
      cells: [],
    })
  )

  useStore.setState(
    produce((state: AppState) => {
      state.books[newBook.id] = newBook
    })
  )

  SetSelectedBook(newBook.id)
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

export async function AddCell(type: "code" | "text", position?: number) {
  const currentBookId = useStore.getState().editor.currentBookId

  if (!currentBookId) {
    return
  }

  const newCell: books.Cell = await booksStore.CreateCell(currentBookId, type)

  useStore.setState(
    produce((state: AppState) => {
      if (!state.books[currentBookId].cells) {
        state.books[currentBookId].cells = []
      }

      if (position !== undefined && position >= 0) {
        state.books[currentBookId].cells.splice(position, 0, newCell)
      } else {
        const tab = state.editor.tabs[currentBookId]
        if (tab.cellId) {
          const cellIdx = state.books[currentBookId].cells.findIndex(
            (cell) => cell.id === tab.cellId
          )
          state.books[currentBookId].cells.splice(cellIdx + 1, 0, newCell)
        } else {
          state.books[currentBookId].cells.push(newCell)
        }
      }
    })
  )

  const book = useStore.getState().books[currentBookId]

  if (!book) {
    return
  }

  await booksStore.UpdateBook(currentBookId, book)
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
  const currentBookId = useStore.getState().editor.currentBookId

  if (!currentBookId) {
    return
  }

  useStore.setState(
    produce((state: AppState) => {
      const book = state.books[currentBookId]

      const temp = book.cells[position1]
      book.cells[position1] = book.cells[position2]
      book.cells[position2] = temp
    })
  )

  const book = useStore.getState().books[currentBookId]

  if (!book) {
    return
  }

  await booksStore.UpdateBook(currentBookId, book)
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
  const bookId = useStore.getState().editor.currentBookId

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
      state.editor.tabs[bookId].results[cell.id] = result
    })
  )

  console.log(result)

  return result
}
