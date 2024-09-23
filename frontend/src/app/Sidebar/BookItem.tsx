import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger
} from "@components/ui/context-menu"
import { SetSelectedBook, UpdateBookTitle } from "@hooks/store"
import { books } from "@lib/wailsjs/go/models"
import { FC, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

const RENAME_DELAY = 180

interface BookItemProps {
  book: books.Book
  selected?: boolean
  children?: React.ReactNode | React.ReactNode[]
}

const BookContextMenu: FC<BookItemProps> = ({ book, selected }) => {
  const { t } = useTranslation()
  const [editMode, setEditMode] = useState(false)

  async function handleTitleChange(title: string) {
    await UpdateBookTitle(book.id, title)
    setEditMode(false)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={`${selected ? "bg-gray-200" : ""} hover:bg-gray-200 w-full rounded cursor-pointer`}
          onClick={() => SetSelectedBook(book.id)}>
          <BookTitle
            title={book.title}
            editMode={editMode}
            onChange={handleTitleChange}
            onBlur={() => setEditMode(false)}

          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem inset>
          {t("openNewTab", "Open in new tab")}
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          {t("openNewWindow", "Open in new window")}
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem inset>
          {t("makeACopy", "Make a Copy")}
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          {t("moveBookTo", "Move book to...")}
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          {t("bookmark", "Bookmark...")}
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          {t("mergeWith", "Merge with...")}
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem inset onClick={() => setEditMode(true)}>
          {t("rename", "Rename")}
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          {t("delete", "Delete")}
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>



      </ContextMenuContent>
    </ContextMenu >
  )
}

interface BookTitle {
  title: string
  editMode: boolean
  onChange: (title: string) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}

const BookTitle: FC<BookTitle> = ({ title, editMode, onChange, onBlur }) => {
  const [value, setValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      onChange(value)
    }
  }

  useEffect(() => {
    if (editMode) {
      setTimeout(() => {
        const input = inputRef.current;
        if (input) {
          input.focus();
          input.select();
        }
      }, RENAME_DELAY)
    }
  }, [editMode])

  useEffect(() => {
    setValue(title)
  }, [title])

  return editMode ? (
    <input
      type="text"
      ref={inputRef}
      value={value}
      onBlur={onBlur}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className="w-full bg-transparent border-0 focus:outline-none text-xs text-gray-500 pl-4"
    />
  ) : (
    <span className="pl-4 text-xs text-gray-500">{title}</span>
  )
}

export default BookContextMenu