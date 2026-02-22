import { BlockType } from "@/bindings/github.com/sequelbook/sequelbook/core/book/models"
import {
  addBlockAtom,
  addBookAtom,
  autoSaveAtom,
  blockFocusRegistryAtom,
  booksAtom,
  cancelQueryAtom,
  closeTabAtom,
  currentBookAtom,
  currentTabAtom,
  duplicateBlockAtom,
  editorAtom,
  executeBlockAtom,
  moveBlockAtom,
  removeBlockAtom,
  saveSettingsAtom,
  selectBlockAtom,
  selectSidebarAtom,
  settingsAtom,
} from "@/store"
import type { ActionDef, ActionStore } from "./types"

/**
 * Resolve the focused block's location from the current tab + book state.
 * Returns null if there is no focused block.
 */
function resolveBlockContext(store: ActionStore) {
  const tab = store.get(currentTabAtom)
  if (!tab || tab.type !== "book" || !tab.blockId) return null

  const books = store.get(booksAtom)
  const ob = books[tab.bookId]
  if (!ob?.book) return null

  for (const chapter of ob.book.chapters) {
    for (const section of chapter.sections) {
      const block = section.blocks.find((b) => b.id === tab.blockId)
      if (block) {
        return {
          bookId: tab.bookId,
          chapterId: chapter.id,
          sectionId: section.id,
          blockId: block.id,
          blockType: block.type,
          blockIndex: section.blocks.indexOf(block),
          blockCount: section.blocks.length,
        }
      }
    }
  }
  return null
}

// ─── Action definitions ──────────────────────────────────────────────────────

