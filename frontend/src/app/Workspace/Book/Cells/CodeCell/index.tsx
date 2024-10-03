import { sqbCodeMirrorKeymap } from '@app/Workspace/Book/keybindngs';
import { PostgreSQL, sql } from '@codemirror/lang-sql';
import { useDebounce } from '@hooks/debounce';
import useDisclosure from '@hooks/disclosure';
import { books } from "@lib/wailsjs/go/models";
import { Execute, SelectNextCell, SelectPreviousCell } from '@store';
import { githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror, { keymap, ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { t } from 'i18next';
import { PlayIcon } from 'lucide-react';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeCellAlert from './CodeCellAlert';
import ResultTable from './ResultTable';

import { Prec } from "@codemirror/state";
import { useEventBus } from '@hooks/events';
import { appState } from '@hooks/store';
import React from 'react';
import CodeCellMenu from './CodeCellMenu';

const EDITOR_DEBOUNCE = 1000

const test_schema = {
  "users": [
    "id",
    "firstname",
    "lastname",
    "email",
    "password",
  ],
  "organizations": [
    "id",
    "name"
  ]
}


interface CodeBlockProps {
  bookId: string
  cell: books.Cell
  selected?: boolean
  onChange?: (cellId: string, content: string) => void
}

const CodeBlock: FC<CodeBlockProps> = ({ bookId, cell, onChange, selected }) => {
  const editorRef = useRef<ReactCodeMirrorRef>({});
  const eventBus = useEventBus();
  const [content, _] = useState(cell.content)
  const tab = appState.editor.tab
  const connection = tab?.connectionId
  const errorDialogDisclose = useDisclosure()
  const [error, setError] = useState<any>(null)
  const results = appState.results[cell.id] || null

  const debouncedOnChange = useDebounce((content: string) => {
    onChange && onChange(cell.id, content)
  }, EDITOR_DEBOUNCE)

  const handleExecute = useCallback(async () => {
    if (!connection) {
      eventBus.emit("connections.pick")
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
  }, [connection, cell.id])

  const cmKeymap = useMemo(() => sqbCodeMirrorKeymap({
    onExecute: handleExecute,
    onSelectNextCell: SelectNextCell,
    onSelectPreviousCell: SelectPreviousCell,
  }), [handleExecute])

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

  useEffect(() => {
    if (selected) {
      editorRef.current.view && editorRef.current.view.focus()
    } else {
      editorRef.current.view && editorRef.current.view.contentDOM.blur()
    }
  }, [selected]);

  return (
    <div className="">
      <div className='relative'>
        {selected && <CodeCellMenu cell={cell} bookId={bookId} />}
        <CodeCellAlert
          title={t("notConnected", "Not connected")}
          message={t("noConnectionDescription", "Select a connection to execute queries")}
          isOpen={errorDialogDisclose.isOpen}
          onOpenChange={errorDialogDisclose.onOpenChange}
        />
        <div className="flex w-full gap-2">

          {selected ? (

            <div className={`
              flex 
              justify-center 
              items-start 
              py-[6px] 
              h-[30px] 
              w-[30px] 
              bg-slate-600 
              cursor-pointer 
              rounded-full
              ${!connection ? "opacity-50" : ""}
              `} onClick={handleExecute}>
              <PlayIcon size={16} color='#fff' />
            </div>

          ) : (
            <div className="flex justify-center items-start w-[30px]  text-gray-500 cursor-pointer">
              [ ]
            </div>
          )}
          <CodeMirror
            className='border-gray-200 border flex-1 z-1'
            value={content || "\n\n"}
            theme={githubLight}
            ref={editorRef}
            extensions={[
              Prec.highest(keymap.of(cmKeymap)),
              // keymap.of(standardKeymap),
              sql({
                dialect: PostgreSQL,
                schema: test_schema,
                upperCaseKeywords: true,
              }),
            ]}
            onChange={debouncedOnChange}
          />
        </div>


        {error && (
          <div className="p-4 bg-red-100 text-red-500">
            {error}
          </div>
        )}
      </div>

      {!error && results && (
        <div className="max-w-screen-md md:max-w-screen-xl mx-auto">
          {results?.type === "SELECT" ? data && data.length > 0 && (
            <ResultTable data={data} colOrder={results.columns} />
          ) : (
            <div className="p-4 bg-gray-100 text-gray-500">
              {results?.affected_rows} rows affected
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default React.memo(CodeBlock)