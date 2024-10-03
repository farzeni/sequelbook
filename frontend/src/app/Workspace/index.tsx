import { useStore } from "@hooks/store";
import EditorPane from "./EditorPane";


const Workspace = () => {
  const rootPane = useStore((state) => state.editor.rootPane())

  if (!rootPane) {
    return null
  }

  return (
    <EditorPane pane={rootPane} />
  )

}

export default Workspace;