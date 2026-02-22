import { Box, Button, Flex, IconButton } from "@chakra-ui/react"
import { autocompletion } from "@codemirror/autocomplete"
import { sql, PostgreSQL, MySQL, SQLite } from "@codemirror/lang-sql"
import type { SQLDialect, SQLNamespace } from "@codemirror/lang-sql"
import { Compartment, EditorState } from "@codemirror/state"
import { oneDark } from "@codemirror/theme-one-dark"
import { EditorView, placeholder } from "@codemirror/view"
import { useAtomValue, useSetAtom } from "jotai"
import { FC, useCallback, useEffect, useRef } from "react"
import {
  LuArrowDown,
  LuArrowUp,
  LuCopy,
  LuPlay,
  LuTrash2,
} from "react-icons/lu"
import { ShortcutLabel } from "@/shortcuts"
import {
  cellStatesAtom,
  dbSchemaAtom,
  duplicateBlockAtom,
  executeBlockAtom,
  moveBlockAtom,
  registerBlockContentAtom,
  registerBlockFocusAtom,
  removeBlockAtom,
  selectBlockAtom,
  settingsAtom,
  unregisterBlockContentAtom,
  unregisterBlockFocusAtom,
  updateBlockAtom,
} from "@/store"
import type { Block } from "@/store/types"
import QueryResults from "./QueryResults"

function resolveDialect(type: string): SQLDialect {
  switch (type) {
    case "mysql": return MySQL
    case "sqlite": return SQLite
    default: return PostgreSQL
  }
}

interface CodeCellProps {
  block: Block
  bookId: string
  chapterId: string
  sectionId: string
  tabId?: string
}

const CodeCell: FC<CodeCellProps> = ({ block, bookId, chapterId, sectionId, tabId }) => {
  const updateBlock = useSetAtom(updateBlockAtom)
  const removeBlock = useSetAtom(removeBlockAtom)
  const moveBlock = useSetAtom(moveBlockAtom)
  const executeBlock = useSetAtom(executeBlockAtom)
  const duplicateBlock = useSetAtom(duplicateBlockAtom)
  const selectBlock = useSetAtom(selectBlockAtom)
  const registerFocus = useSetAtom(registerBlockFocusAtom)
  const unregisterFocus = useSetAtom(unregisterBlockFocusAtom)
  const registerContent = useSetAtom(registerBlockContentAtom)
  const unregisterContent = useSetAtom(unregisterBlockContentAtom)

  const cellState = useAtomValue(cellStatesAtom)[block.id]
  const dbSchema = useAtomValue(dbSchemaAtom)
  const settings = useAtomValue(settingsAtom)

  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sqlCompartment = useRef(new Compartment())

  const handleUpdate = useCallback(
    (content: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        updateBlock({ bookId, chapterId, sectionId, blockId: block.id, content })
      }, 300)
    },
    [bookId, chapterId, sectionId, block.id, updateBlock]
  )

  const handleFocus = useCallback(() => {
    if (tabId) selectBlock({ tabId, blockId: block.id })
  }, [tabId, block.id, selectBlock])

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      doc: block.content,
      extensions: [
        sqlCompartment.current.of(sql({
          dialect: dbSchema ? resolveDialect(dbSchema.dialect) : PostgreSQL,
          schema: dbSchema?.schema as SQLNamespace | undefined,
        })),
        autocompletion(),
        oneDark,
        placeholder("-- Write SQL here..."),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            handleUpdate(update.state.doc.toString())
          }
          if (update.focusChanged && update.view.hasFocus) {
            handleFocus()
          }
        }),
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({ state, parent: editorRef.current })
    viewRef.current = view

    registerFocus({
      blockId: block.id,
      focus: () => viewRef.current?.focus(),
    })

    registerContent({
      blockId: block.id,
      getContent: () => viewRef.current?.state.doc.toString() ?? "",
    })

    return () => {
      unregisterFocus(block.id)
      unregisterContent(block.id)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      view.destroy()
    }
    // Only create the editor once per block ID
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id])

  // Reconfigure SQL language extension when schema/dialect changes.
  useEffect(() => {
    if (!viewRef.current) return
    const dialect = dbSchema ? resolveDialect(dbSchema.dialect) : PostgreSQL
    const schema = (dbSchema?.schema ?? {}) as SQLNamespace
    viewRef.current.dispatch({
      effects: sqlCompartment.current.reconfigure(sql({ dialect, schema })),
    })
  }, [dbSchema])

  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="md"
      overflow="hidden"
      mb={2}
      css={{
        "&:hover .code-cell-actions, &:focus-within .code-cell-actions": {
          opacity: 1,
          pointerEvents: "auto",
        },
      }}
    >
      {/* Cell toolbar */}
      <Flex
        align="center"
        gap={1}
        px={2}
        py={1}
        bg="bg.subtle"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Button
          size="xs"
          variant="ghost"
          colorPalette="green"
          onClick={() =>
            executeBlock({ bookId, chapterId, sectionId, blockId: block.id })
          }
        >
          <LuPlay size={12} />
          Run
          <ShortcutLabel actionId="execute-block" />
        </Button>

        <Box flex="1" />

        <Flex
          className="code-cell-actions"
          gap={1}
          align="center"
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
      </Flex>

      {/* CodeMirror editor — padding inside .cm-content so editor background fills the block */}
      <Box
        ref={editorRef}
        css={{
          "& .cm-editor": {
            minHeight: "60px",
            fontSize: `${settings.fontSize && settings.fontSize > 0 ? settings.fontSize : 14}px`,
          },
          "& .cm-scroller": {
            padding: "12px",
          },
          "& .cm-focused": { outline: "none" },
        }}
      />

      {/* Query results */}
      <QueryResults
        blockId={block.id}
        bookId={bookId}
        chapterId={chapterId}
        sectionId={sectionId}
        loading={cellState?.status === "running"}
        error={cellState?.status === "error" ? cellState.error : null}
      />
    </Box>
  )
}

export default CodeCell
