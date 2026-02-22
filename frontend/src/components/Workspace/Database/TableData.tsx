import { Box, Flex, Spinner, Table, Text } from "@chakra-ui/react"
import { useAtomValue } from "jotai"
import { FC, useCallback, useEffect, useState } from "react"
import { LuTable } from "react-icons/lu"
import { activeConnectionIdAtom, connectionStatusAtom } from "@/store"
import * as QueryService from "@/bindings/github.com/sequelbook/sequelbook/bindings/queryservice"
import * as SchemaService from "@/bindings/github.com/sequelbook/sequelbook/bindings/schemaservice"
import type { QueryResponse } from "@/bindings/github.com/sequelbook/sequelbook/bindings/models"
import type { Column as SchemaColumn } from "@/bindings/github.com/sequelbook/sequelbook/core/schema/models"

interface TableDataProps {
  tableName: string
}

const TableData: FC<TableDataProps> = ({ tableName }) => {
  const activeConnId = useAtomValue(activeConnectionIdAtom)
  const status = useAtomValue(connectionStatusAtom)

  const [response, setResponse] = useState<QueryResponse | null>(null)
  const [structureColumns, setStructureColumns] = useState<SchemaColumn[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<"data" | "structure">("data")

  const [schema, table] = tableName.includes(".")
    ? tableName.split(".", 2)
    : ["", tableName]

  const fetchData = useCallback(async () => {
    if (!activeConnId || status !== "connected") return
    setLoading(true)
    setError(null)
    try {
      if (tab === "data") {
        const sql = await SchemaService.PreviewTableQuery(activeConnId, schema, table, 200)
        const res = await QueryService.ExecuteQuery(activeConnId, sql)
        setResponse(res)
        setStructureColumns([])
      } else {
        const columns = await SchemaService.ListColumns(activeConnId, schema, table)
        setStructureColumns(columns ?? [])
        setResponse(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed")
    } finally {
      setLoading(false)
    }
  }, [activeConnId, status, tableName, tab, schema, table])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <Flex direction="column" height="100%" overflow="hidden">
      {/* Tab bar */}
      <Flex
        gap={0}
        borderBottomWidth="1px"
        borderColor="border"
        flexShrink={0}
      >
        <TabButton label="Data" active={tab === "data"} onClick={() => setTab("data")} />
        <TabButton label="Structure" active={tab === "structure"} onClick={() => setTab("structure")} />
        <Box flex="1" />
        <Flex align="center" px={3}>
          <Text fontSize="xs" color="fg.subtle" truncate>
            {tableName}
          </Text>
        </Flex>
      </Flex>

      {/* Content */}
      <Box flex="1" overflow="auto">
        {loading && (
          <Flex align="center" justify="center" py={8}>
            <Spinner size="sm" />
          </Flex>
        )}

        {error && (
          <Box px={4} py={3}>
            <Text fontSize="sm" color="red.fg">{error}</Text>
          </Box>
        )}

        {!loading && !error && tab === "data" && response?.page && response.meta && (
          <ResultTable response={response} />
        )}

        {!loading && !error && tab === "structure" && structureColumns.length > 0 && (
          <StructureTable columns={structureColumns} />
        )}

        {!loading && !error && tab === "data" && !response?.page && (
          <Flex align="center" justify="center" py={8} direction="column" gap={2}>
            <LuTable size={24} color="var(--chakra-colors-fg-subtle)" />
            <Text fontSize="sm" color="fg.subtle">No data</Text>
          </Flex>
        )}

        {!loading && !error && tab === "structure" && structureColumns.length === 0 && !error && (
          <Flex align="center" justify="center" py={8} direction="column" gap={2}>
            <Text fontSize="sm" color="fg.subtle">No columns</Text>
          </Flex>
        )}
      </Box>
    </Flex>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TabButton: FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <Box
    as="button"
    px={4}
    py={2}
    fontSize="xs"
    fontWeight={active ? "semibold" : "normal"}
    color={active ? "fg" : "fg.muted"}
    borderBottomWidth="2px"
    borderColor={active ? "blue.solid" : "transparent"}
    onClick={onClick}
    cursor="pointer"
    _hover={{ color: "fg" }}
  >
    {label}
  </Box>
)

const ResultTable: FC<{ response: QueryResponse }> = ({ response }) => {
  const { page, meta } = response
  if (!page || !meta) return null

  return (
    <Box>
      <Table.Root size="sm" variant="outline" stickyHeader>
        <Table.Header>
          <Table.Row>
            {meta.columns.map((col, i) => (
              <Table.ColumnHeader key={i} fontSize="xs" fontWeight="semibold" whiteSpace="nowrap">
                {col.name}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {page.rows.map((row, ri) => (
            <Table.Row key={ri}>
              {row.map((cell, ci) => (
                <Table.Cell
                  key={ci}
                  fontSize="xs"
                  whiteSpace="nowrap"
                  maxWidth="300px"
                  truncate
                  color={cell === null ? "fg.subtle" : undefined}
                >
                  {cell === null || cell === undefined ? "NULL" : String(cell)}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Flex px={3} py={1.5} bg="bg.subtle" borderTopWidth="1px" borderColor="border">
        <Text fontSize="xs" color="fg.subtle">
          {meta.rowCount} row{meta.rowCount !== 1 ? "s" : ""}
          {page.hasMore ? " (truncated)" : ""}
        </Text>
      </Flex>
    </Box>
  )
}

const StructureTable: FC<{ columns: SchemaColumn[] }> = ({ columns }) => (
  <Box>
    <Table.Root size="sm" variant="outline" stickyHeader>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader fontSize="xs" fontWeight="semibold">Column</Table.ColumnHeader>
          <Table.ColumnHeader fontSize="xs" fontWeight="semibold">Type</Table.ColumnHeader>
          <Table.ColumnHeader fontSize="xs" fontWeight="semibold">Nullable</Table.ColumnHeader>
          <Table.ColumnHeader fontSize="xs" fontWeight="semibold">Default</Table.ColumnHeader>
          <Table.ColumnHeader fontSize="xs" fontWeight="semibold">Primary Key</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {columns.map((col, i) => (
          <Table.Row key={i}>
            <Table.Cell fontSize="xs" whiteSpace="nowrap">
              {col.name}
            </Table.Cell>
            <Table.Cell fontSize="xs">{col.dataType}</Table.Cell>
            <Table.Cell fontSize="xs">{col.isNullable ? "YES" : "NO"}</Table.Cell>
            <Table.Cell fontSize="xs" color="fg.subtle">
              {col.columnDefault ?? "—"}
            </Table.Cell>
            <Table.Cell fontSize="xs">{col.isPrimaryKey ? "YES" : "NO"}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>

    <Flex px={3} py={1.5} bg="bg.subtle" borderTopWidth="1px" borderColor="border">
      <Text fontSize="xs" color="fg.subtle">
        {columns.length} column{columns.length !== 1 ? "s" : ""}
      </Text>
    </Flex>
  </Box>
)

export default TableData
