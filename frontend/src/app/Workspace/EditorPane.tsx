import Tabbar from "@app/Workspace/Tabbar"
import { Separator } from "@components/ui/separator"
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

  if (!firstPane || !secondPane || firstPane.type === "split" || secondPane.type === "split") {
    console.error("Invalid split pane", pane)
    return null
  }

  return (
    <div className={`
      w-full
      h-full
      flex
      ${pane.direction === "horizontal" ? "flex-row" : "flex-row"}
      `}>
      <div className=" flex-1">
        <EditorPane pane={firstPane as Pane} />
      </div>
      <Separator className={pane.direction === "vertical" ? "w-[1px] h-full" : "h-[1px] w-full"} />
      <div className="flex-1">
        <EditorPane pane={secondPane as Pane} />
      </div>
    </div>
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
    console.error("Invalid leaf pane", pane)
    return null
  }

  console.log("Leaf pane", pane.id, " tab:", tab.id)

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