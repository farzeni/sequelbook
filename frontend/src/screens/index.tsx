import { Box, Container } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ListBooks } from "../../wailsjs/go/books/BooksStore"
import { books } from "../../wailsjs/go/models"
import ScreenContainer from "../components/ScreenContainer"
import PageTitle from "../components/ui/PageTitle"

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
      <Container>
        <PageTitle title="Index" />

        <Box>
          <Link to="/connections">connections</Link>
        </Box>
        <Box>
          {books.map((book) => (
            <Box key={book.id}>
              <Link to={`/book/${book.id}`}>{book.title}</Link>
            </Box>
          ))}
        </Box>
      </Container>
    </ScreenContainer>
  )
}

export default IndexScreen