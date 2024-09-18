import { Button, Flex, HStack } from "@chakra-ui/react"
import { FC } from "react"
import { books } from "../../../../wailsjs/go/models"

interface ChapterToolbarProps {
  book: books.Book
}

const ChapterToolbar: FC<ChapterToolbarProps> = ({ book }) => {
  return (
    <Flex borderBottomWidth={1} p={2}>
      <HStack>
        <Button variant="outline">Add Text</Button>
        <Button variant="outline">Add Code</Button>
      </HStack>
    </Flex>
  )
}

export default ChapterToolbar