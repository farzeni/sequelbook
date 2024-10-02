import { useStore } from "@hooks/store"
import { Pane } from "@store/editor"
import { FC } from "react"
import BookContent from "./Book"
import DatabaseContent from "./Database"

interface EditorPaneProps {
  pane: Pane
}

const EditorPane: FC<EditorPaneProps> = ({ pane }) => {
  const tab = useStore((state) => state.editor.tab)

  if (!tab) {
    return null
  }

  if (tab.type === "book") {
    return <BookContent tab={tab} />
  }

  return <DatabaseContent tab={tab} />
}

export default EditorPane;