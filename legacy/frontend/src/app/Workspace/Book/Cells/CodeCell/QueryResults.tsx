import DataTable from "@components/ui/datatable";
import { appState } from "@hooks/store";
import { cn } from "@lib/utils";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";

interface QueryResultsProps {
  cellId: string
}

const QueryResults: FC<QueryResultsProps> = ({ cellId }) => {
  const { t } = useTranslation()
  const results = useSnapshot(appState.results)[cellId]

  const data = useMemo(() => {
    if (results && results.type === "SELECT") {
      try {
        return JSON.parse(results.json.toString())
      } catch (error) {
        console.error("Error parsing results cellId", cellId, error)
        console.error("Results", results.json.toString())
      }
    }

    return null
  }, [results])

  if (!results) {
    return null
  }

  return (
    <div className={cn(
      "max-w-screen-md md:max-w-screen-xl mx-auto relative overflow-hidden ",
      !!data && data.length > 0 && " h-[30rem]"
    )}>
      <div className="flex w-full gap-2 h-full ">
        <div className="flex justify-center items-start w-[30px]  text-gray-500 cursor-pointer">

        </div>
        {results?.type === "SELECT" && data && data.length > 0 && (
          <div className="border border-t-none w-full">
            <DataTable data={data} colOrder={results.columns as string[]} editable className="bg-background-dark" />
          </div>
        )}

        {results?.type === "SELECT" && (!data || data.length == 0) && (
          <div className="border border-t-none w-full bg-background-dark">
            <div className="p-4 text-foreground">{t("query-no-results", "This query returned no results")}</div>
          </div>
        )}

        {results?.type !== "SELECT" && (
          <div className="border border-t-none w-full bg-background-dark">
            <div className="p-4 text-foreground">{results?.affected_rows} {t("query-rows-affected", "rows affected")}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QueryResults;
