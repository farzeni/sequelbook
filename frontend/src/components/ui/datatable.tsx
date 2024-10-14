import { useTheme } from "@hooks/theme";
import { cn } from "@lib/utils";
import { ColDef, RowClassParams } from "ag-grid-community";
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
  const appTheme = useTheme()
  const colDefs: ColDef<TData>[] = colOrder.map((field) => {
    return { colId: field, field, filter: true, editable: editable }
  })

  const defaultColDef = {
    minWidth: 100,
    flex: 1,

  };

  const getRowClass: (params: RowClassParams<TData>) => string | string[] | undefined = params => {
    if (params.rowIndex % 2 !== 0) {
      return "!bg-background-dark";
    } else {
      return "!bg-background";
    }
  };

  const theme = appTheme.theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz"


  return (
    <div className="h-full w-full ">
      <div className={cn(theme, "w-full h-[calc(100vh-124px)] ")}>
        <AgGridReact<TData>
          rowData={data}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          enableCellTextSelection={true}
          getRowClass={getRowClass}
        />
      </div>
      <div className="flex items-center h-[42px] justify-center bg-background-dark text-gray-500 text-sm border-t">
        {data.length} {t("rows", "rows")}
      </div>
    </div>
  )
}

export default DataTable
