import { Button } from "@components/ui/button"
import useDisclosure from "@hooks/disclosure"
import { useEventBusListener } from "@hooks/events"
import { AddCell, AppState, useStore } from "@hooks/store"
import { books } from "@lib/wailsjs/go/models"
import { PlusIcon } from "@radix-ui/react-icons"
import { Database } from "lucide-react"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import BookMenu from "./BookMenu"
import ConnectionSwitcher from "./Connections/Switcher"

interface BookToolbarProps {
  book: books.Book
}

const BookToolbar: FC<BookToolbarProps> = ({ book }) => {
  const { t } = useTranslation()

  const connectionDisclose = useDisclosure()

  const connection = useStore((state: AppState) => {
    const id = state.editor.tabs[book.id]?.connectionId
    if (id) {
      return state.connections[id]
    }
    return null
  })

  useEventBusListener("connections.pick", () => {
    connectionDisclose.onOpen()
  })

  return (
    <div className="flex  items-center h-[42px] justify-between relative">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={() => AddCell("code")}>
          <div className="flex items-center gap-1">
            <PlusIcon width={18} height={18} />
            <span>{t("code", "Code")}</span>
          </div>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => AddCell("text")}>
          <div className="flex items-center gap-1">
            <PlusIcon width={18} height={18} />
            <span>{t("text", "Text")}</span>
          </div>
        </Button>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
        {book.title}
      </div>

      <div className="flex items-center gap-2 mr-2">
        <Button variant="outline" size="sm" onClick={connectionDisclose.onOpen}>
          <Database width={15} height={15} className="mr-1" />
          {connection ? connection.name : t("notConnected", "Not connected")}
        </Button>

        <BookMenu book={book} />
      </div>

      <ConnectionSwitcher
        bookId={book.id}
        isOpen={connectionDisclose.isOpen}
        onOpenChange={connectionDisclose.onOpenChange}
      />
    </div>
  )
}

export default BookToolbar