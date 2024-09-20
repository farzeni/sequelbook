import { useEffect } from "react"
import { useBooks } from "../hooks/books"
import { useStore } from "../hooks/store"
import Sidebar from "./Sidebar"
import Tabbar from "./Tabbar"
import BookContent from "./book"

const IndexScreen = () => {
  const books = useStore((state) => state.books)
  const { getBooks } = useBooks()

  useEffect(() => {
    getBooks()
  }, [])

  return (
    <div className="flex h-full ">
      <Sidebar />
      <div className="flex-1 h-full ">
        <Tabbar />
        <BookContent />
      </div>
    </div>
  )
}

export default IndexScreen