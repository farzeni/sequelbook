import DataTable from "@components/ui/datatable";
import { appState } from "@hooks/store";
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
    <div className="max-w-screen-md md:max-w-screen-xl mx-auto h-[30rem] relative overflow-hidden ">
      <div className="flex w-full gap-2 h-full ">
        <div className="flex justify-center items-start w-[30px]  text-gray-500 cursor-pointer">

        </div>
        {results?.type === "SELECT" ? data && data.length > 0 && (
          <div className="border border-t-none w-full">

            <DataTable data={data} colOrder={results.columns as string[]} editable />
          </div>
        ) : (
          <div className="p-4 bg-gray-100 text-gray-500">
            {results?.affected_rows} {t("rows affected")}
          </div>
        )}
      </div>
    </div>
  )
}

export default QueryResults;
