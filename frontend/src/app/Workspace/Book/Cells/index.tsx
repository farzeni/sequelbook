import { appState } from "@hooks/store";
import { books } from "@lib/wailsjs/go/models";
import { BookTab, SetSelectedCell } from "@store";
import { FC, useCallback } from "react";
import { useSnapshot } from "valtio";
import CodeBlock from "./CodeCell";
import QuickAdd from "./QuickAdd";
import TextBlock from "./TextCell";

interface CellsListProps {
  tab: BookTab
  bookId: string
}

const CellsList: FC<CellsListProps> = ({ bookId, tab }) => {
  const book = useSnapshot(appState.books[bookId])

  const handleSelectCell = useCallback((cellId: string) => {
    SetSelectedCell(cellId)
  }, [])


  return (
    <div>
      <QuickAdd index={0} />
      {book.cells.map((cell: books.Cell, idx: number) => (
        <div key={cell.id}
          onClick={() => handleSelectCell(cell.id)}
          className={`
          max-w-screen-xl
          mx-auto
          px-4
          relative 
          rounded 
          ${tab.cellId === cell.id ? "bg-background-dark" : ""}
        `}>

          {cell.type === "code" && (
            <CodeBlock bookId={bookId} connectionId={tab.connectionId} cell={cell} selected={tab.cellId === cell.id} />
          )}

          {cell.type === "text" && (
            <TextBlock bookId={bookId} cell={cell} selected={tab.cellId === cell.id} />
          )}

          <QuickAdd index={idx + 1} />
        </div>
      ))}
    </div >
  )

}

export default CellsList;