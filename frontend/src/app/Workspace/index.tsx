import { appState } from "@hooks/store";
import { Pane } from "@store";
import { useSnapshot } from "valtio";
import EditorPane from "./EditorPane";


const Workspace = () => {
  const current = useSnapshot(appState.editor.current)
  const panes = useSnapshot(appState.editor.panes)
  const rootPane = panes[current.rootPaneId]

  if (!rootPane) {
    return null
  }

  console.log("Workspace render: rootPane changed id:", rootPane.id)

  return (
    <EditorPane pane={rootPane as Pane} />
  )

}

export default Workspace;