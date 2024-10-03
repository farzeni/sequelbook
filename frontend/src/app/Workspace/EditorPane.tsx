import Tabbar from "@app/Workspace/Tabbar"
import { Separator } from "@components/ui/separator"
import { appState } from "@hooks/store"
import { Pane } from "@store/editor"
import { FC } from "react"
import { useSnapshot } from "valtio"
import BookContent from "./Book"
import DatabaseContent from "./Database"

interface EditorPaneProps {
  pane: Pane
}

const EditorPane: FC<EditorPaneProps> = ({ pane }) => {
  const editor = useSnapshot(appState.editor)

  const tab = editor.tabs[editor.tabId || ""] || null


  console.log("EditorPane render", pane.type, pane.id, tab)

  if (pane.type === "split") {

    const firstPane = editor.panes[pane.children[0]]
    const secondPane = editor.panes[pane.children[1]]

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

  return (
    <div className="flex-1 h-full ">
      <div
        className="flex bg-gray-50 border-b"
        style={{ "--wails-draggable": "drag" } as React.CSSProperties}>
        <Tabbar pane={pane} />
      </div>
      <div className="overflow-y-auto h-full">
        {tab && tab.type === "book" && <BookContent tab={tab} />}
        {tab && tab.type === "connection" && <DatabaseContent tab={tab} />}

      </div>
    </div>

  )
}

export default EditorPane;