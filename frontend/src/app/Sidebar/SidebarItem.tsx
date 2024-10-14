import { useEventBusListener } from "@hooks/events"
import { appState } from "@hooks/store"
import { cn } from "@lib/utils"
import { FC, useEffect, useMemo, useRef, useState } from "react"
import { useSnapshot } from "valtio"

const RENAME_DELAY = 180

interface SidebarItemTitleProps {
  title: string
  editMode: boolean
  className?: string
  dot: boolean
  onChange: (title: string) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}

const SidebarItemTitle: FC<SidebarItemTitleProps> = ({ title, editMode, dot, className, onChange, onBlur }) => {
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
      <div className={`pl-4 truncate max-w-[90%]  text-xs text-gray-500 ${className}`}>{title}</div>
      {dot && <div className={`
        w-[5px] 
        h-[5px]
        rounded-full
        bg-green-600
        ml-2
      `} />}

    </div >
  )
}

interface SidebarItemProps {
  itemId: string
  title: string
  selected?: boolean
  onSelected?: (itemId: string) => void
  onTextChange?: (title: string) => void
  children?: React.ReactNode | React.ReactNode[]
}


const SidebarItem: FC<SidebarItemProps> = ({ itemId, selected, title, onSelected, onTextChange }) => {
  const [editMode, setEditMode] = useState(false)
  const current = useSnapshot(appState.editor.current)
  const pane = useSnapshot(appState.editor.panes[current.paneId])
  const tabs = useSnapshot(appState.editor.tabs)

  useEventBusListener("sidebar.item.rename", (id: string) => {
    if (id === itemId) {
      setEditMode(true)
    }
  })

  const openEntityIds = useMemo(() => {
    if (!pane || pane.type !== 'leaf') {
      return []
    }

    const entityIds: string[] = []

    for (const tabId of pane.tabsOrder) {
      const tab = tabs[tabId]

      if (!tab) {
        continue
      }

      if (tab.type === "book") {
        entityIds.push(tab.bookId)
      }

      if (tab.type === "connection") {
        entityIds.push(tab.connectionId)
      }
    }

    return entityIds
  }, [pane])

  async function handleTitleChange(title: string) {
    onTextChange && onTextChange(title)
    setEditMode(false)
  }

  if (!pane) {
    return null
  }

  return (
    <div
      className={cn(` 
        hover:bg-gray-200 
        dark:hover:bg-gray-800
        py-1/2
        my-1/2
        max-w-[85%] 
        rounded 
        cursor-pointer 
        `,
        selected && "bg-gray-200 dark:bg-gray-800",
      )}
      onClick={() => onSelected && onSelected(itemId)}>
      <SidebarItemTitle
        title={title}
        editMode={editMode}
        dot={!!openEntityIds.includes(itemId)}
        onChange={handleTitleChange}
        onBlur={() => setEditMode(false)}

      />

    </div>

  )
}


export default SidebarItem