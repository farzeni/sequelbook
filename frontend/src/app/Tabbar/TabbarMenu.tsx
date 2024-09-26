import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@components/ui/dropdown-menu";
import { RemoveTab, SetSelectedBook, useStore } from "@hooks/store";

import { ChevronDown } from "lucide-react";


const TabbbarMenu = ({ }) => {
  const tabsOrder = useStore((state) => state.editor.tabsOrder)
  const books = useStore((state) => state.books)

  function handleCloseTabs(e: React.MouseEvent) {
    e.stopPropagation()

    // Remove all tabs
    tabsOrder.forEach((bookId) => {
      RemoveTab(bookId)
    })
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
        {tabsOrder.length > 0 && (

          <DropdownMenuSeparator />
        )}
        {tabsOrder.map((bookId) => (
          <DropdownMenuItem key={bookId}
            onClick={() => SetSelectedBook(bookId)}
          >
            <span className="text-xs">{books[bookId].title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TabbbarMenu