import { appState } from "@hooks/store";
import { runners } from "@lib/wailsjs/go/models";
import { GetColumns } from "@lib/wailsjs/go/runners/Pooler";
import { DatabaseTab } from "@store";
import { ColDef, RowClassParams, RowStyle } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

import { FC, useEffect, useState } from "react";
import { useSnapshot } from "valtio";

interface TableDataProps {
  tab: DatabaseTab,
  table: string
}

const TableStructure: FC<TableDataProps> = ({ tab, table }) => {
  const [columns, setColumns] = useState<runners.ColumnDef[]>([])
  const [error, setError] = useState<string | null>(null)

  const connection = useSnapshot(appState.connections[tab.connectionId])

  useEffect(() => {
    async function fetchData() {
      try {
        const r = await GetColumns(connection, table)
        console.log("Table data", r)
        if (r) {
          console.log("Parsed data", r.columns)
          setColumns(r.columns)
        }
      } catch (e: any) {
        console.error("Failed to parse table data", e)
        setError(e.toString())
      }
    }

    fetchData()
  }, [tab.connectionId, table])

  const colDefs: ColDef<runners.ColumnDef>[] = [
    {
      field: "column_name",
      headerName: "Column Name",
      filter: true,
    },
    {
      field: "data_type",
      headerName: "Data Type",
      filter: true,
    },
    {
      field: "is_primary_key",
      headerName: "Is Primary Key",
      filter: true,
    },
    {
      field: "is_nullable",
      headerName: "Is Nullable",
      filter: true,
    },
    {
      field: "column_default",
      headerName: "Default",
      filter: true
    }
  ]


  const defaultColDef = {
    minWidth: 100,
    flex: 1,

  };

  const getRowStyle: (params: RowClassParams<runners.ColumnDef>) => RowStyle | undefined = params => {
    if (params.rowIndex % 2 === 0) {
      return {
        background: "rgba(0,0,0,0.02)",
      };
    }
  };


  return (
    <div className="ag-theme-quartz h-full w-full ">
      {!error && columns && (
        <AgGridReact<runners.ColumnDef>
          rowData={columns}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          enableCellTextSelection={true}
          getRowStyle={getRowStyle}
        />
      )}
    </div>
  )
}

export default TableStructure;