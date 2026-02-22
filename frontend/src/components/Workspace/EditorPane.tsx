import { Box, Flex, Text } from "@chakra-ui/react"
import { useAtomValue, useSetAtom } from "jotai"
import { FC, useCallback } from "react"
import { Group, Panel, Separator } from "react-resizable-panels"
import {
  closePaneAtom,
  currentPaneAtom,
  editorAtom,
  selectPaneAtom,
} from "../../store"
import type { ContentPane, Pane, SplitPane } from "../../store"
import BookContent from "./Book/BookContent"
import DatabaseContent from "./Database/DatabaseContent"
import Tabbar from "./Tabbar"

interface EditorPaneProps {
  pane: Pane
}

const EditorPane: FC<EditorPaneProps> = ({ pane }) => {
  switch (pane.type) {
    case "split":
      return <EditorSplitPane pane={pane as SplitPane} />
    case "leaf":
      return <EditorLeafPane pane={pane as ContentPane} />
    default:
      return null
  }
}

// ─── Split Pane ───────────────────────────────────────────────────────────────

const EditorSplitPane: FC<{ pane: SplitPane }> = ({ pane }) => {
  const editor = useAtomValue(editorAtom)

  const firstPane = editor.panes[pane.children[0]]
  const secondPane = editor.panes[pane.children[1]]

  if (!firstPane || !secondPane) {
    console.error("EditorSplitPane: invalid children", pane)
    return null
  }

  // Pane direction "horizontal" means side-by-side panels,
  // "vertical" means stacked panels.
  const orientation = pane.direction === "vertical" ? "vertical" : "horizontal"

  return (
    <Group orientation={orientation} style={{ height: "100%" }}>
      <Panel defaultSize={50}>
        <EditorPane pane={firstPane as Pane} />
      </Panel>
      <Separator
        style={{
          width: orientation === "horizontal" ? "1px" : "100%",
          height: orientation === "vertical" ? "1px" : "100%",
          background: "var(--chakra-colors-border)",
          cursor: orientation === "horizontal" ? "col-resize" : "row-resize",
        }}
      />
      <Panel defaultSize={50}>
        <EditorPane pane={secondPane as Pane} />
      </Panel>
    </Group>
  )
}

// ─── Leaf (Content) Pane ─────────────────────────────────────────────────────

const EditorLeafPane: FC<{ pane: ContentPane }> = ({ pane }) => {
  const editor = useAtomValue(editorAtom)
  const currentPane = useAtomValue(currentPaneAtom)
  const selectPane = useSetAtom(selectPaneAtom)
  const closePane = useSetAtom(closePaneAtom)

  const tab = editor.tabs[pane.tabId ?? ""]

  const handleClick = useCallback(() => {
    if (currentPane?.id !== pane.id) {
      selectPane(pane.id)
    }
  }, [pane.id, currentPane, selectPane])

  // If a pane somehow has no tabs, close it
  if (pane.tabsOrder.length > 0 && !tab) {
    closePane(pane.id)
    return null
  }

  return (
    <Flex
      direction="column"
      height="100%"
      overflow="hidden"
      onClick={handleClick}
      style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
    >
      {/* Tab bar */}
      <Box flexShrink={0} borderBottomWidth="1px" borderColor="border">
        <Tabbar pane={pane} />
      </Box>

      {/* Content area */}
      <Box flex="1" overflowY="auto">
        {tab?.type === "book" && <BookContent bookId={tab.bookId} />}
        {tab?.type === "connection" && (
          <DatabaseContent connectionId={tab.connectionId} />
        )}
        {!tab && (
          <Flex align="center" justify="center" height="100%">
            <Text fontSize="sm" color="fg.subtle">
              Empty pane
            </Text>
          </Flex>
        )}
      </Box>
    </Flex>
  )
}

export default EditorPane
