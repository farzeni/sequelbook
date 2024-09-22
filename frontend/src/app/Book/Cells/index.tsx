import { setSelectedCell, UpdateCell, useStore } from "@hooks/store";
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
    console.log("Book updated")
  }

  return (
    <div>
      <QuickAdd />

      {book.cells.map((cell: books.Cell) => (
        <>
          <div key={cell.id} className={`w-full border border-transparent ${tab?.cellId === cell.id ? "border-gray-100 shadow rounded" : ""}`}
            onClick={() => setSelectedCell(cell.id)}>
            {cell.type === "code" && (
              <CodeBlock cell={cell} onChange={(source) => handleBookChange(cell.id, source)} selected={tab?.cellId === cell.id} />
            )}

            {cell.type === "text" && (
              <TextBlock cell={cell} onChange={(source) => handleBookChange(cell.id, source)} />
            )}
          </div>
          <QuickAdd />
        </>
      ))}
    </div>
  )

}

export default CellsList
