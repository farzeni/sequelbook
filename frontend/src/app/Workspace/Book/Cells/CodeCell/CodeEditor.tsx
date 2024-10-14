import { PostgreSQL, sql } from "@codemirror/lang-sql"
import { useDebounce } from "@hooks/debounce"
import { useTheme } from "@hooks/theme"
import { books } from "@lib/wailsjs/go/models"
import { Execute, SelectNextCell, SelectPreviousCell, UpdateCell } from "@store"
import { eventBus } from "@store/events"
import { githubLight } from "@uiw/codemirror-theme-github"
import { copilot } from "@uiw/codemirror-theme-copilot"
import CodeMirror, { keymap, Prec, ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { PlayIcon } from "lucide-react"
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { sqbCodeMirrorKeymap } from "../../keybindngs"

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

interface CodeEditorProps {
  bookId: string
  connectionId?: string | null
  cell: books.Cell
  selected?: boolean
}

const CodeEditor: FC<CodeEditorProps> = ({ bookId, cell, connectionId, selected }) => {
  const editorRef = useRef<ReactCodeMirrorRef>({});
  const [content, setContent] = useState(cell.content)
  const [error, setError] = useState<any>(null)
  const appTheme = useTheme()


  const debounceUpdate = useDebounce((content: string) => {
    console.log(">>> Saving cell content ", content)
    UpdateCell(bookId, cell.id, content)
  }, EDITOR_DEBOUNCE)

  const handleOnChange = useCallback((content: string) => {
    setContent(content)
    debounceUpdate(content)
  }, [debounceUpdate])


  const handleExecute = useCallback(async () => {
    if (!connectionId) {
      eventBus.emit("connections.pick")
      return
    }

    if (!editorRef.current) {
      return
    }

    setError(null)
    console.log("Execute code: " + cell.id)

    try {
      console.log("EXEC: Saving cell content", content)
      await UpdateCell(bookId, cell.id, content)
      console.log("Executing cell")
      await Execute(cell.id)
    } catch (error) {
      console.error("Error executing code", error)
      setError(error)
    }
  }, [connectionId, cell.id, content])

  const cmKeymap = useCallback(() => sqbCodeMirrorKeymap({
    onExecute: handleExecute,
    onSelectNextCell: SelectNextCell,
    onSelectPreviousCell: SelectPreviousCell,
  }), [handleExecute])

  const editorTheme = useMemo(() => {
    return appTheme.theme === "dark" ? copilot : githubLight
  }, [appTheme.theme])

  useEffect(() => {
    if (selected) {
      editorRef.current.view && editorRef.current.view.focus()
    } else {
      editorRef.current.view && editorRef.current.view.contentDOM.blur()
    }
  }, [selected]);



  return (
    <div className="w-full">
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
              ${!connectionId ? "opacity-50" : ""}
              `} onClick={handleExecute}>
            <PlayIcon size={16} color='#fff' />
          </div>

        ) : (
          <div className="flex justify-center items-start w-[30px]  text-gray-500 cursor-pointer">
            [ ]
          </div>
        )}
        <div className="flex-1 flex flex-col gap-4">
          <CodeMirror
            className='border flex-1 z-1'
            value={content || "\n\n"}
            theme={editorTheme}
            ref={editorRef}
            extensions={[
              Prec.highest(keymap.of(cmKeymap())),
              // keymap.of(standardKeymap),
              sql({
                dialect: PostgreSQL,
                schema: test_schema,
                upperCaseKeywords: true,
              }),
            ]}
            onChange={handleOnChange}
          />
          {error && (
            <div className="p-4 bg-red-100 text-red-500">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CodeEditor