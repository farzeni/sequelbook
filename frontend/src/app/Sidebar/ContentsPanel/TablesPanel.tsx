import { Button } from "@components/ui/button";
import { TreeDataItem, TreeView } from "@components/ui/tree-view";
import { appState } from "@hooks/store";
import { runners } from "@lib/wailsjs/go/models";
import { GetTables } from "@lib/wailsjs/go/runners/Pooler";
import { DatabaseTab, SelectTable } from "@store";
import { FC, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";

interface TablesPanelProps {
  tab: DatabaseTab
}

const TablesPanel: FC<TablesPanelProps> = ({ tab }) => {
  const { t } = useTranslation();
  const [tables, setTables] = useState<runners.TableDef[]>([])
  const [error, setError] = useState<string | null>(null)

  const connection = useSnapshot(appState.connections[tab.connectionId])

  const handleItemClick = (item?: TreeDataItem) => {
    console.log("Item clicked", item?.id)
    if (!item) {
      return
    }

    SelectTable(tab.id, item.id)
  }

  useEffect(() => {
    async function fetchTables() {
      try {

        const data = await GetTables(connection)
        setTables(data.tables)
      } catch (e: any) {
        setError(e.toString())
      }
    }

    fetchTables()
  }, [tab.connectionId])

  const treeData = useMemo(() => {
    const rootData: TreeDataItem[] = [
      {
        id: "tables",
        name: t("tables", "Tables"),
      },
      {
        id: "views",
        name: t("views", "Views"),
      },
      {
        id: "sequences",
        name: t("sequences", "Sequences"),
      },
    ]


    for (const table of tables) {
      switch (table.table_type) {
        case "BASE TABLE":
          rootData[0].children = rootData[0].children || []
          rootData[0].children.push({
            id: table.table_name,
            name: table.table_name,
          })
          break;
        case "VIEW":
          rootData[1].children = rootData[1].children || []
          rootData[1].children.push({
            id: table.table_name,
            name: table.table_name,
          })
          break;
        case "SEQUENCE":
          rootData[2].children = rootData[2].children || []
          rootData[2].children.push({
            id: table.table_name,
            name: table.table_name,
          })
          break;
      }
    }

    for (const idx in rootData) {
      if (!rootData[idx].children) {
        delete rootData[idx].children
      } else {
        // rootData[idx].children.sort((a, b) => a?.name.localeCompare(b?.name))
      }
    }

    return rootData
  }, [tables])

  return (
    <div>
      <div className="h-[40px] border-b flex w-full ">
        <div className="pl-2 flex justify-between items-center w-full">
          <h1 className="text-xs uppercase">{t("tables", "Tables")}</h1>
        </div>
      </div>

      {!error && (

        <TreeView className="text-gray-500" data={treeData} initialSelectedItemId=" tables" onSelectChange={handleItemClick} />
      )}

      {error && (
        <div className="p-4 flex flex-col gap-3">
          <h4 className="font-bold">{t("not-connected", "Not connected")}</h4>
          <p className="text-sm text-gray-700">
            <Trans i18nKey="error-db-connection-msg" t={t}>
              It seems your database is unreachable or the connection settings are incorrect.
            </Trans>
          </p>
          <p className="text-sm text-gray-700">
            <Trans i18nKey="error-db-connection-msg" t={t}>
              Check your connection settings and try again.
            </Trans>
          </p>

          <Button size="sm" className="w-full">
            {t("open-connection-settings", "Open connection settings")}
          </Button>
        </div>
      )}

    </div>
  )
}

export default TablesPanel;