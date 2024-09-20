import { ListBooks } from "@/src/lib/wailsjs/go/books/BooksStore"
import { setBooks } from "./store"

export function useBooks() {
  async function getBooks() {
    const books = await ListBooks()

    setBooks(books || [])

    return books || []
  }

  return {
    getBooks,
  }
}
