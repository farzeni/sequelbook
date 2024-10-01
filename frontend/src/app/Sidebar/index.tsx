import { Button } from "@components/ui/button"
import { Toggle } from "@components/ui/toggle"
import { useStore } from "@hooks/store"
import { GearIcon } from '@radix-ui/react-icons'
import { SetSidebar } from "@store"
import { AlignLeft, Book, Database } from "lucide-react"
import BooksPanel from "./BooksPanel"
import ConnectionsPanel from "./ConnectionsPanel"
import CreateConnectionDialog from "./ConnectionsPanel/CreateConnection"
import ContentsPanel from "./ContentsPanel"

const Sidebar = () => {
  const sidebar = useStore((state) => state.editor.sidebar)

  return (
    <div className={`${!!sidebar ? "w-[280px] border-r" : ""}  h-full  bg-gray-50`}>
      <div className="flex h-full">
        <div className="w-[46px] h-full flex flex-col items-center border-r py-2 gap-2 justify-between">
          <div
            className="flex-col flex gap-2 items-center"
          >
            <Toggle onClick={() => SetSidebar("contents")}>
              <AlignLeft width={18} height={18} />
            </Toggle>
            <Toggle onClick={() => SetSidebar("books")}>
              <Book width={18} height={18} />
            </Toggle>
            <Toggle onClick={() => SetSidebar("connections")}>
              <Database width={18} height={24} />
            </Toggle>
          </div>

          <div style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}>
            <Button variant="ghost" size="icon">
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