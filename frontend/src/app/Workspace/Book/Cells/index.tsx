import { useStore } from "@hooks/store";
import { books } from "@lib/wailsjs/go/models";
import { SetSelectedCell, UpdateCell } from "@store";
import { FC, useCallback, useMemo } from "react";
import CodeBlock from "./CodeCell";
import QuickAdd from "./QuickAdd";
import TextBlock from "./TextCell";

interface CellsListProps {
  book: books.Book
}

const CellsList: FC<CellsListProps> = ({ book }) => {
  return (
    <div>
      <QuickAdd index={0} />
      {book.cells.map((cell: books.Cell, idx: number) => (
        <CellsListItem key={cell.id} idx={idx} bookId={book.id} cell={cell} />
      ))}
    </div >
  )

}

interface CellsListItemProps {
  idx: number
  bookId: string
  cell: books.Cell
}

const CellsListItem: FC<CellsListItemProps> = ({ idx, bookId, cell }) => {

  const tab = useStore((state) => state.editor.tab)

  const selectedCellId = tab?.cellId

  const handleBookChange = useCallback(async (cellId: string, source: string) => {
    UpdateCell(bookId, cellId, source)
  }, [bookId])

  const handleSelectCell = useCallback(() => {
    SetSelectedCell(cell.id)
  }, [cell.id])


  const selected = useMemo(() => {
    return selectedCellId === cell.id
  }, [selectedCellId, cell])

  return (
    <div key={cell.id}
      onClick={handleSelectCell}
      className={`
        max-w-screen-lg
        mx-auto
        relative 
        rounded 
        ${selected ? "border-slate-600" : ""}
      `}>

      {cell.type === "code" && (
        <CodeBlock bookId={bookId} cell={cell} onChange={handleBookChange} selected={selected} />
      )}

      {cell.type === "text" && (
        <TextBlock bookId={bookId} cell={cell} onChange={handleBookChange} selected={selected} />
      )}

      <QuickAdd index={idx + 1} />
    </div>
  )
}

export default CellsList;