import { Button, Flex, Text, VStack } from "@chakra-ui/react"
import { useAtomValue, useSetAtom } from "jotai"
import { FC } from "react"
import { LuCode, LuFileText, LuType } from "react-icons/lu"
import { addBlockAtom, booksAtom, currentTabAtom } from "@/store"
import { BlockType } from "@/bindings/github.com/sequelbook/sequelbook/core/book/models"
import BookToolbar from "./BookToolbar"
import CodeCell from "./Cells/CodeCell"
import QuickAdd from "./Cells/QuickAdd"
import TextCell from "./Cells/TextCell"

interface BookContentProps {
  bookId: string
}

const BookContent: FC<BookContentProps> = ({ bookId }) => {
  const books = useAtomValue(booksAtom)
  const addBlock = useSetAtom(addBlockAtom)
  const currentTab = useAtomValue(currentTabAtom)
  const tabId = currentTab?.type === "book" && currentTab.bookId === bookId ? currentTab.id : undefined

  const ob = books[bookId]
  if (!ob?.book) {
    return (
      <Flex align="center" justify="center" height="100%" direction="column" gap={2}>
        <Text fontSize="sm" color="fg.subtle">
          Book not found
        </Text>
      </Flex>
    )
  }

  // MVP simplification: render first chapter, first section
  const chapter = ob.book.chapters[0]
  const section = chapter?.sections[0]
  const blocks = section?.blocks ?? []

  function handleAddBlock(type: BlockType) {
    if (!chapter || !section) return
    addBlock({ bookId, chapterId: chapter.id, sectionId: section.id, type })
  }

  return (
    <Flex direction="column" minHeight="100%" data-focus-zone="editor">
      <BookToolbar bookId={bookId} />

      <VStack flex="1" gap={0} align="stretch" px={4} py={3}>
        {blocks.length === 0 ? (
          <Flex
            flex="1"
            align="center"
            justify="center"
            direction="column"
            gap={3}
          >
            <LuFileText size={32} color="var(--chakra-colors-fg-subtle)" />
            <Text fontSize="sm" color="fg.muted">
              This book is empty. Add your first cell.
            </Text>
            <Flex gap={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddBlock(BlockType.BlockQuery)}
              >
                <LuCode size={14} />
                Add Code
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddBlock(BlockType.BlockMarkdown)}
              >
                <LuType size={14} />
                Add Text
              </Button>
            </Flex>
          </Flex>
        ) : (
          blocks.flatMap((block, idx) => {
            const cellProps = {
              key: block.id,
              block,
              bookId,
              chapterId: chapter.id,
              sectionId: section.id,
              tabId,
            }
            const cell =
              block.type === "query" ? (
                <CodeCell {...cellProps} />
              ) : (
                <TextCell {...cellProps} />
              )
            return [
              cell,
              <QuickAdd
                key={`qa-${block.id}`}
                bookId={bookId}
                chapterId={chapter.id}
                sectionId={section.id}
                position={idx + 1}
              />,
            ]
          })
        )}
      </VStack>
    </Flex>
  )
}

export default BookContent
