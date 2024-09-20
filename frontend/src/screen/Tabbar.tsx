import { Cross1Icon } from '@radix-ui/react-icons'
import { Button } from "../components/ui/button"
import { removeTab, setSelectedBook, useStore } from "../hooks/store"

const Sidebar = () => {
  const tabs = useStore((state) => state.tabs)
  const selected = useStore((state) => state.selectedBook)

  function handleCloseTab(e: React.MouseEvent, bookId: string) {
    e.stopPropagation()
    removeTab(bookId)
  }

  return (
    <div className="flex-1 h-[40px] pt-2 flex bg-gray-50 border-b">
      {tabs.map((tab) => (
        <div key={tab.bookId}
          onClick={() => setSelectedBook(tab.bookId)}
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
          ${selected?.id === tab.bookId ?
              "bg-white border border-b-white" : "bg-gray-50 border-b"}`}>
          <span className="text-xs text-gray-500">{tab.content.title}</span>

          <Button variant="ghost" size="icon" onClick={(e) => handleCloseTab(e, tab.bookId)}>
            <Cross1Icon />
          </Button>
        </div>
      ))}
    </div>
  )
}

export default Sidebar