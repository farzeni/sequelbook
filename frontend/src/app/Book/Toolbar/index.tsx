import { Button } from "@components/ui/button"
import { AddCell } from "@hooks/store"
import { books } from "@lib/wailsjs/go/models"
import { PlusIcon } from "@radix-ui/react-icons"
import { FC } from "react"
import BookMenu from "./BookMenu"

interface BookToolbarProps {
  book: books.Book
}

const BookToolbar: FC<BookToolbarProps> = ({ book }) => {
  return (
    <div className="flex  items-center p-2 border-b h-[42px] justify-between">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={() => AddCell("code")}>
          <div className="flex items-center gap-1">
            <PlusIcon width={18} height={18} />
            <span>Code</span>
          </div>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => AddCell("text")}>
          <div className="flex items-center gap-1">
            <PlusIcon width={18} height={18} />
            <span>Text</span>
          </div>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <BookMenu book={book} />
      </div>

    </div>
  )
}

export default BookToolbar