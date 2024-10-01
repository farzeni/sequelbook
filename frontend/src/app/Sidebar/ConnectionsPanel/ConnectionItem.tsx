import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "@components/ui/context-menu"
import { useEventBus } from "@hooks/events"
import { connections } from "@lib/wailsjs/go/models"
import { AddTab, RemoveConnection, SelectTab } from "@store"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import SidebarItem from "../SidebarItem"


interface ConnectionItemProps {
  connection: connections.Connection
  selected?: boolean

  children?: React.ReactNode | React.ReactNode[]
}


const ConnectionItem: FC<ConnectionItemProps> = ({ connection, selected, children }) => {
  async function handleTitleChange(title: string) {
    // await UpdateBookTitle(connection.id, title)
  }

  return (
    <ConnectionItemMenu connection={connection}>
      <SidebarItem
        itemId={connection.id}
        title={connection.name}
        selected={selected}
        onSelected={SelectTab}
        onTextChange={handleTitleChange}
      />
    </ConnectionItemMenu>

  )
}

interface ConnectionItemMenuProps {
  connection: connections.Connection
  children?: React.ReactNode | React.ReactNode[]
}

const ConnectionItemMenu: FC<ConnectionItemMenuProps> = ({ connection, children }) => {
  const { t } = useTranslation()

  const events = useEventBus()

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <ContextMenuItem inset onClick={() => {
          AddTab(connection.id)
          SelectTab(connection.id)
        }}>
          <span className="text-xs">{t("openNewTab", "Open in new tab")}</span>
        </ContextMenuItem>
        {/* <ContextMenuItem inset>
          <span className="text-xs">{t("openNewWindow", "Open in new window")}</span>
        </ContextMenuItem> */}
        <ContextMenuSeparator />
        <ContextMenuItem inset>
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
        <ContextMenuItem inset onClick={() => events.emit("sidebar.item.rename", connection.id)}>
          <span className="text-xs">{t("rename", "Rename")}</span>
        </ContextMenuItem>
        <ContextMenuItem inset onClick={() =>
          RemoveConnection(connection.id)
        }>
          <span className="text-xs">{t("delete", "Delete")}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu >
  )
}


export default ConnectionItem