import { sql } from '@codemirror/lang-sql';
import { useDebounce } from '@hooks/debounce';
import { AppState, Execute, useStore } from '@hooks/store';
import { books } from "@lib/wailsjs/go/models";
import CodeMirror from '@uiw/react-codemirror';
import { PlayIcon } from 'lucide-react';
import { FC, useEffect, useState } from "react";
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

  const [data, setData] = useState<any[]>([])

  const results = useStore((state: AppState) => state.editor.tabs[bookId].results[cell.id] || null)

  const debouncedOnChange = useDebounce((content: string) => {
    console.log("Debounced content", content)
    setContent(content)
    onChange && onChange(content)
  }, EDITOR_DEBOUNCE)

  async function handleExecute() {
    console.log("Execute code: " + cell.id)
    const response = await Execute(cell.id)
    console.log("response", response)
  }

  useEffect(() => {
    console.log("Edit mode", editMode)

    if (editMode == false) {
      onChange && onChange(content)
    }

  }, [editMode])

  useEffect(() => {
    if (results) {
      setData(JSON.parse(results))
    }
  }, [results])

  return (
    <div onDoubleClick={() => setEditMode(!editMode)} className='w-full relative'>
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

      <div>
        {data.length > 0 && (
          <ResultTable data={data} />
        )}
      </div>
    </div>
  )
}

export default CodeBlock