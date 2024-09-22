import { books } from '@lib/wailsjs/go/models';
import { Edit, Edit2Icon, SaveIcon, TrashIcon } from 'lucide-react';
import { FC } from 'react';
import CellMenu from '../CellMenu';

interface TextCellMenuProps {
  bookId: string
  cell: books.Cell
}

const TextCellMenu: FC<TextCellMenuProps> = ({ cell, bookId }) => {
  async function handleExecute() {
  }

  return (
    <CellMenu cell={cell} bookId={bookId}>
      <div className="flex justify-center items-center w-[30px] cursor-pointer" onClick={handleExecute}>
        <SaveIcon size={18} />
      </div>
    </CellMenu>
  )
}

export default TextCellMenu