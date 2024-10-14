import { books } from "@lib/wailsjs/go/models";
import { FC } from "react";

import React from 'react';
import CodeCellMenu from './CodeCellMenu';
import CodeEditor from './CodeEditor';
import QueryResults from './QueryResults';


interface CodeBlockProps {
  bookId: string
  connectionId?: string | null
  cell: books.Cell
  selected?: boolean
}

const CodeBlock: FC<CodeBlockProps> = ({ bookId, connectionId, cell, selected }) => {
  return (
    <div className="pt-4">
      <div className='relative'>
        {selected && <CodeCellMenu cell={cell} bookId={bookId} />}
        <CodeEditor bookId={bookId} cell={cell} selected={selected} connectionId={connectionId} />
      </div>
      <QueryResults cellId={cell.id} />
    </div>
  )
}

export default React.memo(CodeBlock)