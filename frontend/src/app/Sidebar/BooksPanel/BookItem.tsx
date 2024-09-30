import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "@components/ui/context-menu"
import { useEventBus } from "@hooks/events"
import { AddBook, AddTab, RemoveBook, SelectTab, UpdateBookTitle } from "@hooks/store"
import { books } from "@lib/wailsjs/go/models"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import SidebarItem from "../SidebarItem"


interface BookItemProps {
  book: books.Book
  selected?: boolean

  children?: React.ReactNode | React.ReactNode[]
}


const BookItem: FC<BookItemProps> = ({ book, selected, children }) => {
  async function handleTitleChange(title: string) {
    await UpdateBookTitle(book.id, title)
  }

  return (
    <BookItemMenu book={book}>
      <SidebarItem
        itemId={book.id}
        title={book.title}
        selected={selected}
        onSelected={SelectTab}
        onTextChange={handleTitleChange}
      />
    </BookItemMenu>

  )
}

interface BookItemMenuProps {
  book: books.Book
  children?: React.ReactNode | React.ReactNode[]
}

const BookItemMenu: FC<BookItemMenuProps> = ({ book, children }) => {
  const { t } = useTranslation()

  const events = useEventBus()

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <ContextMenuItem inset onClick={() => {
          AddTab(book.id)
          SelectTab(book.id)
        }}>
          <span className="text-xs">{t("openNewTab", "Open in new tab")}</span>
        </ContextMenuItem>
        {/* <ContextMenuItem inset>
          <span className="text-xs">{t("openNewWindow", "Open in new window")}</span>
        </ContextMenuItem> */}
        <ContextMenuSeparator />
        <ContextMenuItem inset onClick={async () => {
          AddBook({
            title: `${book.title} copy`,
            cells: book.cells,
          })
        }}>
          <span className="text-xs">{t("makeACopy", "Make a Copy")}</span>
        </ContextMenuItem>
        {/* <ContextMenuItem inset>
          <span className="text-xs">{t("moveBookTo", "Move book to...")}</span>
        </ContextMenuItem> */}
        {/* <ContextMenuItem inset>
          <span className="text-xs">{t("bookmark", "Bookmark...")}</span>
        </ContextMenuItem> */}
        {/* <ContextMenuItem inset>
          <span className="text-xs">{t("mergeWith", "Merge with...")}</span>
        </ContextMenuItem> */}
        <ContextMenuSeparator />
        <ContextMenuItem inset onClick={() => events.emit("sidebar.item.rename", book.id)}>
          <span className="text-xs">{t("rename", "Rename")}</span>
        </ContextMenuItem>
        <ContextMenuItem inset onClick={() =>
          RemoveBook(book.id)
        }>
          <span className="text-xs">{t("delete", "Delete")}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu >
  )
}


export default BookItem