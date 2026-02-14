import { Button } from "@components/ui/button"
import { Separator } from "@components/ui/separator"
import { appState } from "@hooks/store"
import { cn } from "@lib/utils"
import { CloseTab, ContentPane, SelectTab, Tab } from "@store"
import { Book, Database, X } from "lucide-react"
import { FC, useEffect } from "react"
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

  function handleOnkeydown(e: KeyboardEvent) {
    const ctrl = e.ctrlKey || e.metaKey

    if (ctrl && e.key === "w") {
      e.preventDefault()
      current.tabId &&
        CloseTab(current.tabId)
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleOnkeydown)
    return () => {
      window.removeEventListener("keydown", handleOnkeydown)
    }
  }, [current.tabId])

  if (!pane) {
    return null
  }

  return (
    <div className="flex-1 h-[39px] flex px-2 items-center bg-background-dark">
      <div className="flex-1 flex   items-center overflow-x-auto space-x-1 max-w-[calc(100%-100px)]">
        {pane.tabsOrder.map((tabId, idx) => (
          <div className="flex" key={tabId}>
            <div
              onClick={() => SelectTab(tabId, pane.id)}
              style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
              className={cn(`
                cursor-pointer
                flex 
                items-center 
                py-1
                pl-3 
                max-w-[140px] 
                rounded
                border-2 border-transparent
                dark:hover:bg-neutral-800 hover:bg-neutral-200
                `,

                pane.tabId !== tabId && `
                  bg-background-dark  
                `,
                pane.tabId === tabId && current.tabId !== tabId && `
                  !border-inherit
                `,
                current.tabId === tabId && `
                  dark:!bg-neutral-800 !bg-neutral-200
                `,)}>

              {tabs[tabId]?.type === "book" && (<Book size={15} className="text-gray-700" />)}
              {tabs[tabId]?.type === "connection" && (<Database size={15} className="text-gray-700" />)}
              <span className="text-xs text-gray-500 dark:text-gray-300 truncate"> {getTabTitle(tabs[tabId])}</span>

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