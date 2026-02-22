import { Box, Button, Flex, IconButton, Spinner, Text, VStack } from "@chakra-ui/react"
import { useAtomValue, useSetAtom } from "jotai"
import { FC, useCallback, useEffect, useState } from "react"
import { LuRefreshCw, LuTable } from "react-icons/lu"
import {
  activeConnectionIdAtom,
  connectionStatusAtom,
  currentTabAtom,
  selectTableAtom,
} from "@/store"
import * as SchemaService from "@/bindings/github.com/sequelbook/sequelbook/bindings/schemaservice"
import type { Table as SchemaTable } from "@/bindings/github.com/sequelbook/sequelbook/core/schema/models"

interface TableListProps {
  connectionId: string
  selectedTable: string | null
}

const TableList: FC<TableListProps> = ({ connectionId, selectedTable }) => {
  const activeConnId = useAtomValue(activeConnectionIdAtom)
  const status = useAtomValue(connectionStatusAtom)
  const currentTab = useAtomValue(currentTabAtom)
  const selectTable = useSetAtom(selectTableAtom)

  const [tables, setTables] = useState<SchemaTable[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTables = useCallback(async () => {
    if (!activeConnId || status !== "connected") return
    setLoading(true)
    setError(null)
    try {
      const result = await SchemaService.ListTables(activeConnId, "")
      setTables(result ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tables")
    } finally {
      setLoading(false)
    }
  }, [activeConnId, status])

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  if (status !== "connected") {
    return (
      <Flex align="center" justify="center" height="100%" p={4}>
        <Text fontSize="sm" color="fg.subtle">
          Connect to browse tables
        </Text>
      </Flex>
    )
  }

  // Group by schema (use schema or "default" for SQLite)
  const grouped = tables.reduce<Record<string, SchemaTable[]>>((acc, t) => {
    const schema = t.schema || "main"
    ;(acc[schema] ??= []).push(t)
    return acc
  }, {})

  return (
    <Flex direction="column" height="100%" overflow="hidden">
      {/* Header */}
      <Flex
        align="center"
        px={3}
        py={2}
        borderBottomWidth="1px"
        borderColor="border"
        gap={2}
      >
        <Text fontSize="xs" fontWeight="semibold" flex="1">
          Tables
        </Text>
        <IconButton
          aria-label="Refresh"
          size="xs"
          variant="ghost"
          onClick={fetchTables}
          disabled={loading}
        >
          <LuRefreshCw size={12} />
        </IconButton>
      </Flex>

      {/* Content */}
      <Box flex="1" overflowY="auto">
        {loading && (
          <Flex align="center" justify="center" py={6}>
            <Spinner size="sm" />
          </Flex>
        )}

        {error && (
          <Box px={3} py={2}>
            <Text fontSize="xs" color="red.fg">{error}</Text>
            <Button size="xs" variant="ghost" mt={1} onClick={fetchTables}>
              Retry
            </Button>
          </Box>
        )}

        {!loading && !error && tables.length === 0 && (
          <Flex align="center" justify="center" py={6}>
            <Text fontSize="xs" color="fg.subtle">No tables found</Text>
          </Flex>
        )}

        {!loading &&
          Object.entries(grouped).map(([schema, entries]) => (
            <Box key={schema}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="fg.subtle"
                px={3}
                py={1}
                bg="bg.subtle"
              >
                {schema}
              </Text>
              <VStack gap={0} align="stretch">
                {entries.map((t) => {
                  const fullName = t.schema ? `${t.schema}.${t.name}` : t.name
                  const isSelected = selectedTable === fullName
                  return (
                    <Flex
                      key={fullName}
                      align="center"
                      gap={2}
                      px={3}
                      py={1.5}
                      cursor="pointer"
                      bg={isSelected ? "bg.emphasized" : undefined}
                      _hover={{ bg: isSelected ? "bg.emphasized" : "bg.subtle" }}
                      onClick={() => {
                        if (currentTab) selectTable({ tabId: currentTab.id, table: fullName })
                      }}
                    >
                      <LuTable size={12} color="var(--chakra-colors-fg-muted)" />
                      <Text fontSize="xs" truncate>
                        {t.name}
                      </Text>
                    </Flex>
                  )
                })}
              </VStack>
            </Box>
          ))}
      </Box>
    </Flex>
  )
}

export default TableList
