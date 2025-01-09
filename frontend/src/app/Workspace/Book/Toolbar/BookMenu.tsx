import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@components/ui/dropdown-menu";
import { books } from "@lib/wailsjs/go/models";
import { FC } from "react";

import { DotsVerticalIcon } from "@radix-ui/react-icons";


interface BookMenuProps {
  book: books.Book;
}

const BookMenu: FC<BookMenuProps> = ({ book }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <DotsVerticalIcon width={18} height={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <span className="text-xs">Rename...</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span className="text-xs">Move file to...</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span className="text-xs">Bookmark...</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span className="text-xs">Merge entire file with...</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span className="text-xs">Export</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>
                  <span className="text-xs">Export to SQL</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="text-xs">Export to PDF</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <span className="text-xs text-red-900">Delete book</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default BookMenu