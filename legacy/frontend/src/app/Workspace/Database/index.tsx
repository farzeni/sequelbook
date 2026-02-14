import { Button } from "@components/ui/button";
import { appState } from "@hooks/store";
import { cn } from "@lib/utils";
import { AddCell, DatabaseTab, SelectTable } from "@store";
import { PlusIcon, Table, Workflow } from "lucide-react";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import AddRowSheet from "./AddRowSheet";
import TableData from "./TableData";
import TableList from "./TableList";
import TableStructure from "./TableStructure";
import ConnectionMenu from "./Toolbar/ConnectionMenu";

export type Sections = "data" | "structure"

interface DatabaseContentProps {
  tab: DatabaseTab
}

const DatabaseContent: FC<DatabaseContentProps> = ({ tab }) => {
  const { t } = useTranslation()
  const connection = useSnapshot(appState.connections[tab.connectionId])
  const [section, setSection] = useState<Sections>("data")

  return (
    <div className="w-full h-[calc(100vh)] flex flex-col">
      <div className="flex items-center h-[42px] justify-between relative">
        <div className="flex items-center gap-2 ml-2">
          <Button variant="ghost" size="sm" onClick={() => setSection("data")}
            className={section === "data" ? "bg-background-dark" : ""}>
            <div className="flex items-center gap-1">
              <Table width={18} height={18} />
              <span>{t("data", "Data")}</span>
            </div>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSection("structure")}
            className={section === "structure" ? "bg-background-dark" : ""}>
            <div className="flex items-center gap-1">
              <Workflow width={18} height={18} />
              <span>{t("structure", "Structure")}</span>
            </div>
          </Button>
          {section === "data" && (
            <AddRowSheet tab={tab}>
              <Button variant="ghost" size="sm" onClick={() => AddCell("text")}>
                <div className="flex items-center gap-1">
                  <PlusIcon width={18} height={18} />
                  <span>{t("addRow", "Add Row")}</span>
                </div>
              </Button>
            </AddRowSheet>
          )}
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
          <span className={cn(
            !!tab.table && "hover:text-foreground cursor-pointer hover:underline"
          )} onClick={() => SelectTable(tab.id, null)}>{connection.name}</span>{" "}
          {tab.table ? `/ ${tab.table}` : ""}
        </div>

        <div className="flex items-center gap-2 mr-2">
          {section === "data" && (
            <Button variant="outline" size="sm" onClick={() => AddCell("text")} disabled>
              <div className="flex items-center gap-1">
                <span>{t("save-changes", "Save changes")}</span>
              </div>
            </Button>
          )}

          <ConnectionMenu connection={connection} />
        </div>

      </div>
      {tab.table && section === "data" && (
        <TableData tab={tab} table={tab.table} />
      )}

      {tab.table && section === "structure" && (
        <TableStructure tab={tab} table={tab.table} />
      )}

      {!tab.table && (
        <TableList tab={tab} />
      )}


    </div>
  );
}

export default DatabaseContent;