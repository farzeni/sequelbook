import { Button } from "@components/ui/button"
import { AddCell, useStore } from "@hooks/store"
import { useEffect, useRef } from "react"
import { Trans, useTranslation } from "react-i18next"
import CellsList from "./Cells"
import BookToolbar from "./Toolbar"

const BookContent = () => {
  const { t } = useTranslation()
  const currentBookId = useStore((state) => state.editor.currentBookId)
  const book = useStore((state) => state.editor.currentBookId ? state.books[state.editor.currentBookId] : null)
  const bookContainerRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    setTimeout(() => {
      bookContainerRef.current?.scrollTo(0, 0)
    }, 0)
  }, [currentBookId])

  if (!book) {
    return (
      <div className="flex-1 h-[calc(100vh-40px)] flex items-center justify-center bg">
        <div className="text-gray-500">No book selected</div>
      </div>
    )
  }

  return (
    <div>
      <BookToolbar book={book} />
      <div ref={bookContainerRef} className="h-[calc(100vh-82px)] overflow-y-auto">
        {book.cells.length === 0 ? (
          <div className="flex-1 h-[calc(100vh-180px)] flex items-center justify-center bg flex-col prose mx-auto">
            <h1>{t("bookIsEmpty", "Your book is empty")}</h1>
            <div className="text-gray-500">
              <Trans key="bookIsEmptyDescription">
                Add a new cell by clicking the Add Text or Add Code button.
              </Trans>
            </div>

            <div className="flex mt-4 gap-2 flex-col">
              <Button variant="link" className="text-purple-900 text-lg" onClick={() => AddCell("text")}>
                {t("addTextCell", "Add Text Cell")}
              </Button>
              <Button variant="link" className="text-purple-900 text-lg" onClick={() => AddCell("code")}>
                {t("addCodeCell", "Add Code Cell")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-full my-4 flex flex-col gap-2 ">
            <CellsList book={book} />
          </div>
        )}
      </div>
    </div >
  )
}

export default BookContent