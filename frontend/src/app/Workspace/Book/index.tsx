import { Button } from "@components/ui/button"
import { appState } from "@hooks/store"
import { books } from "@lib/wailsjs/go/models"
import { AddCell, BookTab } from "@store"
import React, { FC, useEffect, useRef } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useSnapshot } from "valtio"
import CellsList from "./Cells"
import BookToolbar from "./Toolbar"

interface BookContentProps {
  tab: BookTab
}

const BookContent: FC<BookContentProps> = ({ tab }) => {
  const { t } = useTranslation()
  const book = useSnapshot(appState.books[tab.bookId])
  const bookContainerRef = useRef<HTMLDivElement>(null)

  console.log("BookContent", tab.bookId, book)

  useEffect(() => {
    setTimeout(() => {
      bookContainerRef.current?.scrollTo(0, 0)
    }, 0)
  }, [tab.bookId])

  if (!book) {
    return (
      <div className="flex-1 h-[calc(100vh-40px)] flex items-center justify-center bg">
        <div className="text-gray-500">No book selected</div>
      </div>
    )
  }

  return (
    <div>
      <BookToolbar book={book as books.Book} />
      <div ref={bookContainerRef} className="overflow-y-auto h-[calc(100vh-42px)]">
        {book.cells.length === 0 ? (
          <div className="flex-1 h-[calc(100vh-180px)] flex items-center justify-center bg flex-col prose dark:prose-invert mx-auto">
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
            <CellsList bookId={book.id} tab={tab} />
          </div>
        )}
      </div>
    </div >
  )
}

export default React.memo(BookContent)