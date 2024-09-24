import { Cross1Icon } from '@radix-ui/react-icons'
import { Button } from "../components/ui/button"
import { RemoveTab, SetSelectedBook, useStore } from "../hooks/store"

const Sidebar = () => {
  const tabsOrder = useStore((state) => state.editor.tabsOrder)
  const selected = useStore((state) => state.editor.currentBookId)
  const books = useStore((state) => state.books)

  function handleCloseTab(e: React.MouseEvent, bookId: string) {
    e.stopPropagation()
    RemoveTab(bookId)
  }

  return (
    <div
      className="flex-1 h-[40px] pt-2 flex"
    >
      {tabsOrder.map((bookId) => (
        <div key={bookId}
          onClick={() => SetSelectedBook(bookId)}
          style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
          className={`
          hover:bg-gray-100
          cursor-pointer
          flex 
          items-center 
          gap-2 
          py-3
          px-3 
          mb-[-1px]   
          mx-1 
          rounded-t 
          ${selected === bookId ?
              "bg-white border border-b-white" : "bg-gray-50 border-b"}`}>
          <span className="text-xs text-gray-500">{books[bookId].title}</span>

          <Button variant="ghost" size="icon" onClick={(e) => handleCloseTab(e, bookId)}>
            <Cross1Icon />
          </Button>
        </div>
      ))}
    </div>
  )
}

export default Sidebar