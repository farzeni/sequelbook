import ScreenContainer from "@/src/components/ScreenContainer"
import { GetBook } from "@/src/lib/wailsjs/go/books/BooksStore"
import { books } from "@/src/lib/wailsjs/go/models"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import ChapterScreen from "./chapter"


const BookScreen = () => {
  const [book, setBook] = useState<books.Book | null>(null)
  const { bookId } = useParams()

  console.log(">>", bookId)

  useEffect(() => {
    if (!bookId) {
      return
    }

    async function fetchData() {
      const book = await GetBook(bookId!)
      setBook(book)
    }

    fetchData()
  }, [bookId])

  return book ? (
    <ScreenContainer>
      <Topbar title={book.title} />
      <div className="h-full w-full">
        <Sidebar book={book} />

        <div className="ml-[280px] w-[calc(100%-200px)] h-full">
          <ChapterScreen book={book} />
        </div>

      </div>
    </ScreenContainer>
  ) : null
}

export default BookScreen