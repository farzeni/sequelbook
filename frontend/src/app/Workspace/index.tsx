import { isBookID, useStore } from "@hooks/store";
import BookContent from "./Book";
import DatabaseContent from "./Database";


const Workspace = () => {
  const tabId = useStore((state) => state.editor.currentTabId)

  if (!tabId) {
    return null
  }

  if (isBookID(tabId)) {
    return <BookContent bookId={tabId} />
  }

  return <DatabaseContent connectionId={tabId} />
}

export default Workspace;