import { useStore } from "@hooks/store";
import { useMemo } from "react";
import BookItem from "./BookItem";
import BookToolbar from "./BookToolbar";


const BooksPanel = () => {
  const selectedBookId = useStore((state) => state.editor.currentBookId)
  const books = useStore((state) => state.books)

  const sidebar = useStore((state) => state.editor.sidebar)

  const orderedBooks = useMemo(() => {
    return Object.values(books).sort((a, b) => a.title.localeCompare(b.title))
  }, [books])

  return (
    <div className="w-full">
      <BookToolbar />
      {orderedBooks.length > 0 ? (
        <div className="flex flex-col gap-1 w-full p-4">
          {orderedBooks.map((book) => (
            <BookItem key={book.id} book={book} selected={selectedBookId === book.id} />
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