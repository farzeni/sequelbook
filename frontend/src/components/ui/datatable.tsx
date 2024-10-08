import { ColDef, RowClassParams, RowStyle } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { FC } from "react";

type TData = Record<string, unknown>;

interface DataTableProps {
  data: TData[]
  colOrder: string[]
}

const DataTable: FC<DataTableProps> = ({ data, colOrder }) => {

  const colDefs: ColDef<TData>[] = colOrder.map((field) => {
    return { field, filter: true }
  })

  const defaultColDef = {
    minWidth: 100,
    flex: 1
  };

  const getRowStyle: (params: RowClassParams<TData>) => RowStyle | undefined = params => {
    if (params.rowIndex % 2 === 0) {
      return {
        background: "rgba(0,0,0,0.02)",
      };
    }
  };


  return (
    <div className="ag-theme-quartz h-full w-full">
      <AgGridReact<TData>
        rowData={data}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        enableCellTextSelection={true}
        getRowStyle={getRowStyle}
      />
    </div>
  )
}

export default DataTable
