import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "@components/ui/context-menu"
import { AddBook, AddTab, RemoveBook, SetSelectedBook, UpdateBookTitle, useStore } from "@hooks/store"
import { books } from "@lib/wailsjs/go/models"
import { Dot } from "lucide-react"
import { FC, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

const RENAME_DELAY = 180



interface BookTitle {
  title: string
  editMode: boolean
  className?: string
  dot: boolean
  onChange: (title: string) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}

const BookTitle: FC<BookTitle> = ({ title, editMode, dot, className, onChange, onBlur }) => {
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
    <div className="flex items-center py-1">
      <div className={`pl-4 text-xs text-gray-500 ${className}`}>{title}</div>
      {dot && <Dot color="#999" size={16} />}

    </div>
  )
}

interface BookItemMenuProps {
  book: books.Book
  selected?: boolean
  children?: React.ReactNode | React.ReactNode[]
}


const BookItemMenu: FC<BookItemMenuProps> = ({ book, selected }) => {
  const { t } = useTranslation()
  const [editMode, setEditMode] = useState(false)
  const tabs = useStore((state) => state.editor.tabs)


  async function handleTitleChange(title: string) {
    await UpdateBookTitle(book.id, title)
    setEditMode(false)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={`
            ${selected ? "bg-gray-200" : ""} 
            hover:bg-gray-200 
            py-1/2
            my-1/2
            w-full 
            rounded 
            cursor-pointer 
            `}
          onClick={() => SetSelectedBook(book.id)}>
          <BookTitle
            title={book.title}
            editMode={editMode}
            dot={!!tabs[book.id]}
            onChange={handleTitleChange}
            onBlur={() => setEditMode(false)}

          />

        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <ContextMenuItem inset onClick={() => {
          AddTab(book.id)
          SetSelectedBook(book.id)
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
        <ContextMenuItem inset onClick={() => setEditMode(true)}>
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


export default BookItemMenu