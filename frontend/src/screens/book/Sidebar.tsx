import { Box, Flex, IconButton, Text } from "@chakra-ui/react"
import { FC } from "react"
import { HiPlus } from 'react-icons/hi'
import { books } from "../../../wailsjs/go/models"


interface SidebarProps {
  book: books.Book
}

const Sidebar: FC<SidebarProps> = ({ book }) => {
  return (
    <Box
      width={"280px"}
      position="fixed"
      height="100%"
      borderRightWidth={1}
      padding="16px">
      <Flex
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Text fontSize="18px" fontWeight="bold" >Summary</Text>
        <IconButton aria-label="Add Chapter" icon={<HiPlus />} variant="ghost" />
      </Flex>

      <Flex
        flexDirection={"column"}
        marginTop={"16px"}
        gap={"8px"}
      >
        {book.chapters.map((chapter) => (
          <Text key={chapter.id}>{chapter.title}</Text>
        ))}
      </Flex>
    </Box>
  )

}

export default Sidebar