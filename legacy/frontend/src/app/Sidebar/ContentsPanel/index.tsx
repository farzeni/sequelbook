import { useEditorTab } from "@hooks/store";
import { BookTab, DatabaseTab } from "@store";
import { useTranslation } from "react-i18next";
import ChaptersPanel from "./ChaptersPanel";
import TablesPanel from "./TablesPanel";


const ContentsPanel = () => {
  const { t } = useTranslation();

  const tab = useEditorTab()

  if (!tab) {
    return null
  }

  return (
    <div className="w-full">
      {tab.type === "connection" ? (
        <TablesPanel tab={tab as DatabaseTab} />
      ) : (
        <ChaptersPanel tab={tab as BookTab} />
      )}


    </div>
  )
}

export default ContentsPanel