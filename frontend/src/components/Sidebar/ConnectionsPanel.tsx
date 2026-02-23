import { Box, Circle, Flex, IconButton, Menu, Text } from "@chakra-ui/react"
import { useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"
import {
  LuDatabase,
  LuEllipsis,
  LuPencil,
  LuPlug,
  LuPlug2,
  LuPlus,
  LuTrash2,
} from "react-icons/lu"
import type { ConnectionEntry } from "@/bindings/github.com/sequelbook/sequelbook/core/settings/models"
import {
  activeEntryIdAtom,
  connectAtom,
  connectionsAtom,
  connectionStatusAtom,
  disconnectAtom,
  openInTabAtom,
  removeConnectionAtom,
} from "@/store"
import type { ConnectionState } from "@/store/types"
import CreateConnectionDialog from "./CreateConnectionDialog"

// ─── Status indicator ─────────────────────────────────────────────────────────

interface StatusDotProps {
  state: ConnectionState
}

function StatusDot({ state }: StatusDotProps) {
  const color =
    state === "connected"
      ? "green.500"
      : state === "connecting"
        ? "yellow.400"
        : state === "error"
          ? "red.500"
          : "transparent"

  if (state === "disconnected") return null

  return <Circle size="7px" bg={color} flexShrink={0} />
}

// ─── Connection row ───────────────────────────────────────────────────────────

interface ConnectionRowProps {
  entry: ConnectionEntry
  isActive: boolean
  connectionState: ConnectionState
  onConnect: () => void
  onDisconnect: () => void
  onEdit: () => void
  onDelete: () => void
  onOpen: () => void
}

function ConnectionRow({
  entry,
  isActive,
  connectionState,
  onConnect,
  onDisconnect,
  onEdit,
  onDelete,
  onOpen,
}: ConnectionRowProps) {
  const handleRowClick = () => {
    if (isActive && connectionState === "connected") {
      onOpen()
    } else if (connectionState !== "connecting") {
      onConnect()
    }
  }

  return (
    <Flex
      align="center"
      gap={2}
      px={3}
      py={1.5}
      cursor="pointer"
      _hover={{ bg: "bg.subtle" }}
      onClick={handleRowClick}
      style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleRowClick()
      }}
    >
      <LuDatabase size={13} color="var(--chakra-colors-fg-muted)" />

      {/* Label + subtext */}
      <Flex direction="column" flex="1" minWidth={0}>
        <Text fontSize="sm" truncate>
          {entry.name || entry.database || entry.id}
        </Text>
        <Text fontSize="xs" color="fg.subtle" truncate>
          {entry.host}:{entry.port}/{entry.database}
        </Text>
      </Flex>

      {/* Status dot (only for active connection) */}
      {isActive && <StatusDot state={connectionState} />}

      {/* Actions menu */}
      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton
            aria-label="Connection actions"
            variant="ghost"
            size="2xs"
            flexShrink={0}
            onClick={(e) => e.stopPropagation()}
          >
            <LuEllipsis size={12} />
          </IconButton>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content minWidth="160px" onClick={(e) => e.stopPropagation()}>
            {isActive && connectionState === "connected" ? (
              <Menu.Item value="disconnect" onClick={onDisconnect}>
                <LuPlug2 size={13} />
                Disconnect
              </Menu.Item>
            ) : (
              <Menu.Item value="connect" onClick={onConnect}>
                <LuPlug size={13} />
                Connect
              </Menu.Item>
            )}
            <Menu.Item value="edit" onClick={onEdit}>
              <LuPencil size={13} />
              Edit
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item value="delete" color="fg.error" onClick={onDelete}>
              <LuTrash2 size={13} />
              Delete
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
    </Flex>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function ConnectionsPanel() {
  const connections = useAtomValue(connectionsAtom)
  const connectionStatus = useAtomValue(connectionStatusAtom)
  const activeEntryId = useAtomValue(activeEntryIdAtom)
  const openInTab = useSetAtom(openInTabAtom)
  const connect = useSetAtom(connectAtom)
  const disconnect = useSetAtom(disconnectAtom)
  const removeConnection = useSetAtom(removeConnectionAtom)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<ConnectionEntry | undefined>()

  const connectionEntries = Object.values(connections).sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  function openNewDialog() {
    setEditEntry(undefined)
    setDialogOpen(true)
  }

  function openEditDialog(entry: ConnectionEntry) {
    setEditEntry(entry)
    setDialogOpen(true)
  }

  async function handleConnect(entry: ConnectionEntry) {
    try {
      await connect(entry)
      openInTab({ entityType: "connection", entityId: entry.id })
    } catch {
      // error toast handled inside connectAtom
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect()
    } catch {
      // error toast handled inside disconnectAtom
    }
  }

  async function handleDelete(id: string) {
    try {
      await removeConnection(id)
    } catch {
      // silent
    }
  }

  return (
    <Flex direction="column" height="100%" overflow="hidden">
      {/* Header */}
      <Flex
        align="center"
        justify="space-between"
        px={3}
        py={2}
        borderBottomWidth="1px"
        borderColor="border"
        minHeight="40px"
      >
        <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" color="fg.muted">
          Connections
        </Text>
        <IconButton
          aria-label="New connection"
          variant="ghost"
          size="xs"
          onClick={openNewDialog}
        >
          <LuPlus size={14} />
        </IconButton>
      </Flex>

      {/* Connection list */}
      <Box flex="1" overflowY="auto" py={1}>
        {connectionEntries.length === 0 ? (
          <Flex align="center" justify="center" height="60px">
            <Text fontSize="xs" color="fg.subtle">
              No connections yet
            </Text>
          </Flex>
        ) : (
          connectionEntries.map((entry) => {
            const isActive = entry.id === activeEntryId
            return (
              <ConnectionRow
                key={entry.id}
                entry={entry}
                isActive={isActive}
                connectionState={isActive ? connectionStatus : "disconnected"}
                onConnect={() => handleConnect(entry)}
                onDisconnect={handleDisconnect}
                onEdit={() => openEditDialog(entry)}
                onDelete={() => handleDelete(entry.id)}
                onOpen={() =>
                  openInTab({ entityType: "connection", entityId: entry.id })
                }
              />
            )
          })
        )}
      </Box>

      {/* Create / Edit dialog */}
      <CreateConnectionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editEntry={editEntry}
      />
    </Flex>
  )
}
