import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@components/ui/dropdown-menu";
import { appState } from "@hooks/store";
import { CloseTab, ContentPane, SelectTab, Tab } from "@store";

import { ChevronDown } from "lucide-react";
import { FC } from "react";
import { useSnapshot } from "valtio";
import SplitButton from "./SplitButton";

interface TabbarMenuProps {
  pane: ContentPane
}

const TabbarMenu: FC<TabbarMenuProps> = ({ pane }) => {
  const tabs = useSnapshot(appState.editor.tabs)
  const books = useSnapshot(appState.books)
  const connections = useSnapshot(appState.connections)

  function handleCloseTabs(e: React.MouseEvent) {
    e.stopPropagation()
    if (!pane || pane.type !== "leaf") {
      return
    }

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

  if (!pane || pane.type !== "leaf") {
    return null
  }

  return (
    <div className="flex items-center">
      <SplitButton pane={pane as ContentPane} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="p-0" >
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
              onClick={() => SelectTab(tabId, pane.id)}
            >
              <span className="text-xs">{getTabTitle(tabs[tabId])}</span>
            </DropdownMenuItem>
          ))}


        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  if (!pane) {
    return null
  }
}

export default TabbarMenu