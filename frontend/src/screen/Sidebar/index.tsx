import { Button } from "@/src/components/ui/button"
import { Toggle } from "@/src/components/ui/toggle"
import { useBooks } from "@/src/hooks/books"
import { setSelectedBook, useStore } from "@/src/hooks/store"
import { ArchiveIcon, GearIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { useEffect } from "react"
import Toolbar from "./Toolbar"

const Sidebar = () => {
  const books = useStore((state) => state.books)
  const selected = useStore((state) => state.selectedBook)

  const { getBooks } = useBooks()

  useEffect(() => {
    getBooks()
  }, [])

  return (
    <div className="w-[280px] h-full border-r">
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
          {books.length > 0 ? (
            <div className="flex flex-col gap-1 w-full p-4">
              {books.map((book) => (
                <div
                  key={book.id}
                  className={`${book.id === selected?.id ? "bg-gray-200" : ""} hover:bg-gray-200 w-full rounded cursor-pointer`}
                  onClick={() => setSelectedBook(book.id)}>

                  <span className="pl-4 text-xs text-gray-500">{book.title}</span>
                </div>
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