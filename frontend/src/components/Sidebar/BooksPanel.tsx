import {
  Box,
  Button,
  Dialog,
  Flex,
  IconButton,
  Menu,
  Text,
} from "@chakra-ui/react"
import { useAtomValue, useSetAtom } from "jotai"
import { useMemo, useState } from "react"
import { LuBook, LuEllipsis, LuPlus, LuTrash2 } from "react-icons/lu"
import type { Book, OpenBook } from "../../store"
import {
  addBookAtom,
  booksAtom,
  currentTabAtom,
  deleteBookAtom,
  openInTabAtom,
} from "../../store"

type OpenBookWithBook = OpenBook & { book: Book }

export default function BooksPanel() {
  const books = useAtomValue(booksAtom)
  const currentTab = useAtomValue(currentTabAtom)
  const openInTab = useSetAtom(openInTabAtom)
  const addBook = useSetAtom(addBookAtom)
  const deleteBook = useSetAtom(deleteBookAtom)

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    bookId: string | null
    bookTitle: string
  }>({ open: false, bookId: null, bookTitle: "" })

  const sortedBooks = useMemo(
    () =>
      (Object.values(books) as OpenBook[])
        .filter((ob): ob is OpenBookWithBook => ob.book !== null)
        .sort((a, b) => a.book.title.localeCompare(b.book.title)),
    [books]
  )

  const activeBookId =
    currentTab?.type === "book" ? currentTab.bookId : null

  function openDeleteConfirm(ob: OpenBookWithBook) {
    setDeleteConfirm({
      open: true,
      bookId: ob.book.id,
      bookTitle: ob.book.title,
    })
  }

  function closeDeleteConfirm() {
    setDeleteConfirm({ open: false, bookId: null, bookTitle: "" })
  }

  async function handleConfirmDelete() {
    const { bookId } = deleteConfirm
    if (!bookId) return
    try {
      await deleteBook(bookId)
      closeDeleteConfirm()
    } catch {
      // silent
    }
  }

  return (
    <Flex direction="column" height="100%" overflow="hidden">
      {/* Header */}
      <Flex
        align="center"
        justify="space-between"
        px={3}
        py={2}
        borderBottomWidth="1px"
        borderColor="border"
        minHeight="40px"
      >
        <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" color="fg.muted">
          Books
        </Text>
        <IconButton
          aria-label="New book"
          variant="ghost"
          size="xs"
          onClick={() => addBook()}
        >
          <LuPlus size={14} />
        </IconButton>
      </Flex>

      {/* Book list */}
      <Box flex="1" overflowY="auto" py={1}>
        {sortedBooks.length === 0 ? (
          <Flex align="center" justify="center" height="60px">
            <Text fontSize="xs" color="fg.subtle">
              No books yet
            </Text>
          </Flex>
        ) : (
          sortedBooks.map((ob) => {
            const isActive = ob.book.id === activeBookId
            return (
              <Flex
                key={ob.book.id}
                align="center"
                gap={2}
                px={3}
                py={1}
                cursor="pointer"
                bg={isActive ? "bg.subtle" : "transparent"}
                _hover={{ bg: "bg.subtle" }}
                onClick={() =>
                  openInTab({ entityType: "book", entityId: ob.book.id })
                }
                style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
              >
                <LuBook size={13} color="var(--chakra-colors-fg-muted)" />
                <Text fontSize="sm" truncate maxWidth="160px" flex={1}>
                  {ob.book.title}
                </Text>
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <IconButton
                      aria-label="Book actions"
                      variant="ghost"
                      size="2xs"
                      flexShrink={0}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LuEllipsis size={12} />
                    </IconButton>
                  </Menu.Trigger>
                  <Menu.Positioner>
                    <Menu.Content minWidth="160px" onClick={(e) => e.stopPropagation()}>
                      <Menu.Item
                        value="delete"
                        color="fg.error"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteConfirm(ob)
                        }}
                      >
                        <LuTrash2 size={13} />
                        Delete
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Menu.Root>
              </Flex>
            )
          })
        )}
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog.Root
        open={deleteConfirm.open}
        onOpenChange={(e) => {
          if (!e.open) closeDeleteConfirm()
        }}
        size="sm"
        motionPreset="slide-in-bottom"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Delete book?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text color="fg.muted">
                This will permanently delete the file. This action cannot be undone.
              </Text>
              {deleteConfirm.bookTitle && (
                <Text fontWeight="medium" mt={2}>
                  "{deleteConfirm.bookTitle}"
                </Text>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={closeDeleteConfirm}>
                Cancel
              </Button>
              <Button colorPalette="red" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Flex>
  )
}
