import { appState } from "@hooks/store";
import { books } from "@lib/wailsjs/go/models";
import { useCallback, useMemo } from "react";
import { useSnapshot } from 'valtio';
import BookItem from "./BookItem";
import BookToolbar from "./BookToolbar";


const BooksPanel = () => {
  const current = useSnapshot(appState.editor.current)
  const tabs = useSnapshot(appState.editor.tabs)
  const books = useSnapshot(appState).books

  const tab = current.tabId ? tabs[current.tabId] : null


  const orderedBooks = useMemo(() => {
    return Object.values(books).sort((a, b) => a.title.localeCompare(b.title))
  }, [books])


  const isSelected = useCallback((bookId: string) => {
    if (tab && tab.type !== "book") {
      return false
    }

    return !!tab && tab.bookId === bookId
  }, [tab])


  return (
    <div className="w-full">
      <BookToolbar />
      {orderedBooks.length > 0 ? (
        <div className="flex flex-col gap-1 w-full p-4">
          {orderedBooks.map((book) => (
            <BookItem key={book.id} book={book as books.Book} selected={isSelected(book.id)} />
          ))}
        </div>
      ) : (
        <div>
          no books
        </div>
      )}
    </div>
  )
}

export default BooksPanel;