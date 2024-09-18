import ScreenContainer from "@/src/components/ScreenContainer"
import { Container } from "@/src/components/ui/container"
import PageTitle from "@/src/components/ui/page-title"
import { ListBooks } from "@/src/lib/wailsjs/go/books/BooksStore"
import { books } from "@/src/lib/wailsjs/go/models"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

const IndexScreen = () => {
  const [books, setBooks] = useState<books.Book[]>([])

  useEffect(() => {
    async function fetchData() {
      const books = await ListBooks()
      setBooks(books)
    }

    fetchData()
  }, [])

  return (
    <ScreenContainer>
      <Container size="md">
        <PageTitle title="Index" />

        <div className="my-4">
          <Link to="/connections">connections</Link>
        </div>
        <div>
          {books.map((book) => (
            <div key={book.id} className="mb-2">
              <Link to={`/book/${book.id}`}>{book.title}</Link>
            </div>
          ))}
        </div>
      </Container>
    </ScreenContainer >
  )
}

export default IndexScreen