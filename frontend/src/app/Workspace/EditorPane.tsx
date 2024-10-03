import Tabbar from "@app/Tabbar"
import { Separator } from "@components/ui/separator"
import { useStore } from "@hooks/store"
import { Pane } from "@store/editor"
import { FC } from "react"
import BookContent from "./Book"
import DatabaseContent from "./Database"

interface EditorPaneProps {
  pane: Pane
}

const EditorPane: FC<EditorPaneProps> = ({ pane }) => {
  const tab = useStore((state) => state.editor.tab())
  const panes = useStore((state) => state.editor.panes)

  if (pane.type === "split") {
    console.log("split", pane.id)

    const firstPane = panes[pane.children[0]]
    const secondPane = panes[pane.children[1]]

    if (!firstPane || !secondPane || firstPane.type === "split" || secondPane.type === "split") {
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
          <EditorPane pane={firstPane} />
        </div>
        <Separator className={pane.direction === "vertical" ? "w-[1px] h-full" : "h-[1px] w-full"} />
        <div className="flex-1">
          <EditorPane pane={secondPane} />
        </div>
      </div>
    )
  }

  if (pane.type === "leaf") {
    console.log("leaf", pane.id)
    if (tab && tab.type === "book") {
      return (
        <div className="flex-1 h-full ">
          <div
            className="flex bg-gray-50 border-b"
            style={{ "--wails-draggable": "drag" } as React.CSSProperties}>
            <Tabbar pane={pane} />
          </div>
          <div className="overflow-y-auto h-full">

            <BookContent tab={tab} />
          </div>
        </div>

      )
    }

    if (tab && tab.type === "connection") {
      return (
        <div className="flex-1 h-full ">
          <div
            className="flex bg-gray-50 border-b"
            style={{ "--wails-draggable": "drag" } as React.CSSProperties}>
            <Tabbar pane={pane} />
          </div>
          <div className="overflow-y-auto h-full">

            <DatabaseContent tab={tab} />
          </div>
        </div>
      )
    }
  }

  return null // TODO: Add 404ish page
}

export default EditorPane;