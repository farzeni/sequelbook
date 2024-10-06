import Tabbar from "@app/Workspace/Tabbar"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@components/ui/resizable"
import { appState } from "@hooks/store"
import { ContentPane, Pane, SplitPane } from "@store/editor"
import { FC } from "react"
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
  const editor = useSnapshot(appState.editor)
  const panes = editor.panes

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
  const editor = useSnapshot(appState.editor)
  const tabs = editor.tabs

  const tab = tabs[pane.tabId || ""]

  if (!tab) {
    console.log("no open tab pane: ", pane.id)
    return null
  }

  return (
    <div className="flex-1 h-full">
      <div className="flex bg-gray-50 border-b">
        <Tabbar pane={pane} />
      </div>
      <div className="overflow-y-auto h-full">
        {tab.type === "book" && <BookContent tab={tab} />}
        {tab.type === "connection" && <DatabaseContent tab={tab} />}
      </div>
    </div>
  )
}


export default EditorPane;