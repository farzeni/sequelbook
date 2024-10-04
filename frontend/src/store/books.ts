import { appState } from "@hooks/store"
import * as booksStore from "@lib/wailsjs/go/books/BooksStore"
import { DuplicateBook } from "@lib/wailsjs/go/books/BooksStore"
import { books } from "@lib/wailsjs/go/models"
import * as pooler from "@lib/wailsjs/go/runners/Pooler"
import {
  CloseTab,
  findEntityTabInPane,
  SaveEditorState,
  SelectTab,
} from "./editor"
import { BookMap, BookTab, Tab } from "./types"

export function isBookTab(tab: Tab | null): tab is BookTab {
  return !!tab && tab.type === "book"
}
export function isBookID(tabId: string): boolean {
  return tabId.startsWith("bok")
}

export async function LoadBooks() {
  console.log("Loading books")
  const books = await booksStore.ListBooks()

  console.log("Books", books)

  let bookStore: BookMap = {}

  for (const book of books || []) {
    bookStore[book.id] = book
  }
  console.log("set state")
  appState.books = bookStore
}

export function SetSelectedCell(cellId: string) {
  const tab = appState.editor.tabs[appState.editor.current.tabId || ""]

  if (!tab || tab.type !== "book") {
    return
  }

  console.log("Setting selected cell", cellId)

  if (isBookTab(tab) && tab.cellId !== cellId) {
    console.log("Real Setting selected cell", cellId)
    tab.cellId = cellId
  }

  SaveEditorState()
}

export function MoveCurrentCell(offset: 1 | -1) {
  const tab = appState.editor.tabs[appState.editor.current.tabId || ""]

  if (!tab || tab.type !== "book") {
    return
  }

  const book = appState.books[tab.bookId]

  if (!book) {
    return
  }

  const currentCellId = tab.cellId

  const cellIdx = book.cells.findIndex((cell) => cell.id === currentCellId)

  if (cellIdx === -1) {
    return
  }

  const newCellIdx = cellIdx + offset

  if (newCellIdx < 0 || newCellIdx >= book.cells.length) {
    return
  }

  SetSelectedCell(book.cells[newCellIdx].id)
}

export function SelectNextCell() {
  MoveCurrentCell(1)
}

export function SelectPreviousCell() {
  MoveCurrentCell(-1)
}

export async function AddBook(data?: { title?: string; cells?: books.Cell[] }) {
  const newBook = await booksStore.CreateBook(
    new books.BookData({
      title: data?.title || "Untitled",
      cells: data?.cells || [],
    })
  )

  appState.books[newBook.id] = newBook

  SelectTab(newBook.id)

  return newBook
}

export async function CopyBook(bookId: string) {
  const book = appState.books[bookId]

  if (!book) {
    return
  }

  try {
    const newBook = await DuplicateBook(bookId)

    appState.books[newBook.id] = newBook

    return newBook
  } catch (e) {
    console.error("Failed to duplicate book", e)
    return null
  }
}

export async function UpdateBookTitle(bookId: string, title: string) {
  appState.books[bookId].title = title

  const book = appState.books[bookId]

  if (!book) {
    return
  }

  await booksStore.UpdateBook(bookId, book)
}

export async function RemoveBook(bookId: string) {
  for (const paneId in appState.editor.panes) {
    const pane = appState.editor.panes[paneId]
    const tab = findEntityTabInPane(pane, bookId)

    if (!tab || pane.type !== "leaf") {
      continue
    }

    CloseTab(tab.id)
  }

  await booksStore.DeleteBook(bookId)

  delete appState.books[bookId]

  SaveEditorState()
}

export function SetBookConnection(bookId: string, connectionId: string) {
  const connection = appState.connections[connectionId]
  console.log("SetBookConnection: connection", connectionId, connection)
  const pane = appState.editor.panes[appState.editor.current.paneId]
  if (!connection || pane.type !== "leaf") {
    return
  }

  const tab = findEntityTabInPane(pane, bookId)

  console.log("SetBookConnection: tab", bookId, tab)

  if (!tab) {
    return
  }

  appState.editor.tabs[tab.id].connectionId = connection.id
  console.log("SetBookConnection: select", tab.id, connectionId)

  SaveEditorState()
}

export async function AddCell(type: "code" | "text", position?: number) {
  const tab = appState.editor.tabs[appState.editor.current.tabId || ""]

  console.log("Add cell", tab, type, position)

  if (!tab || tab.type !== "book") {
    return
  }

  const newCell: books.Cell = await booksStore.CreateCell(tab.bookId, type)
  console.log("create cell", newCell)

  if (!appState.books[tab.bookId].cells) {
    appState.books[tab.bookId].cells = []
  }

  if (position !== undefined && position >= 0) {
    appState.books[tab.bookId].cells.splice(position, 0, newCell)
  } else {
    if (tab.cellId) {
      const cellIdx = appState.books[tab.bookId].cells.findIndex(
        (cell) => cell.id === tab.cellId
      )
      appState.books[tab.bookId].cells.splice(cellIdx + 1, 0, newCell)
    } else {
      appState.books[tab.bookId].cells.push(newCell)
    }
  }

  const book = appState.books[tab.bookId]

  if (!book) {
    return
  }

  SetSelectedCell(newCell.id)

  await booksStore.UpdateBook(tab.bookId, book)
}

export async function UpdateCell(
  bookId: string,
  cellId: string,
  source: string
) {
  const book = appState.books[bookId]

  if (!book) {
    return
  }

  const cellIdx = book.cells.findIndex((cell) => cell.id === cellId)

  if (cellIdx === -1) {
    return
  }

  book.cells[cellIdx].content = source

  await booksStore.UpdateBook(bookId, book)
}

export async function RemoveCell(bookId: string, cellId: string) {
  const book = appState.books[bookId]

  if (!book) {
    return
  }

  book.cells = book.cells.filter((cell) => cell.id !== cellId)

  await booksStore.UpdateBook(bookId, book)
}

export async function SwapCells(position1: number, position2: number) {
  const currentTabId = appState.editor.current.tabId

  if (!currentTabId) {
    return
  }

  const book = appState.books[currentTabId]

  if (!book) {
    return
  }

  const temp = book.cells[position1]
  book.cells[position1] = book.cells[position2]
  book.cells[position2] = temp

  await booksStore.UpdateBook(currentTabId, book)
}

export async function MoveCellUp(bookId: string, cellId: string) {
  const book = appState.books[bookId]

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
  const book = appState.books[bookId]

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
  const tab = appState.editor.tabs[appState.editor.current.tabId || ""]

  if (!tab || tab.type !== "book") {
    console.log("No tab selected")
    return
  }

  const book = appState.books[tab.bookId]

  if (!book) {
    console.log("No book found")
    return
  }

  const cell = appState.books[tab.bookId].cells.find(
    (cell) => cell.id === cellID
  )

  if (!cell) {
    console.log("No cell found")
    return
  }

  const connectionId = tab.connectionId

  if (!connectionId) {
    console.log("No connection selected")
    return
  }

  const connection = appState.connections[connectionId]

  if (!connection) {
    console.log("No connection found")
    return
  }

  console.log("Executing cell", cell.id)
  const result = await pooler.Run(connection, book, cell)

  appState.results[cell.id] = result

  console.log(result)

  SaveEditorState()

  return result
}
