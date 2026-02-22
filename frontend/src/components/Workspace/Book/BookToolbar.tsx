import { BlockType } from "@/bindings/github.com/sequelbook/sequelbook/core/book/models"
import type { ConnectionEntry } from "@/store"
import {
  activeEntryIdAtom,
  addBlockAtom,
  booksAtom,
  connectionListAtom,
  currentTabAtom,
  setTabConnectionAtom,
  updateBookTitleAtom,
} from "@/store"
import {
  Box,
  Button,
  Editable,
  Flex,
  Portal,
  Select,
  createListCollection,
} from "@chakra-ui/react"
import { useAtomValue, useSetAtom } from "jotai"
import { FC, useMemo } from "react"
import { LuCode, LuType } from "react-icons/lu"

// ─── Connection picker (Chakra Select) ───────────────────────────────────────

interface ConnectionPickerProps {
  connections: [string, ConnectionEntry][]
  activeEntryId: string | null
  value: string
  onValueChange: (connectionId: string) => void
}

const ConnectionPicker: FC<ConnectionPickerProps> = ({
  connections,
  activeEntryId,
  value,
  onValueChange,
}) => {
  const collection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "No connection", value: "" },
          ...connections.map(([id, entry]) => ({
            label: `${entry.name}${id === activeEntryId ? " (active)" : ""}`,
            value: id,
          })),
        ],
      }),
    [connections, activeEntryId]
  )

  return (
    <Select.Root
      collection={collection}
      size="xs"
      width="160px"
      flexShrink={0}
      value={[value]}
      onValueChange={(e) => onValueChange(e.value[0] ?? "")}
    >
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="No connection" />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {collection.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                {item.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  )
}

// ─── Book toolbar ─────────────────────────────────────────────────────────────

interface BookToolbarProps {
  bookId: string
}

const BookToolbar: FC<BookToolbarProps> = ({ bookId }) => {
  const books = useAtomValue(booksAtom)
  const connections = useAtomValue(connectionListAtom)
  const activeEntryId = useAtomValue(activeEntryIdAtom)
  const currentTab = useAtomValue(currentTabAtom)
  const updateTitle = useSetAtom(updateBookTitleAtom)
  const addBlock = useSetAtom(addBlockAtom)
  const setTabConnection = useSetAtom(setTabConnectionAtom)

  const ob = books[bookId]
  if (!ob?.book) return null

  const tabConnectionId =
    currentTab?.type === "book" ? currentTab.connectionId : null

  // Get first chapter/section for block add (MVP simplification)
  const chapter = ob.book.chapters[0]
  const section = chapter?.sections[0]

  function handleAddBlock(type: BlockType) {
    if (!chapter || !section) return
    addBlock({ bookId, chapterId: chapter.id, sectionId: section.id, type })
  }

  return (
    <Flex
      align="center"
      gap={3}
      px={4}
      py={2}
      borderBottomWidth="1px"
      borderColor="border"
      flexShrink={0}
    >
      {/* Editable book title */}
      <Box flex="1" minWidth={0}>
        <Editable.Root
          key={bookId}
          defaultValue={ob.book.title}
          onValueCommit={(e) => updateTitle({ bookId, title: e.value })}
          placeholder="Untitled"
        >
          <Editable.Preview
            fontSize="sm"
            fontWeight="medium"
            cursor="pointer"
            px={1}
            truncate
          />
          <Editable.Input fontSize="sm" fontWeight="medium" px={1} />
        </Editable.Root>
      </Box>

       {/* Add block buttons */}
       <Flex gap={1} flexShrink={0}>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => handleAddBlock(BlockType.BlockQuery)}
          disabled={!section}
        >
          <LuCode size={13} />
          Code
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => handleAddBlock(BlockType.BlockMarkdown)}
          disabled={!section}
        >
          <LuType size={13} />
          Text
        </Button>
      </Flex>

      {/* Connection picker */}
      {connections.length > 0 && currentTab?.type === "book" && (
        <ConnectionPicker
          connections={connections}
          activeEntryId={activeEntryId}
          value={tabConnectionId ?? ""}
          onValueChange={(connectionId) =>
            currentTab &&
            setTabConnection({ tabId: currentTab.id, connectionId })
          }
        />
      )}

     
    </Flex>
  )
}

export default BookToolbar
