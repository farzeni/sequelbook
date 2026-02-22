import { useAtomValue, useStore } from "jotai"
import { useEffect, useMemo } from "react"
import { booksAtom, currentTabAtom, editorAtom } from "@/store"
import { focusZoneAtom } from "./focus"
import { buildKeymap, resolveAction } from "./keymap"
import type { ActionContext } from "./types"
import { eventToCombo } from "./utils"

/**
 * Returns true if the keyboard event target is inside a CodeMirror or MDXEditor
 * content-editable region. These editors manage their own keymaps, so the
 * dispatcher should only intercept combos that include modifiers (Ctrl/Alt/Meta)
 * to avoid stealing normal typing and editor-internal shortcuts.
 */
function isInsideRichEditor(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement | null
  if (!target) return false

  if (target.closest(".cm-editor")) return true
  if (target.closest(".mdxeditor")) return true
  if (target.closest("[contenteditable]")) return true

  return false
}

/** True when the event has at least one "action" modifier held. */
function hasActionModifier(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.altKey || e.metaKey
}

/**
 * Mount once at the app root. Attaches a single `keydown` listener on `window`
 * that dispatches to the action registry based on the current focus zone.
 */
export function useKeyboardShortcuts() {
  const store = useStore()
  const focusZone = useAtomValue(focusZoneAtom)

  const keymap = useMemo(() => buildKeymap(), [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented) return
      if (e.repeat) return

      const inEditor = isInsideRichEditor(e)
      if (inEditor && !hasActionModifier(e)) return

      const combo = eventToCombo(e)
      const action = resolveAction(keymap, combo, focusZone)
      if (!action) return

      const currentTab = store.get(currentTabAtom)
      const books = store.get(booksAtom)
      const editor = store.get(editorAtom)

      let activeBlockType: string | null = null
      if (currentTab?.type === "book" && currentTab.blockId) {
        const ob = books[currentTab.bookId]
        if (ob?.book) {
          for (const ch of ob.book.chapters) {
            for (const sec of ch.sections) {
              const block = sec.blocks.find((b) => b.id === currentTab.blockId)
              if (block) {
                activeBlockType = block.type
                break
              }
            }
            if (activeBlockType) break
          }
        }
      }

      const ctx: ActionContext = {
        focusZone,
        activeBlockType,
        hasActiveTab: editor.current.tabId !== null,
        hasActiveBook: currentTab?.type === "book",
      }

      if (action.when && !action.when(ctx)) return

      e.preventDefault()
      e.stopPropagation()
      action.execute({ get: store.get, set: store.set })
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true })
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true })
  }, [keymap, focusZone, store])
}
