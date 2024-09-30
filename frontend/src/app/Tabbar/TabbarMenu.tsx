import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@components/ui/dropdown-menu";
import { isBookID, RemoveTab, SelectTab, useStore } from "@hooks/store";

import { ChevronDown } from "lucide-react";


const TabbbarMenu = ({ }) => {
  const tabsOrder = useStore((state) => state.editor.tabsOrder)
  const books = useStore((state) => state.books)
  const connections = useStore((state) => state.connections)

  function handleCloseTabs(e: React.MouseEvent) {
    e.stopPropagation()

    // Remove all tabs
    tabsOrder.forEach((bookId) => {
      RemoveTab(bookId)
    })
  }

  function getTabTitle(tabId: string) {
    console.log(tabId)
    if (isBookID(tabId)) {
      return books[tabId].title || "Untitled"
    } else {
      return connections[tabId].name || "Untitled Connection"
    }
  }

  console.log(tabsOrder)

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
        {tabsOrder.length > 0 && (

          <DropdownMenuSeparator />
        )}
        {tabsOrder.map((tabId) => (
          <DropdownMenuItem key={tabId}
            onClick={() => SelectTab(tabId)}
          >
            <span className="text-xs">{getTabTitle(tabId)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TabbbarMenu