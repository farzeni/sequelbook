import { sql } from '@codemirror/lang-sql';
import { books } from "@lib/wailsjs/go/models";
import CodeMirror from '@uiw/react-codemirror';
import { PlayIcon, TrashIcon } from 'lucide-react';
import { FC, useEffect, useState } from "react";
import CellMenu from './CellMenu';

interface CodeBlockProps {
  cell: books.Cell
  selected?: boolean
  onChange?: (content: string) => void
}

const CodeBlock: FC<CodeBlockProps> = ({ cell, onChange, selected }) => {
  const [content, setContent] = useState(cell.content)
  const [editMode, setEditMode] = useState(false)


  useEffect(() => {
    if (editMode == false) {
      onChange && onChange(content)
    }

  }, [editMode])

  async function handleExecute() {
  }

  return (
    <div onDoubleClick={() => setEditMode(!editMode)} className='flex w-full relative'>
      {selected ? (
        <>
          <CellMenu>
            <div className="flex justify-center items-center w-[30px] cursor-pointer" onClick={handleExecute}>
              <PlayIcon size={18} />
            </div>
            <div className="flex justify-center items-center w-[30px] cursor-pointer" onClick={handleExecute}>
              <TrashIcon size={18} />
            </div>
          </CellMenu>

          <div className="flex justify-center items-start py-[6px] h-[28px] w-[30px] bg-slate-600 cursor-pointer" onClick={handleExecute}>
            <PlayIcon size={16} color='#fff' />
          </div>
        </>

      ) : (
        <div className="flex justify-center items-start w-[30px] bg-gray-100 text-gray-500 cursor-pointer" onClick={handleExecute}>
          [ ]
        </div>
      )}
      <CodeMirror
        className='border-gray-200 border flex-1 z-1'
        value={content}
        extensions={[sql()]}
        onChange={setContent}
      />
    </div>
  )
}

export default CodeBlock