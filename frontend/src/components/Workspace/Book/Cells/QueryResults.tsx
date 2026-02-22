import { Box, Flex, Spinner, Table, Text } from "@chakra-ui/react"
import { useAtomValue } from "jotai"
import { FC, useState } from "react"
import { resultsAtom } from "@/store"
import type { QueryResult } from "@/store/types"
import { DisplayType } from "@/bindings/github.com/sequelbook/sequelbook/core/executor/models"
import ResultToolbar from "./ResultToolbar"

interface QueryResultsProps {
  blockId: string
  bookId: string
  chapterId: string
  sectionId: string
  loading?: boolean
  error?: string | null
}

const QueryResults: FC<QueryResultsProps> = ({ blockId, bookId, chapterId, sectionId, loading, error }) => {
  const results = useAtomValue(resultsAtom)
  const [collapsed, setCollapsed] = useState(false)

  if (loading) {
    return (
      <Flex align="center" justify="center" py={6} gap={2}>
        <Spinner size="sm" />
        <Text fontSize="sm" color="fg.muted">Running query...</Text>
      </Flex>
    )
  }

  if (error) {
    return (
      <Box px={3} py={2} bg="red.subtle" borderRadius="md" mx={1} my={2}>
        <Text fontSize="sm" color="red.fg">{error}</Text>
      </Box>
    )
  }

  const result: QueryResult | undefined = results[blockId]
  if (!result) return null

  const { columns, rows, meta, total } = result
  if (rows.length === 0 && total === 0) {
    return (
      <Flex align="center" justify="center" py={4} direction="column" gap={1}>
        <Text fontSize="sm" color="fg.muted">
          Query completed — 0 rows returned
        </Text>
        {meta && (
          <Text fontSize="xs" color="fg.subtle">
            {meta.commandTag} in {formatDuration(meta.duration)}
          </Text>
        )}
      </Flex>
    )
  }

  return (
    <Box borderTopWidth="1px" borderColor="border" overflow="hidden" data-focus-zone="results">
      {/* Pagination toolbar */}
      {total > 0 && (
        <ResultToolbar
          blockId={blockId}
          bookId={bookId}
          chapterId={chapterId}
          sectionId={sectionId}
          result={result}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
        />
      )}

      {/* Data table */}
      {!collapsed && (
      <Box overflowX="auto">
        <Table.Root size="sm" variant="outline" stickyHeader>
          <Table.Header>
            <Table.Row>
              {columns.map((col, i) => (
                <Table.ColumnHeader
                  key={i}
                  fontSize="xs"
                  fontWeight="semibold"
                  whiteSpace="nowrap"
                  textAlign={isNumeric(col.displayType) ? "right" : "left"}
                >
                  {col.name}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((row, ri) => (
              <Table.Row key={ri}>
                {row.map((cell, ci) => (
                  <Table.Cell
                    key={ci}
                    fontSize="xs"
                    whiteSpace="nowrap"
                    maxWidth="300px"
                    truncate
                    textAlign={isNumeric(columns[ci]?.displayType) ? "right" : "left"}
                    fontFamily={isCode(columns[ci]?.displayType) ? "mono" : undefined}
                    color={cell === null ? "fg.subtle" : undefined}
                  >
                    {formatCell(cell)}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
      )}

      {/* Footer: stats */}
      {!collapsed && (
      <Flex
        align="center"
        px={3}
        py={1.5}
        bg="bg.subtle"
        borderTopWidth="1px"
        borderColor="border"
      >
        <Text fontSize="xs" color="fg.subtle">
          {meta.rowCount} row{meta.rowCount !== 1 ? "s" : ""} &middot;{" "}
          {formatDuration(meta.duration)}
          {meta.commandTag ? ` · ${meta.commandTag}` : ""}
        </Text>
      </Flex>
      )}
    </Box>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNumeric(dt?: DisplayType | string): boolean {
  return dt === DisplayType.DisplayTypeNumber
}

function isCode(dt?: DisplayType | string): boolean {
  return (
    dt === DisplayType.DisplayTypeUUID ||
    dt === DisplayType.DisplayTypeJSON ||
    dt === DisplayType.DisplayTypeBinary
  )
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL"
  if (typeof value === "boolean") return value ? "true" : "false"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function formatDuration(ns: number): string {
  if (ns < 1_000) return `${ns}ns`
  if (ns < 1_000_000) return `${(ns / 1_000).toFixed(1)}µs`
  if (ns < 1_000_000_000) return `${(ns / 1_000_000).toFixed(1)}ms`
  return `${(ns / 1_000_000_000).toFixed(2)}s`
}

export default QueryResults
