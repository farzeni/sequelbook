import { ColDef, RowClassParams, RowStyle } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { FC } from "react";
import { useTranslation } from "react-i18next";

export type TData = Record<string, unknown>;

interface DataTableProps {
  data: TData[]
  colOrder: string[]
  editable?: boolean
}

const DataTable: FC<DataTableProps> = ({ data, colOrder, editable }) => {
  const { t } = useTranslation()
  const colDefs: ColDef<TData>[] = colOrder.map((field) => {
    return { colId: field, field, filter: true, editable: editable }
  })

  const defaultColDef = {
    minWidth: 100,
    flex: 1,

  };

  const getRowStyle: (params: RowClassParams<TData>) => RowStyle | undefined = params => {
    if (params.rowIndex % 2 !== 0) {
      return {
        background: "rgba(0,0,0,0.02)",
      };
    }
  };


  return (
    <div className="ag-theme-quartz h-full w-full ">
      <div className="ag-theme-quartz w-full h-[calc(100vh-124px)] bg-red-400">
        <AgGridReact<TData>
          rowData={data}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          enableCellTextSelection={true}
          getRowStyle={getRowStyle}
        />
      </div>
      <div className="flex items-center h-[42px] justify-center bg-secondary text-gray-500 text-sm border-t">
        {data.length} {t("rows", "rows")}
      </div>
    </div>
  )
}

export default DataTable
