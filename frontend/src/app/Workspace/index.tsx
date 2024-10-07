import { useEditorRootPane } from "@hooks/store";
import { Pane } from "@store";
import EditorPane from "./EditorPane";


const Workspace = () => {
  const rootPane = useEditorRootPane()

  if (!rootPane) {
    return null
  }

  console.debug("Workspace render: rootPane changed id:", rootPane.id)

  return (
    <EditorPane pane={rootPane as Pane} />
  )

}

export default Workspace;