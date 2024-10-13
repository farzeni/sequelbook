import { useEditorTab } from "@hooks/store";
import { DatabaseTab } from "@store";
import { useTranslation } from "react-i18next";
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
        <>
          <div className="h-[40px] border-b flex w-full ">
            <div className="pl-2 flex justify-between items-center w-full">
              <h1 className="text-xs uppercase">{t("contents", "contents")}</h1>
            </div>
          </div>
        </>
      )}


    </div>
  )
}

export default ContentsPanel