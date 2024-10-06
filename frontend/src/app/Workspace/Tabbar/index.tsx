import { Button } from "@components/ui/button"
import { Separator } from "@components/ui/separator"
import { appState } from "@hooks/store"
import { CloseTab, ContentPane, SelectTab, Tab } from "@store"
import { Book, Database, X } from "lucide-react"
import { FC } from "react"
import { useSnapshot } from "valtio"
import TabbarMenu from './TabbarMenu'

interface TabbarProps {
  pane: ContentPane
}

const Tabbar: FC<TabbarProps> = ({ pane }) => {
  const books = useSnapshot(appState.books)
  const connections = useSnapshot(appState.connections)
  const current = useSnapshot(appState.editor.current)
  const tabs = useSnapshot(appState.editor.tabs)


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
              onClick={() => SelectTab(tabId, pane.id)}
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

                ${current.tabId === tabId && `
                  border-t-2
                  border-t-primary
                `}
                
                ${pane.tabId === tabId ? `
                  bg-white border 
                  border-b-white
                  ` : `
                  bg-gray-50 
                  border-b 
                  hover:bg-gray-100 
                  mb-2
                  rounded`}
                `}>

              {tabs[tabId]?.type === "book" && (<Book size={15} className="text-gray-700" />)}
              {tabs[tabId]?.type === "connection" && (<Database size={15} className="text-gray-700" />)}
              <span className="text-xs text-gray-500 truncate"> {getTabTitle(tabs[tabId])}</span>

              <Button variant="ghost" size="icon-sm" onClick={(e) => handleCloseTab(e, tabId)}
                className={`mr-1`}>
                <X size={15} />
              </Button>
            </div>
            {pane.tabId !== tabId && pane.tabsOrder[idx + 1] !== pane.tabId && (
              <Separator orientation="vertical" className="h-5 mt-1" />
            )}
          </div>
        ))}
      </div>
      <TabbarMenu pane={pane} />
    </div >
  )
}

export default Tabbar