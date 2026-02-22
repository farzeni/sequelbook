import { BlockType } from "@/bindings/github.com/sequelbook/sequelbook/core/book/models"
import { addBlockAtom } from "@/store"
import { Box, Button, Flex } from "@chakra-ui/react"
import { useSetAtom } from "jotai"
import { FC, useState } from "react"
import { LuCode, LuType } from "react-icons/lu"

interface QuickAddProps {
  bookId: string
  chapterId: string
  sectionId: string
  position: number
}

const QuickAdd: FC<QuickAddProps> = ({
  bookId,
  chapterId,
  sectionId,
  position,
}) => {
  const addBlock = useSetAtom(addBlockAtom)
  const [hovered, setHovered] = useState(false)

  function handleAddCode() {
    addBlock({
      bookId,
      chapterId,
      sectionId,
      type: BlockType.BlockQuery,
      position,
    })
  }

  function handleAddText() {
    addBlock({
      bookId,
      chapterId,
      sectionId,
      type: BlockType.BlockMarkdown,
      position,
    })
  }

  return (
    <Box
      pt={2}
      pb={4}
      position="relative"
      w="full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Box
        opacity={hovered ? 1 : 0}
        transition="opacity 0.2s"
        position="relative"
      >
        <Box borderTopWidth="1px" borderColor="border" w="full" />
        <Flex
          position="absolute"
          left={0}
          right={0}
          top="50%"
          transform="translateY(-50%)"
          justify="center"
          align="center"
          gap={2}
        >
          <Button size="xs" variant="surface" onClick={handleAddCode}>
            <LuCode size={12} />
            Add Code
          </Button>
          <Button size="xs" variant="subtle" onClick={handleAddText}>
            <LuType size={12} />
            Add Text
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}

export default QuickAdd
