import { useStore } from "@/src/hooks/store"
import CodeBlock from "./CodeBlock"
import TextBlock from "./TextBlock"
import BookToolbar from "./Toolbar"


const BookContent = () => {
  const book = useStore((state) => state.selectedBook)

  if (!book) {
    return <div>no book selected</div>
  }

  return (
    <div>
      <BookToolbar />
      <div className="p-4">
        {book.cells.map((cell) => (
          <div key={cell.id} className="border p-4">
            {cell.type === "code" && (
              <CodeBlock cell={cell} />
            )}

            {cell.type === "text" && (
              <TextBlock cell={cell} />
            )}
          </div>
        ))}
      </div>


    </div>
  )
}

export default BookContent