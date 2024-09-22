import { Button } from "@components/ui/button"
import { Toggle } from "@components/ui/toggle"
import { useBooks } from "@hooks/books"
import { useStore } from "@hooks/store"
import { ArchiveIcon, GearIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { useEffect } from "react"
import BookItem from "./BookItem"
import Toolbar from "./Toolbar"

const Sidebar = () => {
  const books = useStore((state) => state.books)
  const selected = useStore((state) => state.editor.currentBookId)

  const { getBooks } = useBooks()


  useEffect(() => {
    getBooks()
  }, [])

  return (
    <div className="w-[280px] h-full border-r bg-gray-50">
      <div className="flex h-full">
        <div className="w-[48px] h-full flex flex-col items-center border-r py-2 gap-2 justify-between">
          <div className="flex-col flex gap-2">
            <Toggle>
              <ArchiveIcon width={18} height={18} />
            </Toggle>
            <Toggle>
              <MagnifyingGlassIcon width={18} height={24} />
            </Toggle>
          </div>

          <Button variant="ghost" size="icon">
            <GearIcon width={18} height={18} />
          </Button>
        </div>
        <div className="w-full">
          <Toolbar />
          {Object.keys(books).length > 0 ? (
            <div className="flex flex-col gap-1 w-full p-4">
              {Object.values(books).map((book) => (
                <BookItem key={book.id} book={book} selected={selected === book.id} />
              ))}
            </div>
          ) : (
            <div>
              no book
            </div>
          )}
        </div>
      </div>
    </div>
  )

}

export default Sidebar