import { useStore } from "@hooks/store"
import { useEffect, useRef } from "react"
import CellsList from "./Cells"
import BookToolbar from "./Toolbar"

const BookContent = () => {
  const book = useStore((state) => state.editor.currentBookId ? state.books[state.editor.currentBookId] : null)
  const bookContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (book) {
      // scroll to top
      setTimeout(() => {
        bookContainerRef.current?.scrollTo(0, 0)
      }, 0)
    }
  }, [book])

  if (!book) {
    return (
      <div className="flex-1 h-[calc(100vh-40px)] flex items-center justify-center bg">
        <div className="text-gray-500">No book selected</div>
      </div>
    )
  }


  return (
    <div>
      <BookToolbar book={book} />
      <div ref={bookContainerRef} className="h-[calc(100vh-82px)] overflow-y-auto">
        <div className="mx-auto max-w-screen-md lg:max-w-screen-md my-4 flex flex-col gap-2 ">
          <CellsList book={book} />
        </div>
      </div>
    </div>
  )
}

export default BookContent