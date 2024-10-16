import Tabbar from "@app/Workspace/Tabbar"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@components/ui/resizable"
import { appState, useEditorPane } from "@hooks/store"
import { ClosePane, ContentPane, Pane, SelectPane, SplitPane } from "@store/editor"
import { FC, useCallback } from "react"
import { useSnapshot } from "valtio"
import BookContent from "./Book"
import DatabaseContent from "./Database"

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

interface EditorSplitPaneProps {
  pane: SplitPane
}

const EditorSplitPane: FC<EditorSplitPaneProps> = ({ pane }) => {
  const panes = useSnapshot(appState.editor.panes)

  const firstPane = panes[pane.children[0]]
  const secondPane = panes[pane.children[1]]

  if (!firstPane || !secondPane) {
    console.error("Invalid split pane", pane)
    return null
  }

  return (
    <ResizablePanelGroup
      direction={pane.direction === "horizontal" ? "vertical" : "horizontal"}
      className="max-w-full rounded-lg border md:min-w-[450px]"
    >
      <ResizablePanel defaultSize={50}>
        <EditorPane pane={firstPane as Pane} />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <EditorPane pane={secondPane as Pane} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

interface EditorLeafPaneProps {
  pane: ContentPane
}

const EditorLeafPane: FC<EditorLeafPaneProps> = ({ pane }) => {
  const currentPane = useEditorPane()

  const tab = useSnapshot(appState.editor.tabs)[pane.tabId || ""]
  const books = useSnapshot(appState.books)

  console.log("EditorLeafPane", pane, tab, books)

  const handlePaneSelect = useCallback(() => {
    if (currentPane.id !== pane.id) {
      SelectPane(pane.id)
    }
  }, [pane.id, currentPane])

  if (!tab) {
    ClosePane(pane.id)
    return null
  }

  return (
    <div className="flex-1 h-full" onClick={handlePaneSelect}>
      <div className="flex bg-gray-50 border-b dark:border-b-gray-800 dark:bg-background">
        <Tabbar pane={pane} />
      </div>
      <div className="overflow-y-auto h-full mb-40">
        {tab.type === "book" && <BookContent tab={tab} />}
        {tab.type === "connection" && <DatabaseContent tab={tab} />}
      </div>
    </div>
  )
}


export default EditorPane;