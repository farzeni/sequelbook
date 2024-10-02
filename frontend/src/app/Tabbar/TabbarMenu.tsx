import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@components/ui/dropdown-menu";
import { useStore } from "@hooks/store";
import { CloseTab, SelectTab, Tab } from "@store";

import { ChevronDown } from "lucide-react";

const TabbarMenu = ({ }) => {
  const pane = useStore((state) => state.editor.pane)
  const tabs = useStore((state) => state.editor.tabs)
  const books = useStore((state) => state.books)
  const connections = useStore((state) => state.connections)



  function handleCloseTabs(e: React.MouseEvent) {
    e.stopPropagation()
    if (!pane) {
      return
    }


    // Remove all tabs
    pane.tabsOrder.forEach((tabId) => {
      CloseTab(tabId)
    })
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="p-0">
          <ChevronDown width={18} height={18} className="text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleCloseTabs}>
            <span className="text-xs">Close all tabs</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {pane.tabsOrder.length > 0 && (

          <DropdownMenuSeparator />
        )}
        {pane.tabsOrder.map((tabId) => (
          <DropdownMenuItem key={tabId}
            onClick={() => SelectTab(tabId)}
          >
            <span className="text-xs">{getTabTitle(tabs[tabId])}</span>
          </DropdownMenuItem>
        ))}


      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (!pane) {
    return null
  }
}

export default TabbarMenu