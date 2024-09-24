import { sql } from '@codemirror/lang-sql';
import { useDebounce } from '@hooks/debounce';
import useDisclosure from '@hooks/disclosure';
import { AppState, Execute, useStore } from '@hooks/store';
import { books } from "@lib/wailsjs/go/models";
import CodeMirror from '@uiw/react-codemirror';
import { t } from 'i18next';
import { PlayIcon } from 'lucide-react';
import { FC, useEffect, useMemo, useState } from "react";
import CodeCellAlert from './CodeCellAlert';
import ResultTable from './ResultTable';

const EDITOR_DEBOUNCE = 350

interface CodeBlockProps {
  bookId: string
  cell: books.Cell
  selected?: boolean
  onChange?: (content: string) => void
}

const CodeBlock: FC<CodeBlockProps> = ({ bookId, cell, onChange, selected }) => {
  const [content, setContent] = useState(cell.content)
  const [editMode, setEditMode] = useState(false)
  const connection = useStore((state: AppState) => state.editor.tabs[bookId].connectionId)

  const errorDialogDisclose = useDisclosure()

  const [error, setError] = useState<any>(null)

  const results = useStore((state: AppState) => state.editor.tabs[bookId].results[cell.id] || null)

  const debouncedOnChange = useDebounce((content: string) => {
    console.log("Debounced content", content)
    setContent(content)
    onChange && onChange(content)
  }, EDITOR_DEBOUNCE)

  async function handleExecute() {
    if (!connection) {
      errorDialogDisclose.onOpenChange(true)
      return
    }

    setError(null)
    console.log("Execute code: " + cell.id)



    try {
      await Execute(cell.id)
    } catch (error) {
      console.error("Error executing code", error)
      setError(error)
    }
  }

  useEffect(() => {
    console.log("Edit mode", editMode)

    if (editMode == false) {
      onChange && onChange(content)
    }

  }, [editMode])

  const data = useMemo(() => {
    if (results && results.type === "SELECT") {
      try {
        return JSON.parse(results.json.toString())
      } catch (error) {
        setError("Error parsing results")
      }
    }

    return null
  }, [results])

  return (
    <div onDoubleClick={() => setEditMode(!editMode)} className='w-full relative'>
      <CodeCellAlert
        title={t("notConnected", "Not connected")}
        message={t("noConnectionDescription", "Select a connection to execute queries")}
        isOpen={errorDialogDisclose.isOpen}
        onOpenChange={errorDialogDisclose.onOpenChange}
      />
      <div className="flex w-full">

        {selected ? (

          <div className="flex justify-center items-start py-[6px] h-[28px] w-[30px] bg-slate-600 cursor-pointer" onClick={handleExecute}>
            <PlayIcon size={16} color='#fff' />
          </div>

        ) : (
          <div className="flex justify-center items-start w-[30px] bg-gray-100 text-gray-500 cursor-pointer">
            [ ]
          </div>
        )}
        <CodeMirror
          className='border-gray-200 border flex-1 z-1'
          value={content}
          extensions={[sql()]}
          onChange={debouncedOnChange}
        />
      </div>

      {!error && results && (
        <div>
          {results?.type === "SELECT" ? data && data.length > 0 && (
            <ResultTable data={data} colOrder={results.columns} />
          ) : (
            <div className="p-4 bg-gray-100 text-gray-500">
              {results?.affected_rows} rows affected
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-500">
          {error}
        </div>
      )}
    </div>
  )
}

export default CodeBlock