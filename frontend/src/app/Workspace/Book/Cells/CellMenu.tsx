import { books } from "@lib/wailsjs/go/models"
import { MoveCellDown, MoveCellUp, RemoveCell } from "@store"
import { ArrowDown, ArrowUp, TrashIcon } from "lucide-react"
import { FC } from "react"

interface CellMenuProps {
  cell: books.Cell
  bookId: string
  children: React.ReactNode | React.ReactNode[]
}

const CellMenu: FC<CellMenuProps> = ({ cell, bookId, children }) => {
  async function handleDelete() {
    RemoveCell(bookId, cell.id)
  }

  async function moveCellUp() {
    MoveCellUp(bookId, cell.id)
  }

  async function moveCellDown() {
    MoveCellDown(bookId, cell.id)
  }


  return (
    <div className="absolute z-10 flex gap-1 bg-background-dark border  rounded right-2 top-[-16px] h-[32px]">
      <div className="flex justify-center items-center w-[30px] cursor-pointer" onClick={moveCellUp}>
        <ArrowUp size={18} />
      </div>
      <div className="flex justify-center items-center w-[30px] cursor-pointer" onClick={moveCellDown}>
        <ArrowDown size={18} />
      </div>
      {children}
      <div className="flex justify-center items-center w-[30px] cursor-pointer" onClick={handleDelete}>

        <TrashIcon size={18} />
      </div>
    </div>
  )
}

export default CellMenu