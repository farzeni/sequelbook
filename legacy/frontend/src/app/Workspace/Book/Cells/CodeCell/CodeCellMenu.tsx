import { books } from '@lib/wailsjs/go/models';
import { PlayIcon } from 'lucide-react';
import { FC } from 'react';
import CellMenu from '../CellMenu';

interface CodeCellMenuProps {
  cell: books.Cell
  bookId: string
}

const CodeCellMenu: FC<CodeCellMenuProps> = ({ cell, bookId }) => {
  async function handleExecute() {
    console.log("Execute code: " + cell.id)
  }

  return (
    <CellMenu cell={cell} bookId={bookId}>
      <div className="flex justify-center items-center w-[30px] cursor-pointer" onClick={handleExecute}>
        <PlayIcon size={18} />
      </div>
    </CellMenu>
  )
}

export default CodeCellMenu