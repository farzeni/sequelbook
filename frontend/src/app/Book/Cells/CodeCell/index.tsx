import { sql } from '@codemirror/lang-sql';
import { useDebounce } from '@hooks/debounce';
import { books } from "@lib/wailsjs/go/models";
import CodeMirror from '@uiw/react-codemirror';
import { PlayIcon } from 'lucide-react';
import { FC, useEffect, useState } from "react";

const EDITOR_DEBOUNCE = 350

interface CodeBlockProps {
  cell: books.Cell
  selected?: boolean
  onChange?: (content: string) => void
}

const CodeBlock: FC<CodeBlockProps> = ({ cell, onChange, selected }) => {
  const [content, setContent] = useState(cell.content)
  const [editMode, setEditMode] = useState(false)

  const debouncedOnChange = useDebounce((content: string) => {
    console.log("Debounced content", content)
    setContent(content)
    onChange && onChange(content)
  }, EDITOR_DEBOUNCE)

  function handleContentChange(content: string) {
    debouncedOnChange(content)  // Use the debounced version of onChange
  }


  useEffect(() => {
    console.log("Edit mode", editMode)

    if (editMode == false) {
      onChange && onChange(content)
    }

  }, [editMode])

  async function handleExecute() { }


  return (
    <div onDoubleClick={() => setEditMode(!editMode)} className='flex w-full relative'>
      {selected ? (

        <div className="flex justify-center items-start py-[6px] h-[28px] w-[30px] bg-slate-600 cursor-pointer" onClick={handleExecute}>
          <PlayIcon size={16} color='#fff' />
        </div>

      ) : (
        <div className="flex justify-center items-start w-[30px] bg-gray-100 text-gray-500 cursor-pointer" onClick={handleExecute}>
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
  )
}

export default CodeBlock