import { navigatePageAtom, updateBlockPageSizeAtom } from "@/store"
import type { QueryResult } from "@/store/types"
import { Button, Flex, NativeSelect, Spinner, Text } from "@chakra-ui/react"
import { useSetAtom } from "jotai"
import { FC, useState } from "react"
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuChevronUp } from "react-icons/lu"

const PAGE_SIZE_OPTIONS = [50, 100, 200, 500] as const

function getPageSizeOptions(current: number): number[] {
  const set = new Set([...PAGE_SIZE_OPTIONS, current])
  return [...set].sort((a, b) => a - b)
}

interface ResultToolbarProps {
  blockId: string
  bookId: string
  chapterId: string
  sectionId: string
  result: QueryResult
  collapsed: boolean
  onToggleCollapsed: () => void
}

function formatNumber(n: number): string {
  return n.toLocaleString()
}

const ResultToolbar: FC<ResultToolbarProps> = ({
  blockId,
  bookId,
  chapterId,
  sectionId,
  result,
  collapsed,
  onToggleCollapsed,
}) => {
  const navigatePage = useSetAtom(navigatePageAtom)
  const updateBlockPageSize = useSetAtom(updateBlockPageSizeAtom)
  const [paginating, setPaginating] = useState(false)

  const { resultId, offset, total, pageSize, hasMore } = result
  const hasPrev = offset > 0
  const start = offset + 1
  const end = Math.min(offset + pageSize, total)

  async function handlePrev() {
    if (!hasPrev || paginating) return
    setPaginating(true)
    try {
      await navigatePage({
        blockId,
        resultId,
        offset: Math.max(0, offset - pageSize),
        pageSize,
      })
    } finally {
      setPaginating(false)
    }
  }

  async function handleNext() {
    if (!hasMore || paginating) return
    setPaginating(true)
    try {
      await navigatePage({
        blockId,
        resultId,
        offset: offset + pageSize,
        pageSize,
      })
    } finally {
      setPaginating(false)
    }
  }

  async function handlePageSizeChange(newSize: number) {
    if (newSize === pageSize || paginating) return
    setPaginating(true)
    try {
      await updateBlockPageSize({
        bookId,
        chapterId,
        sectionId,
        blockId,
        pageSize: newSize,
      })
      await navigatePage({
        blockId,
        resultId,
        offset: 0,
        pageSize: newSize,
      })
    } finally {
      setPaginating(false)
    }
  }

  return (
    <Flex
      align="center"
      gap={3}
      px={3}
      py={1.5}
      bg="bg.subtle"
      borderBottomWidth="1px"
      borderColor="border"
    >
      <Flex gap={1} align="center">
        <Button
          size="xs"
          variant="ghost"
          disabled={!hasPrev || paginating}
          onClick={handlePrev}
          aria-label="Previous page"
        >
          <LuChevronLeft size={12} />
        </Button>
        <Button
          size="xs"
          variant="ghost"
          disabled={!hasMore || paginating}
          onClick={handleNext}
          aria-label="Next page"
        >
          <LuChevronRight size={12} />
        </Button>
      </Flex>

      <Text fontSize="xs" color="fg.subtle">
        {formatNumber(start)}–{formatNumber(end)} of {formatNumber(total)}
      </Text>

      {paginating && <Spinner size="xs" />}

      <Flex align="center" gap={2} ml="auto">
        <NativeSelect.Root size="xs" width="auto" disabled={paginating}>
          <NativeSelect.Field
            value={String(pageSize)}
            onChange={(e) => handlePageSizeChange(Number((e.target as HTMLSelectElement).value))}
          >
            {getPageSizeOptions(pageSize).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <Text fontSize="xs" color="fg.subtle">
          rows/page
        </Text>
        <Button
          size="xs"
          variant="ghost"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Show results" : "Hide results"}
        >
          {collapsed ? (
            <LuChevronUp size={12} />
          ) : (
            <LuChevronDown size={12} />
          )}
        </Button>
      </Flex>
    </Flex>
  )
}

export default ResultToolbar
