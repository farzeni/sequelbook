import { Flex, IconButton, Text } from "@chakra-ui/react"
import { useAtomValue, useSetAtom } from "jotai"
import { FC } from "react"
import { LuBook, LuDatabase, LuX } from "react-icons/lu"
import type { ContentPane, Tab } from "../../store"
import {
  booksAtom,
  closeTabAtom,
  connectionsAtom,
  currentTabAtom,
  editorAtom,
  selectTabAtom,
} from "../../store"

interface TabbarProps {
  pane: ContentPane
}

const Tabbar: FC<TabbarProps> = ({ pane }) => {
  const editor = useAtomValue(editorAtom)
  const books = useAtomValue(booksAtom)
  const connections = useAtomValue(connectionsAtom)
  const currentTab = useAtomValue(currentTabAtom)
  const selectTab = useSetAtom(selectTabAtom)
  const closeTab = useSetAtom(closeTabAtom)

  function getTabTitle(tab: Tab): string {
    if (tab.type === "book") {
      return books[tab.bookId]?.book?.title ?? "Untitled"
    }
    return connections[tab.connectionId]?.database ?? tab.connectionId
  }

  function handleClose(e: React.MouseEvent, tabId: string) {
    e.stopPropagation()
    closeTab(tabId)
  }

  return (
    <Flex
      align="center"
      minHeight="48px"
      py={2}
      px={1}
      overflowX="auto"
      flexShrink={0}
      style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
      css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
    >
      {pane.tabsOrder.map((tabId) => {
        const tab = editor.tabs[tabId]
        if (!tab) return null

        const isActive = currentTab?.id === tabId
        const isPaneActive = pane.tabId === tabId

        return (
          <Flex
            key={tabId}
            align="center"
            gap={1}
            px={2}
            height="28px"
            borderRadius="sm"
            cursor="pointer"
            flexShrink={0}
            maxWidth="160px"
            bg={isActive ? "bg.subtle" : isPaneActive ? "bg.emphasized" : "transparent"}
            border={isPaneActive && !isActive ? "1px solid" : "1px solid transparent"}
            borderColor={isPaneActive && !isActive ? "border" : "transparent"}
            _hover={{ bg: "bg.subtle" }}
            onClick={() => selectTab({ tabId, paneId: pane.id })}
          >
            {tab.type === "book" ? (
              <LuBook size={12} color="var(--chakra-colors-fg-muted)" />
            ) : (
              <LuDatabase size={12} color="var(--chakra-colors-fg-muted)" />
            )}

            <Text
              fontSize="xs"
              color={isActive ? "fg" : "fg.muted"}
              truncate
              maxWidth="100px"
            >
              {getTabTitle(tab)}
            </Text>

            <IconButton
              aria-label="Close tab"
              variant="ghost"
              size="2xs"
              flexShrink={0}
              onClick={(e) => handleClose(e, tabId)}
              _hover={{ bg: "bg.emphasized" }}
            >
              <LuX size={11} />
            </IconButton>
          </Flex>
        )
      })}
    </Flex>
  )
}

export default Tabbar
