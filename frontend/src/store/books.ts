import { useStore } from "@hooks/store"
import * as booksStore from "@lib/wailsjs/go/books/BooksStore"
import { books } from "@lib/wailsjs/go/models"
import * as pooler from "@lib/wailsjs/go/runners/Pooler"
import { produce } from "immer"
import { SaveEditorState, SelectTab } from "./editor"
import { AppState, BookMap, BookTab, Tab } from "./types"

export function isBookTab(tab: Tab): tab is BookTab {
  return tab.type === "book"
}
export function isBookID(tabId: string): boolean {
  return tabId.startsWith("bok")
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