export const actions: ActionDef[] = [
  // ── Global ──────────────────────────────────────────────────────────────────

  {
    id: "save-book",
    label: "Save Book",
    description: "Save all modified books to disk",
    scope: "global",
    defaultKey: "Ctrl+S",
    execute: ({ set }) => {
      set(autoSaveAtom)
    },
  },

  {
    id: "close-tab",
    label: "Close Tab",
    description: "Close the current tab",
    scope: "global",
    defaultKey: "Ctrl+W",
    when: (ctx) => ctx.hasActiveTab,
    execute: ({ get, set }) => {
      const tabId = get(editorAtom).current.tabId
      if (tabId) set(closeTabAtom, tabId)
    },
  },

  {
    id: "new-book",
    label: "New Book",
    description: "Create a new untitled book",
    scope: "global",
    defaultKey: "Ctrl+Alt+N",
    execute: ({ set }) => {
      set(addBookAtom)
    },
  },

  {
    id: "toggle-sidebar",
    label: "Toggle Sidebar",
    description: "Show or hide the sidebar panel",
    scope: "global",
    defaultKey: "Ctrl+B",
    execute: ({ get, set }) => {
      const current = get(editorAtom).sidebar
      set(selectSidebarAtom, current === null ? "books" : null)
    },
  },

  {
    id: "increase-font-size",
    label: "Increase Font Size",
    description: "Increase the base font size",
    scope: "global",
    defaultKey: "Ctrl+=",
    execute: ({ get, set }) => {
      const current = get(settingsAtom).fontSize ?? 14
      const next = Math.min(24, current + 1)
      if (next !== current) set(saveSettingsAtom, { fontSize: next })
    },
  },

  {
    id: "decrease-font-size",
    label: "Decrease Font Size",
    description: "Decrease the base font size",
    scope: "global",
    defaultKey: "Ctrl+-",
    execute: ({ get, set }) => {
      const current = get(settingsAtom).fontSize ?? 14
      const next = Math.max(10, current - 1)
      if (next !== current) set(saveSettingsAtom, { fontSize: next })
    },
  },

  // ── Editor (block-level) ────────────────────────────────────────────────────

  {
    id: "execute-block",
    label: "Execute Block",
    description: "Run the SQL in the current code block",
    scope: "editor",
    defaultKey: "Ctrl+Enter",
    when: (ctx) => ctx.activeBlockType === "query",
    execute: ({ get, set }) => {
      const ctx = resolveBlockContext({ get, set })
      if (!ctx) return
      set(executeBlockAtom, {
        bookId: ctx.bookId,
        chapterId: ctx.chapterId,
        sectionId: ctx.sectionId,
        blockId: ctx.blockId,
      })
    },
  },

  {
    id: "cancel-query",
    label: "Cancel Query",
    description: "Cancel the running query in the current block",
    scope: "editor",
    defaultKey: "Ctrl+Shift+C",
    when: (ctx) => ctx.activeBlockType === "query",
    execute: ({ get, set }) => {
      const ctx = resolveBlockContext({ get, set })
      if (!ctx) return
      set(cancelQueryAtom, ctx.blockId)
    },
  },

  {
    id: "move-block-up",
    label: "Move Block Up",
    description: "Move the current block up in the section",
    scope: "editor",
    defaultKey: "Alt+Shift+ArrowUp",
    execute: ({ get, set }) => {
      const ctx = resolveBlockContext({ get, set })
      if (!ctx || ctx.blockIndex === 0) return
      set(moveBlockAtom, {
        bookId: ctx.bookId,
        chapterId: ctx.chapterId,
        sectionId: ctx.sectionId,
        blockId: ctx.blockId,
        direction: "up",
      })
    },
  },

  {
    id: "move-block-down",
    label: "Move Block Down",
    description: "Move the current block down in the section",
    scope: "editor",
    defaultKey: "Alt+Shift+ArrowDown",
    execute: ({ get, set }) => {
      const ctx = resolveBlockContext({ get, set })
      if (!ctx || ctx.blockIndex >= ctx.blockCount - 1) return
      set(moveBlockAtom, {
        bookId: ctx.bookId,
        chapterId: ctx.chapterId,
        sectionId: ctx.sectionId,
        blockId: ctx.blockId,
        direction: "down",
      })
    },
  },

  {
    id: "duplicate-block",
    label: "Duplicate Block",
    description: "Duplicate the current block below",
    scope: "editor",
    defaultKey: "Ctrl+Shift+D",
    execute: ({ get, set }) => {
      const ctx = resolveBlockContext({ get, set })
      if (!ctx) return
      set(duplicateBlockAtom, {
        bookId: ctx.bookId,
        chapterId: ctx.chapterId,
        sectionId: ctx.sectionId,
        blockId: ctx.blockId,
      })
    },
  },

  {
    id: "delete-block",
    label: "Delete Block",
    description: "Remove the current block",
    scope: "editor",
    defaultKey: "Ctrl+Shift+Backspace",
    execute: ({ get, set }) => {
      const ctx = resolveBlockContext({ get, set })
      if (!ctx) return
      set(removeBlockAtom, {
        bookId: ctx.bookId,
        chapterId: ctx.chapterId,
        sectionId: ctx.sectionId,
        blockId: ctx.blockId,
      })
    },
  },

  {
    id: "add-code-block-below",
    label: "Add Code Block Below",
    description: "Insert a new SQL block below the current block",
    scope: "editor",
    defaultKey: "Ctrl+Shift+Q",
    execute: ({ get, set }) => {
      const ctx = resolveBlockContext({ get, set })
      if (ctx) {
        set(addBlockAtom, {
          bookId: ctx.bookId,
          chapterId: ctx.chapterId,
          sectionId: ctx.sectionId,
          type: BlockType.BlockQuery,
          position: ctx.blockIndex + 1,
        })
      } else {
        const book = get(currentBookAtom)
        if (!book?.book) return
        const ch = book.book.chapters[0]
        const sec = ch?.sections[0]
        if (!ch || !sec) return
        set(addBlockAtom, {
          bookId: book.book.id,
          chapterId: ch.id,
          sectionId: sec.id,
          type: BlockType.BlockQuery,
        })
      }
    },
  },

  {
    id: "add-text-block-below",
    label: "Add Text Block Below",
    description: "Insert a new markdown block below the current block",
    scope: "editor",
    defaultKey: "Ctrl+Shift+M",
    execute: ({ get, set }) => {
      const ctx = resolveBlockContext({ get, set })
      if (ctx) {
        set(addBlockAtom, {
          bookId: ctx.bookId,
          chapterId: ctx.chapterId,
          sectionId: ctx.sectionId,
          type: BlockType.BlockMarkdown,
          position: ctx.blockIndex + 1,
        })
      } else {
        const book = get(currentBookAtom)
        if (!book?.book) return
        const ch = book.book.chapters[0]
        const sec = ch?.sections[0]
        if (!ch || !sec) return
        set(addBlockAtom, {
          bookId: book.book.id,
          chapterId: ch.id,
          sectionId: sec.id,
          type: BlockType.BlockMarkdown,
        })
      }
    },
  },

  {
    id: "focus-next-block",
    label: "Focus Next Block",
    description: "Move focus to the block below",
    scope: "editor",
    defaultKey: "Ctrl+ArrowDown",
    execute: ({ get, set }) => {
      const tab = get(currentTabAtom)
      if (!tab || tab.type !== "book") return

      const ctx = resolveBlockContext({ get, set })
      const books = get(booksAtom)
      const ob = books[tab.bookId]
      if (!ob?.book) return

      const ch = ob.book.chapters[0]
      const sec = ch?.sections[0]
      const blocks = sec?.blocks ?? []
      if (blocks.length === 0) return

      const currentIndex = ctx ? ctx.blockIndex : -1
      const nextIndex = Math.min(currentIndex + 1, blocks.length - 1)
      if (nextIndex === currentIndex) return

      const nextBlock = blocks[nextIndex]
      set(selectBlockAtom, { tabId: tab.id, blockId: nextBlock.id })

      const registry = get(blockFocusRegistryAtom)
      registry[nextBlock.id]?.()
    },
  },

  {
    id: "focus-prev-block",
    label: "Focus Previous Block",
    description: "Move focus to the block above",
    scope: "editor",
    defaultKey: "Ctrl+ArrowUp",
    execute: ({ get, set }) => {
      const tab = get(currentTabAtom)
      if (!tab || tab.type !== "book") return

      const ctx = resolveBlockContext({ get, set })
      const books = get(booksAtom)
      const ob = books[tab.bookId]
      if (!ob?.book) return

      const ch = ob.book.chapters[0]
      const sec = ch?.sections[0]
      const blocks = sec?.blocks ?? []
      if (blocks.length === 0) return

      const currentIndex = ctx ? ctx.blockIndex : blocks.length
      const prevIndex = Math.max(currentIndex - 1, 0)
      if (prevIndex === currentIndex) return

      const prevBlock = blocks[prevIndex]
      set(selectBlockAtom, { tabId: tab.id, blockId: prevBlock.id })

      const registry = get(blockFocusRegistryAtom)
      registry[prevBlock.id]?.()
    },
  },
]

/** Lookup table for O(1) access by action ID. */
export const actionMap = new Map(actions.map((a) => [a.id, a]))
