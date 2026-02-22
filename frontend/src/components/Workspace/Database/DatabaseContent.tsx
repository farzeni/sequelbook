import { Badge, Button, Flex, Text } from "@chakra-ui/react"
import { useAtomValue, useSetAtom } from "jotai"
import { FC } from "react"
import { LuDatabase, LuPlugZap } from "react-icons/lu"
import { Group, Panel, Separator } from "react-resizable-panels"
import {
  activeEntryIdAtom,
  connectionsAtom,
  connectionStatusAtom,
  currentTabAtom,
  disconnectAtom,
} from "@/store"
import type { ConnectionState } from "@/store/types"
import TableList from "./TableList"
import TableData from "./TableData"

function statusLabel(state: ConnectionState): string {
  switch (state) {
    case "connected":
      return "Connected"
    case "connecting":
      return "Connecting\u2026"
    case "error":
      return "Error"
    default:
      return "Disconnected"
  }
}

function statusColor(
  state: ConnectionState
): "green" | "yellow" | "red" | "gray" {
  switch (state) {
    case "connected":
      return "green"
    case "connecting":
      return "yellow"
    case "error":
      return "red"
    default:
      return "gray"
  }
}

interface DatabaseContentProps {
  connectionId: string
}

const DatabaseContent: FC<DatabaseContentProps> = ({ connectionId }) => {
  const connections = useAtomValue(connectionsAtom)
  const activeEntryId = useAtomValue(activeEntryIdAtom)
  const connectionStatus = useAtomValue(connectionStatusAtom)
  const currentTab = useAtomValue(currentTabAtom)
  const disconnect = useSetAtom(disconnectAtom)

  const entry = connections[connectionId]
  const isActive = connectionId === activeEntryId

  const state: ConnectionState = isActive ? connectionStatus : "disconnected"

  // Get selected table from the current DatabaseTab
  const selectedTable =
    currentTab?.type === "connection" ? currentTab.table : null

  async function handleDisconnect() {
    try {
      await disconnect()
    } catch {
      // silent — error is surfaced by toasts
    }
  }

  return (
    <Flex direction="column" height="100%" overflow="hidden">
      {/* Header bar */}
      <Flex
        align="center"
        gap={3}
        px={4}
        py={2}
        borderBottomWidth="1px"
        borderColor="border"
        flexShrink={0}
      >
        <LuDatabase size={15} color="var(--chakra-colors-fg-muted)" />

        <Flex direction="column" flex="1" minWidth={0}>
          <Text fontSize="sm" fontWeight="medium" truncate>
            {entry?.name || connectionId}
          </Text>
          {entry && (
            <Text fontSize="xs" color="fg.subtle" truncate>
              {entry.host}:{entry.port}/{entry.database}
            </Text>
          )}
        </Flex>

        <Badge
          colorPalette={statusColor(state)}
          variant="subtle"
          size="sm"
          flexShrink={0}
        >
          {statusLabel(state)}
        </Badge>

        {isActive && state === "connected" && (
          <Button
            variant="ghost"
            size="xs"
            colorPalette="red"
            onClick={handleDisconnect}
            flexShrink={0}
          >
            <LuPlugZap size={13} />
            Disconnect
          </Button>
        )}
      </Flex>

      {/* Body: table list + table data split */}
      {state === "connected" ? (
        <Group orientation="horizontal" style={{ flex: 1 }}>
          <Panel defaultSize={25} minSize={15}>
            <TableList
              connectionId={connectionId}
              selectedTable={selectedTable}
            />
          </Panel>
          <Separator
            style={{
              width: "1px",
              background: "var(--chakra-colors-border)",
              cursor: "col-resize",
            }}
          />
          <Panel defaultSize={75}>
            {selectedTable ? (
              <TableData tableName={selectedTable} />
            ) : (
              <Flex
                align="center"
                justify="center"
                height="100%"
                direction="column"
                gap={2}
              >
                <LuDatabase size={24} color="var(--chakra-colors-fg-subtle)" />
                <Text fontSize="sm" color="fg.subtle">
                  Select a table to browse
                </Text>
              </Flex>
            )}
          </Panel>
        </Group>
      ) : (
        <Flex
          flex="1"
          align="center"
          justify="center"
          direction="column"
          gap={2}
          px={6}
        >
          <LuDatabase size={32} color="var(--chakra-colors-fg-subtle)" />
          <Text fontSize="sm" color="fg.muted" textAlign="center">
            {state === "connecting"
              ? "Connecting..."
              : "Connect from the sidebar to browse tables"}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}

export default DatabaseContent
