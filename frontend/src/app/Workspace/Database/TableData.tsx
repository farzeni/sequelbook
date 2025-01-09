import { Button } from "@components/ui/button"
import DataTable, { TData } from "@components/ui/datatable"
import { useEventBusListener } from "@hooks/events"
import { appState } from "@hooks/store"
import { runners } from "@lib/wailsjs/go/models"
import { GetColumns } from "@lib/wailsjs/go/runners/Pooler"
import { DatabaseTab, GetTableData } from "@store"
import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useSnapshot } from "valtio"

interface TableDataProps {
  tab: DatabaseTab,
  table: string
}

const TableData: FC<TableDataProps> = ({ tab, table }) => {
  const { t } = useTranslation()
  const [data, setData] = useState<TData[] | null>(null)
  const [columns, setColumns] = useState<runners.ColumnDef[]>([])
  const connection = useSnapshot(appState.connections[tab.connectionId])
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const r = await GetTableData(tab.connectionId, table)
      if (r) {
        const parsed = JSON.parse(r.json)
        setData(parsed)
      }

      const c = await GetColumns(connection, table)
      if (c) {
        setColumns(c.columns)
      }

    } catch (e: any) {
      console.error("Failed to parse table data", e)
      setError(e.toString())
    }
  }, [tab.connectionId, table])

  useEventBusListener("connection.table.refresh", (connectionId, table) => {
    if (connectionId === tab.connectionId && table === tab.table) {
      fetchData()
    }
  })

  useEffect(() => {
    if (!tab.table) {
      return
    }
    fetchData()

  }, [fetchData])

  const colOrder = useMemo(() => {
    if (columns.length === 0) {
      return []
    }

    const sorted = columns.sort((a, b) => {
      // prepend primary keys
      if (a.is_primary_key) {
        return -1
      }

      if (b.is_primary_key) {
        return 1
      }


      // prepend descriptive columns
      const names = ["name", "title"]

      if (names.includes(a.column_name)) {
        return -1
      }

      if (names.includes(b.column_name)) {
        return 1
      }


      return 0
    })

    return sorted.map((c) => c.column_name)
  }, [columns])


  return (
    <div className="w-full h-full">
      {error && (
        <div className="flex-1 h-[calc(100vh-180px)] flex items-center justify-center bg flex-col prose dark:prose-invert mx-auto">
          <h1>{t("not-connected", "Not connected")}</h1>
          <div className="text-gray-500">
            <Trans i18nKey="error-db-connection-msg" t={t}>
              It seems your database is unreachable or the connection settings are incorrect.
            </Trans>
          </div>

          <div className="flex mt-4 gap-2 flex-col">
            <Button variant="link" className="text-purple-900 text-lg">
              {t("open-connection-settings", "Open connection settings")}
            </Button>
          </div>
        </div>
      )}


      {!error && data && (
        <DataTable data={data} colOrder={colOrder} editable />
      )}


    </div>
  )
}

export default TableData


