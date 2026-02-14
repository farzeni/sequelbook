import { appState } from '@hooks/store';
import { runners } from '@lib/wailsjs/go/models';
import { GetTables } from '@lib/wailsjs/go/runners/Pooler';
import { DatabaseTab, SelectTable } from '@store';
import { ColDef, RowClassParams, RowClickedEvent, RowStyle } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";
import { FC, useEffect, useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';

interface TableListProps {
  tab: DatabaseTab
}

const TableList: FC<TableListProps> = ({ tab }) => {
  const [tables, setTables] = useState<runners.TableResult | null>(null)
  const connection = useSnapshot(appState.connections[tab.connectionId])

  useEffect(() => {
    async function fetchTables() {
      const tables = await GetTables(connection)
      setTables(tables)
    }

    fetchTables()
  }, [tab.connectionId])


  const colDefs: ColDef<runners.TableDef>[] = useMemo(() => {

    return [{
      field: 'table_name',
      filter: true
    }]
  }, [tables])

  const defaultColDef = {
    minWidth: 100,
    flex: 1
  };

  const getRowStyle: (params: RowClassParams<runners.TableDef>) => RowStyle | undefined = params => {
    if (params.rowIndex % 2 === 0) {
      return {
        background: "rgba(0,0,0,0.02)",
      };
    }
  };

  function handleRowClicked(event: RowClickedEvent<runners.TableDef>) {
    if (event.data?.table_name) {
      SelectTable(tab.id, event.data.table_name)
    }
  }

  return (
    <div className="ag-theme-quartz w-full h-full">
      <AgGridReact<runners.TableDef>
        rowData={tables?.tables}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        enableCellTextSelection={true}
        getRowStyle={getRowStyle}
        sideBar={"filters"}
        onRowClicked={handleRowClicked}
      />
    </div>
  );
}

export default TableList;