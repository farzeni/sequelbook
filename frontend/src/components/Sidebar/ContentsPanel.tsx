import { Box, Flex, Text } from "@chakra-ui/react"
import { useAtomValue } from "jotai"
import { LuBookOpen, LuTable } from "react-icons/lu"
import { booksAtom, connectionsAtom, currentTabAtom } from "../../store"

export default function ContentsPanel() {
  const currentTab = useAtomValue(currentTabAtom)
  const books = useAtomValue(booksAtom)
  const connections = useAtomValue(connectionsAtom)

  if (!currentTab) {
    return (
      <Flex align="center" justify="center" height="100%" px={4}>
        <Text fontSize="xs" color="fg.subtle" textAlign="center">
          Open a book or connection to see its contents
        </Text>
      </Flex>
    )
  }

  if (currentTab.type === "book") {
    const ob = books[currentTab.bookId]
    const book = ob?.book

    return (
      <Flex direction="column" height="100%" overflow="hidden">
        <Flex
          align="center"
          gap={2}
          px={3}
          py={2}
          borderBottomWidth="1px"
          borderColor="border"
          minHeight="40px"
        >
          <LuBookOpen size={13} />
          <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" color="fg.muted">
            Chapters
          </Text>
        </Flex>
        <Box flex="1" overflowY="auto" py={1}>
          {book?.chapters.map((chapter) => (
            <Box key={chapter.id} px={3} py={1}>
              <Text fontSize="sm" truncate>
                {chapter.title}
              </Text>
            </Box>
          ))}
        </Box>
      </Flex>
    )
  }

  // DatabaseTab
  const config = connections[currentTab.connectionId]

  return (
    <Flex direction="column" height="100%" overflow="hidden">
      <Flex
        align="center"
        gap={2}
        px={3}
        py={2}
        borderBottomWidth="1px"
        borderColor="border"
        minHeight="40px"
      >
        <LuTable size={13} />
        <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" color="fg.muted">
          Tables
        </Text>
      </Flex>
      <Flex align="center" justify="center" flex="1" px={4}>
        <Text fontSize="xs" color="fg.subtle" textAlign="center">
          {config
            ? `Connected to ${config.database}`
            : "Connect to browse tables"}
        </Text>
      </Flex>
    </Flex>
  )
}
