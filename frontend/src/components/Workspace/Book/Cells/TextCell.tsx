import { Box, Flex, IconButton } from "@chakra-ui/react"
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
} from "@mdxeditor/editor"
import "@mdxeditor/editor/style.css"
import { useSetAtom } from "jotai"
import { FC, useCallback, useEffect, useRef } from "react"
import { LuArrowDown, LuArrowUp, LuCopy, LuTrash2 } from "react-icons/lu"
import {
  duplicateBlockAtom,
  moveBlockAtom,
  removeBlockAtom,
  registerBlockFocusAtom,
  selectBlockAtom,
  unregisterBlockFocusAtom,
  updateBlockAtom,
} from "@/store"
import type { Block } from "@/store/types"

interface TextCellProps {
  block: Block
  bookId: string
  chapterId: string
  sectionId: string
  tabId?: string
}

const TextCell: FC<TextCellProps> = ({ block, bookId, chapterId, sectionId, tabId }) => {
  const updateBlock = useSetAtom(updateBlockAtom)
  const removeBlock = useSetAtom(removeBlockAtom)
  const moveBlock = useSetAtom(moveBlockAtom)
  const duplicateBlock = useSetAtom(duplicateBlockAtom)
  const selectBlock = useSetAtom(selectBlockAtom)
  const registerFocus = useSetAtom(registerBlockFocusAtom)
  const unregisterFocus = useSetAtom(unregisterBlockFocusAtom)

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleFocus = useCallback(() => {
    if (tabId) selectBlock({ tabId, blockId: block.id })
  }, [tabId, block.id, selectBlock])

  useEffect(() => {
    registerFocus({
      blockId: block.id,
      focus: () => {
        const editable = containerRef.current?.querySelector<HTMLElement>(
          '[contenteditable="true"]'
        )
        editable?.focus()
      },
    })
    return () => {
      unregisterFocus(block.id)
    }
  }, [block.id, registerFocus, unregisterFocus])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleChange = (md: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateBlock({ bookId, chapterId, sectionId, blockId: block.id, content: md })
    }, 300)
  }

  return (
    <Box
      ref={containerRef}
      position="relative"
      borderWidth="1px"
      borderColor="transparent"
      borderRadius="md"
      mb={2}
      onFocusCapture={handleFocus}
      css={{
        "&:focus-within": { borderColor: "var(--chakra-colors-border)" },
        "&:focus-within .text-cell-actions": { opacity: 1, pointerEvents: "auto" },
      }}
    >
      {/* Floating action buttons — visible only on focus */}
      <Flex
        className="text-cell-actions"
        position="absolute"
        top="6px"
        right="6px"
        zIndex={1}
        gap={0.5}
        bg="bg.subtle"
        borderRadius="md"
        px={1}
        py={0.5}
        opacity={0}
        pointerEvents="none"
        transition="opacity 0.15s"
      >
        <IconButton
          aria-label="Duplicate"
          size="xs"
          variant="ghost"
          onClick={() =>
            duplicateBlock({ bookId, chapterId, sectionId, blockId: block.id })
          }
        >
          <LuCopy size={12} />
        </IconButton>
        <IconButton
          aria-label="Move up"
          size="xs"
          variant="ghost"
          onClick={() =>
            moveBlock({ bookId, chapterId, sectionId, blockId: block.id, direction: "up" })
          }
        >
          <LuArrowUp size={12} />
        </IconButton>
        <IconButton
          aria-label="Move down"
          size="xs"
          variant="ghost"
          onClick={() =>
            moveBlock({ bookId, chapterId, sectionId, blockId: block.id, direction: "down" })
          }
        >
          <LuArrowDown size={12} />
        </IconButton>
        <IconButton
          aria-label="Delete"
          size="xs"
          variant="ghost"
          colorPalette="red"
          onClick={() =>
            removeBlock({ bookId, chapterId, sectionId, blockId: block.id })
          }
        >
          <LuTrash2 size={12} />
        </IconButton>
      </Flex>

      {/* MDXEditor content area */}
      <MDXEditor
        key={block.id}
        className="dark-theme mdx-cell"
        markdown={block.content}
        onChange={handleChange}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
        ]}
        contentEditableClassName="mdx-cell-content"
        placeholder="Write markdown here..."
      />
    </Box>
  )
}

export default TextCell
