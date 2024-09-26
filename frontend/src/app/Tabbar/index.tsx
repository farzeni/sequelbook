import { Button } from "@components/ui/button"
import { Separator } from "@components/ui/separator"
import { RemoveTab, SetSelectedBook, useStore } from "@hooks/store"
import { X } from "lucide-react"
import TabbarMenu from './TabbarMenu'

const Sidebar = () => {
  const tabsOrder = useStore((state) => state.editor.tabsOrder)
  const books = useStore((state) => state.books)
  const selected = useStore((state) => state.editor.currentBookId)

  function handleCloseTab(e: React.MouseEvent, bookId: string) {
    e.stopPropagation()
    RemoveTab(bookId)
  }

  return (
    <div
      className="flex-1 h-[39px]  flex px-2 items-center"
    >
      <div className="flex-1 flex h-[31px] pt-1 items-center">
        {tabsOrder.map((bookId, idx) => (
          <div className="flex">

            <div
              onClick={() => SetSelectedBook(bookId)}
              style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
              className={`
            cursor-pointer
            flex 
            items-center 
            gap-2 
            py-3
            pl-3 
            mb-[-5px]   
            mx-1
            max-w-[140px] 
            h-[31px]
            rounded-t 
            ${selected === bookId ? `
              bg-white border 
              border-b-white
              ` : `
              bg-gray-50 
              border-b 
              hover:bg-gray-100 
              mb-2
              rounded`}
            `}>
              <span className="text-xs text-gray-500 truncate">{books[bookId].title}</span>

              <Button variant="ghost" size="icon" onClick={(e) => handleCloseTab(e, bookId)}>
                <X size={15} />
              </Button>
            </div>
            {selected !== bookId && tabsOrder[idx + 1] !== selected && (
              <Separator orientation="vertical" className="h-5 mt-1" />
            )}
          </div>
        ))}
      </div>
      <TabbarMenu />
    </div >
  )
}

export default Sidebar