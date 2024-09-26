import { SetSelectedCell, UpdateCell, useStore } from "@hooks/store";
import { books } from "@lib/wailsjs/go/models";
import { FC } from "react";
import CodeBlock from "./CodeCell";
import QuickAdd from "./QuickAdd";
import TextBlock from "./TextCell";

interface CellsListProps {
  book: books.Book
}

const CellsList: FC<CellsListProps> = ({ book }) => {
  const tab = useStore((state) => state.editor.currentBookId ? state.editor.tabs[state.editor.currentBookId] : null)

  async function handleBookChange(cellId: string, source: string) {
    if (!book) return
    await UpdateCell(book.id, cellId, source)
  }

  return (
    <div>
      <QuickAdd index={0} />

      {book.cells.map((cell: books.Cell, idx: number) => (
        <div key={cell.id}
          onClick={() => SetSelectedCell(cell.id)}
          className={`
          max-w-screen-lg
          mx-auto
          relative 
          rounded 
          ${tab?.cellId === cell.id ? "border-slate-600" : ""}
          
        `}>
          {cell.type === "code" && (
            <CodeBlock bookId={book.id} cell={cell} onChange={(source) => handleBookChange(cell.id, source)} selected={tab?.cellId === cell.id} />
          )}

          {cell.type === "text" && (
            <TextBlock bookId={book.id} cell={cell} onChange={(source) => handleBookChange(cell.id, source)} selected={tab?.cellId === cell.id} />
          )}
          <QuickAdd index={idx + 1} />
        </div>
      ))
      }
    </div >
  )

}

export default CellsList
