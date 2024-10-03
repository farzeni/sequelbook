import { books } from "@lib/wailsjs/go/models";
import { BookTab, SetSelectedCell, UpdateCell } from "@store";
import { FC, useCallback } from "react";
import CodeBlock from "./CodeCell";
import QuickAdd from "./QuickAdd";
import TextBlock from "./TextCell";

interface CellsListProps {
  tab: BookTab
  book: books.Book
}

const CellsList: FC<CellsListProps> = ({ book, tab }) => {
  return (
    <div>
      <QuickAdd index={0} />
      {book.cells.map((cell: books.Cell, idx: number) => (
        <CellsListItem key={cell.id} idx={idx} bookId={book.id} cell={cell} selected={tab.cellId === cell.id} />
      ))}
    </div >
  )

}

interface CellsListItemProps {
  idx: number
  bookId: string
  cell: books.Cell
  selected?: boolean
}

const CellsListItem: FC<CellsListItemProps> = ({ idx, bookId, cell, selected }) => {

  const handleBookChange = useCallback(async (cellId: string, source: string) => {
    UpdateCell(bookId, cellId, source)
  }, [bookId])

  const handleSelectCell = useCallback(() => {
    SetSelectedCell(cell.id)
  }, [cell.id])


  return (
    <div key={cell.id}
      onClick={handleSelectCell}
      className={`
        max-w-screen-xl
        mx-auto
        px-4
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