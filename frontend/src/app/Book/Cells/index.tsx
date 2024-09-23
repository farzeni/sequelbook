import { SetSelectedCell, UpdateCell, useStore } from "@hooks/store";
import { books } from "@lib/wailsjs/go/models";
import { FC } from "react";
import CodeBlock from "./CodeCell";
import CodeCellMenu from "./CodeCell/CodeCellMenu";
import QuickAdd from "./QuickAdd";
import TextBlock from "./TextCell";
import TextCellMenu from "./TextCell/TextCellMenu";

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
        <div key={cell.id}>
          <div
            className={`
              w-full 
              relative 
              rounded 
              border-gray-300
              border-transparent 
              ${tab?.cellId === cell.id ? "border-2 shadow " : ""}`}
            onClick={() => SetSelectedCell(cell.id)}>
            {cell.type === "code" && (
              <>
                {tab?.cellId === cell.id && <CodeCellMenu cell={cell} bookId={book.id} />}
                <CodeBlock bookId={book.id} cell={cell} onChange={(source) => handleBookChange(cell.id, source)} selected={tab?.cellId === cell.id} />
              </>
            )}

            {cell.type === "text" && (
              <>
                {tab?.cellId === cell.id && <TextCellMenu cell={cell} bookId={book.id} />}
                <TextBlock cell={cell} onChange={(source) => handleBookChange(cell.id, source)} selected={tab?.cellId === cell.id} />
              </>
            )}
          </div>
          <QuickAdd index={idx + 1} />
        </div>
      ))}
    </div>
  )

}

export default CellsList
