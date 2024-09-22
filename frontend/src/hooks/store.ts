import {
  CreateBook,
  CreateCell,
  UpdateBook,
} from "@lib/wailsjs/go/books/BooksStore"
import { books, connections } from "@lib/wailsjs/go/models"
import { produce } from "immer"
import { create } from "zustand"

type BookMap = {
  [id: string]: books.Book
}

type ConnectionMap = {
  [id: string]: connections.Connection
}

interface BookTab {
  bookId: string
  cellId: string | null
  connectionId: string | null
}

interface AppState {
  books: BookMap
  connections: ConnectionMap
  editor: EditorState
}

interface EditorState {
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

export function setBooks(books: books.Book[]) {
  let bookStore: BookMap = {}

  for (const book of books) {
    bookStore[book.id] = book
  }

  useStore.setState({ books: bookStore })
}

export function setSelectedBook(bookId: string) {
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
      }
    })
  )

  addTab(bookId)
}

export function addTab(bookId: string) {
  const tab = useStore.getState().editor.tabs[bookId]

  if (tab) {
    return
  }

  const book = useStore.getState().books[bookId]

  if (!book) {
    return
  }

  const newTab = { bookId, content: book, cellId: null, connectionId: null }

  useStore.setState(
    produce((state: AppState) => {
      state.editor.tabs[bookId] = newTab
      state.editor.tabsOrder.push(bookId)
    })
  )
}

export function removeTab(bookId: string) {
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
      setSelectedBook(editor.tabsOrder[newTabIdx])
    }
  }
}

export function setSelectedCell(cellId: string) {
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
  const newBook = await CreateBook(
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

  setSelectedBook(newBook.id)
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

  await UpdateBook(bookId, book)
}

export async function AddCell(type: "code" | "text", position?: number) {
  const currentBookId = useStore.getState().editor.currentBookId

  if (!currentBookId) {
    return
  }

  const newCell: books.Cell = await CreateCell(currentBookId, type)

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

  await UpdateBook(currentBookId, book)
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

  await UpdateBook(bookId, book)
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

  await UpdateBook(bookId, book)
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

  await UpdateBook(currentBookId, book)
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
