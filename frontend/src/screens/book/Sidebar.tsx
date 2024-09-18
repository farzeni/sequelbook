import { Button } from "@/src/components/ui/button"
import { books } from "@/src/lib/wailsjs/go/models"
import { PlusIcon } from '@radix-ui/react-icons'
import { FC } from "react"


interface SidebarProps {
  book: books.Book
}

const Sidebar: FC<SidebarProps> = ({ book }) => {
  return (
    <div
      className="w-[280px] fixed h-full border-r-1 p-4">
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold" >Summary</span>
        <Button variant="outline" size="icon">
          <PlusIcon />
        </Button>
      </div>

      <div
        className="mt-4 gap flex-col"
      >
        {book.chapters.map((chapter) => (
          <span key={chapter.id}>{chapter.title}</span>
        ))}
      </div>
    </div>
  )

}

export default Sidebar