import { Button } from "@components/ui/button"
import { Toggle } from "@components/ui/toggle"
import { useEventBus } from "@hooks/events"
import { appState } from "@hooks/store"
import { GearIcon } from '@radix-ui/react-icons'
import { SelectSidebarSection } from "@store"
import { AlignLeft, Book, Database } from "lucide-react"
import { useSnapshot } from "valtio"
import BooksPanel from "./BooksPanel"
import ConnectionsPanel from "./ConnectionsPanel"
import CreateConnectionDialog from "./ConnectionsPanel/CreateConnection"
import ContentsPanel from "./ContentsPanel"

const Sidebar = () => {
  const sidebar = useSnapshot(appState).editor.sidebar

  const events = useEventBus()

  return (
    <div className={`${!!sidebar ? "w-[280px] border-r" : ""}  h-full bg-background-dark`}>
      <div className="flex h-full">
        <div className="w-[46px] h-full flex flex-col items-center border-r py-2 gap-2 justify-between">
          <div
            className="flex-col flex gap-2 items-center"
          >
            <Toggle onClick={() => SelectSidebarSection("books")} pressed={sidebar === "books"}>
              <Book width={18} height={18} />
            </Toggle>
            <Toggle onClick={() => SelectSidebarSection("connections")} pressed={sidebar === "connections"}>
              <Database width={18} height={24} />
            </Toggle>
            <Toggle onClick={() => SelectSidebarSection("contents")} pressed={sidebar === "contents"}>
              <AlignLeft width={18} height={18} />
            </Toggle>
          </div>

          <div style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}>
            <Button variant="ghost" size="icon" onClick={() => events.emit("settings.toggle")}>
              <GearIcon width={18} height={18} />
            </Button>
          </div>
        </div>

        {sidebar === 'contents' && <ContentsPanel />}
        {sidebar === 'books' && <BooksPanel />}
        {sidebar === 'connections' && <ConnectionsPanel />}
      </div>

      <CreateConnectionDialog />

    </div >
  )

}

export default Sidebar