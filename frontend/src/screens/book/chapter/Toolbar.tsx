import { Button } from "@/src/components/ui/button"
import { books } from "@/src/lib/wailsjs/go/models"
import { FC } from "react"

interface ChapterToolbarProps {
  book: books.Book
}

const ChapterToolbar: FC<ChapterToolbarProps> = ({ book }) => {
  return (
    <div className="border-b-1 p-2">
      <div className="flex gap-2">
        <Button variant="outline">Add Text</Button>
        <Button variant="outline">Add Code</Button>
      </div>
    </div>
  )
}

export default ChapterToolbar