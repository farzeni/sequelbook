import { SetSelectedCell, UpdateCell, useStore } from "@hooks/store";
import { books } from "@lib/wailsjs/go/models";
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

        <CellsListItem idx={idx} book={book} cell={cell} />
      ))
      }
    </div >
  )

}

const CellsListItem: FC<{ idx: number, book: books.Book, cell: books.Cell }> = ({ idx, book, cell }) => {
  const selectedCellId = useStore((state) => state.editor.currentBookId ? state.editor.tabs[state.editor.currentBookId]?.cellId : null)

  const handleBookChange = useCallback(async (cellId: string, source: string) => {
    if (!book) return
    UpdateCell(book.id, cellId, source)
  }, [book])

  const bookId = useMemo(() => book.id, [book])
  const cellMemo = useMemo(() => cell, [cell])
  const selected = useMemo(() => {
    return selectedCellId === cell.id
  }, [selectedCellId, cell])

  return (
    <div key={cell.id}
      onClick={() => SetSelectedCell(cell.id)}
      className={`
          max-w-screen-lg
          mx-auto
          relative 
          rounded 
          ${selected ? "border-slate-600" : ""}
          
        `}>

      {cell.type === "code" && (
        <CodeBlock bookId={bookId} cell={cellMemo} onChange={handleBookChange} selected={selected} />
      )}

      {cell.type === "text" && (
        <TextBlock bookId={bookId} cell={cellMemo} onChange={handleBookChange} selected={selected} />
      )}

      <QuickAdd index={idx + 1} />
    </div>
  )

}

export default CellsList
