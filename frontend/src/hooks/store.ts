import { books, connections } from "@/src/lib/wailsjs/go/models"
import { create } from "zustand"

interface BookTab {
  bookId: string
  content: books.Book
}

interface AppState {
  books: books.Book[]
  connections: connections.Connection[]
  selectedBook: books.Book | null
  selectedConnection: connections.Connection | null
  tabs: BookTab[]
}

export const useStore = create<AppState>()(() => ({
  books: [],
  connections: [],
  selectedBook: null,
  selectedConnection: null,
  tabs: [],
}))

export function setBooks(books: books.Book[]) {
  useStore.setState({ books })
}

export function setSelectedBook(bookId: string) {
  const book = useStore.getState().books.find((book) => book.id === bookId)

  useStore.setState({ selectedBook: book })

  addTab(bookId)
}

export function addTab(bookId: string) {
  const tabs = useStore.getState().tabs

  if (tabs.find((tab) => tab.bookId === bookId)) {
    return
  }

  const book = useStore.getState().books.find((book) => book.id === bookId)

  if (!book) {
    return
  }

  useStore.setState({ tabs: [...tabs, { bookId, content: book }] })
}

export function removeTab(bookId: string) {
  const tabs = useStore.getState().tabs

  const tabIdx = tabs.findIndex((tab) => tab.bookId === bookId)

  useStore.setState({ tabs: tabs.filter((tab) => tab.bookId !== bookId) })

  if (useStore.getState().selectedBook?.id === bookId) {
    if (tabs.length === 1) {
      useStore.setState({ selectedBook: null })
    } else {
      const newTabIdx = tabIdx === 0 ? 1 : tabIdx - 1
      setSelectedBook(tabs[newTabIdx].bookId)
    }
  }
}
