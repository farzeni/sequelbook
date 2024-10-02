import { Button } from "@components/ui/button"
import { Separator } from "@components/ui/separator"
import { useStore } from "@hooks/store"
import { CloseTab, SelectTab, Tab } from "@store"
import { Book, Database, X } from "lucide-react"
import TabbarMenu from './TabbarMenu'

const Tabbar = () => {
  const pane = useStore((state) => state.editor.pane)
  const tabs = useStore((state) => state.editor.tabs)
  const books = useStore((state) => state.books)
  const connections = useStore((state) => state.connections)
  const selected = useStore((state) => state.editor.tab?.id)

  function handleCloseTab(e: React.MouseEvent, bookId: string) {
    e.stopPropagation()
    CloseTab(bookId)
  }

  function getTabTitle(tab: Tab) {
    if (tab.type === "book" && tab.bookId) {
      return books[tab.bookId]?.title || "Untitled"
    } else if (tab.type === "connection" && tab.connectionId) {
      return connections[tab.connectionId]?.name || "Untitled Connection"
    }
  }

  if (!pane) {
    return null
  }

  return (
    <div
      className="flex-1 h-[39px] flex px-2 items-center"
    >
      <div className="flex-1 flex h-[31px] pt-1 items-center">
        {pane.tabsOrder.map((tabId, idx) => (
          <div className="flex" key={tabId}>

            <div
              onClick={() => SelectTab(tabId)}
              style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
              className={`
                group
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
                
                ${selected === tabId ? `
                  bg-white border 
                  border-b-white
                  ` : `
                  bg-gray-50 
                  border-b 
                  hover:bg-gray-100 
                  mb-2
                  rounded`}
                `}>

              {tabs[tabId].type === "book" && (<Book size={15} className="text-gray-700" />)}
              {tabs[tabId].type === "connection" && (<Database size={15} className="text-gray-700" />)}
              <span className="text-xs text-gray-500 truncate">{getTabTitle(tabs[tabId])}</span>

              <Button variant="ghost" size="icon-sm" onClick={(e) => handleCloseTab(e, tabId)}
                className={`mr-1`}>
                <X size={15} />
              </Button>
            </div>
            {selected !== tabId && pane.tabsOrder[idx + 1] !== selected && (
              <Separator orientation="vertical" className="h-5 mt-1" />
            )}
          </div>
        ))}
      </div>
      <TabbarMenu />
    </div >
  )
}

export default Tabbar