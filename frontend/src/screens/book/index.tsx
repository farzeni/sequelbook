import { Box, Flex } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { GetBook } from "../../../wailsjs/go/books/BooksStore"
import { books } from "../../../wailsjs/go/models"
import ScreenContainer from "../../components/ScreenContainer"
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
      <Flex sx={{
        width: "100%",
        height: "100%",
      }}>
        <Sidebar book={book} />

        <Box
          marginLeft={"280px"}
          width={"calc(100% - 200px)"}
          height={"100%"}
        >
          <ChapterScreen book={book} />
        </Box>

      </Flex>
    </ScreenContainer>
  ) : null
}

export default BookScreen