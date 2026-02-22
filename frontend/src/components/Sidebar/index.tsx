import { Box, Flex, IconButton, Separator } from "@chakra-ui/react"
import { useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"
import { LuAlignLeft, LuBook, LuDatabase, LuSettings } from "react-icons/lu"
import SettingsDialog from "../Settings/SettingsDialog"
import { editorAtom, selectSidebarAtom } from "../../store"
import type { SidebarSection } from "../../store"
import BooksPanel from "./BooksPanel"
import ConnectionsPanel from "./ConnectionsPanel"
import ContentsPanel from "./ContentsPanel"

const ICON_SIZE = "18px"

const SECTIONS: { section: SidebarSection; icon: React.ReactNode; label: string }[] = [
  { section: "books", icon: <LuBook size={ICON_SIZE} />, label: "Books" },
  { section: "connections", icon: <LuDatabase size={ICON_SIZE} />, label: "Connections" },
  { section: "contents", icon: <LuAlignLeft size={ICON_SIZE} />, label: "Contents" },
]

export default function Sidebar() {
  const editor = useAtomValue(editorAtom)
  const selectSidebar = useSetAtom(selectSidebarAtom)
  const activeSidebar = editor.sidebar
  const panelOpen = activeSidebar !== null
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <Flex
      height="100%"
      overflow="hidden"
      borderRightWidth={panelOpen ? "1px" : "0"}
      borderColor="border"
      data-focus-zone="sidebar"
    >
      {/* Icon bar — 48px fixed strip */}
      <Flex
        direction="column"
        align="center"
        justify="space-between"
        width="48px"
        minWidth="48px"
        height="100%"
        borderRightWidth="1px"
        borderColor="border"
        py={2}
        gap={1}
        style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
      >
        {/* Top section toggles */}
        <Flex direction="column" gap={1}>
          {SECTIONS.map(({ section, icon, label }) => (
            <IconButton
              key={section}
              aria-label={label}
              variant={activeSidebar === section ? "subtle" : "ghost"}
              size="sm"
              onClick={() => selectSidebar(section)}
              colorPalette={activeSidebar === section ? "blue" : "gray"}
            >
              {icon}
            </IconButton>
          ))}
        </Flex>

        {/* Bottom settings button */}
        <IconButton
          aria-label="Settings"
          variant="ghost"
          size="sm"
          colorPalette="gray"
          onClick={() => setSettingsOpen(true)}
        >
          <LuSettings size={ICON_SIZE} />
        </IconButton>
      </Flex>

      {/* Panel area — only visible when a section is active */}
      {panelOpen && (
        <Box flex="1" overflow="hidden" height="100%">
          {activeSidebar === "books" && <BooksPanel />}
          {activeSidebar === "connections" && <ConnectionsPanel />}
          {activeSidebar === "contents" && <ContentsPanel />}
        </Box>
      )}

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Flex>
  )
}
