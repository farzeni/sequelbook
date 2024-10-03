import { appState } from "@hooks/store";
import { books } from "@lib/wailsjs/go/models";
import { useMemo } from "react";
import { useSnapshot } from 'valtio';
import BookItem from "./BookItem";
import BookToolbar from "./BookToolbar";


const BooksPanel = () => {
  const selectedTabId = useSnapshot(appState).editor.tabId
  const books = useSnapshot(appState).books

  const orderedBooks = useMemo(() => {
    return Object.values(books).sort((a, b) => a.title.localeCompare(b.title))
  }, [books])

  return (
    <div className="w-full">
      <BookToolbar />
      {orderedBooks.length > 0 ? (
        <div className="flex flex-col gap-1 w-full p-4">
          {orderedBooks.map((book) => (
            <BookItem key={book.id} book={book as books.Book} selected={selectedTabId === book.id} />
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