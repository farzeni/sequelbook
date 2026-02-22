import { atom } from "jotai"
import { nanoid } from "nanoid"
import * as SettingsService from "@/bindings/github.com/sequelbook/sequelbook/bindings/settingsservice"
import { booksAtom, editorAtom } from "./atoms"
import type {
  ContentPane,
  EditorState,
  Pane,
  SidebarSection,
  SplitPane,
  Tab,
  TabType,
} from "./types"

// ─── Persistence atoms ────────────────────────────────────────────────────────

/** Persists current editor state to disk. Fire-and-forget; call after each mutation. */
export const saveEditorStateAtom = atom(null, (get, _set) => {
  const state = get(editorAtom)
  const books = get(booksAtom)

  // Enrich each BookTab with filePath so stale bookIds can be reconciled on restore.
  const enrichedTabs = Object.fromEntries(
    Object.entries(state.tabs).map(([tabId, tab]) => {
      if (tab.type === "book") {
        const ob = books[tab.bookId]
        return [tabId, { ...tab, filePath: ob?.filePath ?? tab.filePath }]
      }
      return [tabId, tab]
    })
  )

  const json = JSON.stringify({ ...state, tabs: enrichedTabs })
  SettingsService.SaveEditorState(json).catch((err) => {
    console.warn("Failed to save editor state:", err)
  })
})

/** Loads persisted editor state from disk and hydrates editorAtom. */
export const loadEditorStateAtom = atom(null, async (get, set) => {
  const raw = await SettingsService.LoadEditorState()
  if (!raw || raw.trim() === "") return

  try {
    const parsed = JSON.parse(raw) as EditorState
    if (!parsed || typeof parsed !== "object" || !parsed.panes || !parsed.tabs) return

    const books = get(booksAtom)

    // Build a filePath → current bookId map for reconciliation.
    const filePathToBookId = new Map<string, string>()
    for (const ob of Object.values(books)) {
      if (ob.filePath) filePathToBookId.set(ob.filePath, ob.book!.id)
    }

    // Replace stale bookIds using filePath when the bookId no longer exists.
    const reconciledTabs = Object.fromEntries(
      Object.entries(parsed.tabs).map(([tabId, tab]) => {
        if (tab.type === "book" && !books[tab.bookId] && tab.filePath) {
          const currentBookId = filePathToBookId.get(tab.filePath)
          if (currentBookId) {
            return [tabId, { ...tab, bookId: currentBookId }]
          }
        }
        return [tabId, tab]
      })
    )

    set(editorAtom, { ...parsed, tabs: reconciledTabs })
  } catch (err) {
    console.warn("Failed to parse persisted editor state:", err)
  }
})

// ─── Derived read atoms ───────────────────────────────────────────────────────

export const rootPaneAtom = atom<Pane | undefined>(
  (get) => {
    const editor = get(editorAtom)
    return editor.panes[editor.current.rootPaneId]
  }
)

export const currentPaneAtom = atom<Pane | undefined>(
  (get) => {
    const editor = get(editorAtom)
    return editor.panes[editor.current.paneId]
  }
)

export const currentTabAtom = atom<Tab | undefined>(
  (get) => {
    const editor = get(editorAtom)
    return editor.current.tabId
      ? editor.tabs[editor.current.tabId]
      : undefined
  }
)

// ─── Helpers (pure functions operating on EditorState) ───────────────────────

function findEntityTabInPane(
  state: EditorState,
  pane: Pane,
  entityId: string
): Tab | null {
  if (!pane || pane.type === "split") return null
  for (const tabId of pane.tabsOrder) {
    const tab = state.tabs[tabId]
    if (tab.type === "book" && tab.bookId === entityId) return tab
    if (tab.type === "connection" && tab.connectionId === entityId) return tab
  }
  return null
}

function findPaneByTabId(
  state: EditorState,
  tabId: string
): ContentPane | null {
  for (const paneId in state.panes) {
    const pane = state.panes[paneId]
    if (pane.type === "leaf" && pane.tabsOrder.includes(tabId)) {
      return pane
    }
  }
  return null
}

function findParentPane(
  state: EditorState,
  paneId: string
): SplitPane | null {
  for (const id in state.panes) {
    const pane = state.panes[id]
    if (pane.type === "split" && pane.children.includes(paneId)) {
      return pane
    }
  }
  return null
}

// ─── Write atoms ─────────────────────────────────────────────────────────────

/** Toggle or select a sidebar section. Clicking the active section collapses it. */
export const selectSidebarAtom = atom(
  null,
  (get, set, section: SidebarSection | null) => {
    set(editorAtom, (prev) => ({
      ...prev,
      sidebar: prev.sidebar === section && section !== null ? null : section,
    }))
    set(saveEditorStateAtom)
  }
)

/** Select a tab, making it active in its pane. */
export const selectTabAtom = atom(
  null,
  (get, set, args: { tabId: string; paneId?: string }) => {
    set(editorAtom, (prev) => {
      const pane = args.paneId
        ? prev.panes[args.paneId]
        : findPaneByTabId(prev, args.tabId)

      if (!pane || pane.type !== "leaf") return prev
      const tab = prev.tabs[args.tabId]
      if (!tab) return prev

      return {
        ...prev,
        panes: {
          ...prev.panes,
          [pane.id]: { ...pane, tabId: args.tabId },
        },
        current: {
          ...prev.current,
          paneId: pane.id,
          tabId: args.tabId,
        },
      }
    })
    set(saveEditorStateAtom)
  }
)

/** Select a pane, activating its current tab. Recurses into split panes. */
export const selectPaneAtom = atom(
  null,
  (get, set, paneId?: string) => {
    set(editorAtom, (prev) => {
      const targetId = paneId ?? prev.current.paneId
      const pane = prev.panes[targetId]
      if (!pane) return prev

      if (pane.type === "split") {
        // recurse into first child
        const firstChild = prev.panes[pane.children[0]]
        if (!firstChild || firstChild.type === "split") return prev
        return {
          ...prev,
          current: {
            ...prev.current,
            paneId: firstChild.id,
            tabId: firstChild.tabId,
          },
        }
      }

      if (pane.tabsOrder.length === 0) return prev
      return {
        ...prev,
        current: {
          ...prev.current,
          paneId: pane.id,
          tabId: pane.tabId ?? pane.tabsOrder[0],
        },
      }
    })
    set(saveEditorStateAtom)
  }
)

/**
 * Open an entity (book or connection) in a tab within the given pane.
 * If the entity already has a tab in that pane, selects it. Otherwise creates a new tab.
 */
export const openInTabAtom = atom(
  null,
  (
    get,
    set,
    args: { entityType: TabType; entityId: string; paneId?: string }
  ) => {
    set(editorAtom, (prev) => {
      const pane =
        prev.panes[args.paneId ?? prev.current.paneId]
      if (!pane || pane.type !== "leaf") return prev

      // Check if already open
      const existing = findEntityTabInPane(prev, pane, args.entityId)
      if (existing) {
        return {
          ...prev,
          panes: { ...prev.panes, [pane.id]: { ...pane, tabId: existing.id } },
          current: { ...prev.current, paneId: pane.id, tabId: existing.id },
        }
      }

      const tabId = nanoid(9)
      let newTab: Tab

      if (args.entityType === "book") {
        newTab = {
          id: tabId,
          type: "book",
          bookId: args.entityId,
          blockId: null,
          connectionId: null,
        }
      } else {
        newTab = {
          id: tabId,
          type: "connection",
          connectionId: args.entityId,
          table: null,
        }
      }

      const updatedPane: ContentPane = {
        ...pane,
        tabsOrder: [...pane.tabsOrder, tabId],
        tabId,
      }

      return {
        ...prev,
        tabs: { ...prev.tabs, [tabId]: newTab },
        panes: { ...prev.panes, [pane.id]: updatedPane },
        current: { ...prev.current, paneId: pane.id, tabId },
      }
    })
    set(saveEditorStateAtom)
  }
)

/** Close a tab. Selects the adjacent tab if any, or closes the pane if empty. */
export const closeTabAtom = atom(
  null,
  (get, set, tabId: string) => {
    set(editorAtom, (prev) => {
      const pane = findPaneByTabId(prev, tabId)
      if (!pane || pane.type !== "leaf") return prev

      const tabIdx = pane.tabsOrder.indexOf(tabId)
      const newTabsOrder = pane.tabsOrder.filter((id) => id !== tabId)
      const newTabs = { ...prev.tabs }
      delete newTabs[tabId]

      if (newTabsOrder.length === 0) {
        // Pane is now empty — close it (handled inline below)
        return closePaneInState(prev, pane.id, newTabs)
      }

      const nextTabId =
        prev.current.tabId === tabId
          ? newTabsOrder[Math.max(0, tabIdx - 1)]
          : prev.current.tabId

      const updatedPane: ContentPane = {
        ...pane,
        tabsOrder: newTabsOrder,
        tabId: nextTabId ?? newTabsOrder[0],
      }

      return {
        ...prev,
        tabs: newTabs,
        panes: { ...prev.panes, [pane.id]: updatedPane },
        current: {
          ...prev.current,
          tabId: nextTabId ?? newTabsOrder[0],
        },
      }
    })
    set(saveEditorStateAtom)
  }
)

/** Close an empty pane, promoting its sibling to fill the parent split. */
export const closePaneAtom = atom(
  null,
  (get, set, paneId: string) => {
    set(editorAtom, (prev) => closePaneInState(prev, paneId, prev.tabs))
    set(saveEditorStateAtom)
  }
)

function closePaneInState(
  prev: EditorState,
  paneId: string,
  tabs: EditorState["tabs"]
): EditorState {
  if (Object.keys(prev.panes).length <= 1) return prev

  const parentPane = findParentPane(prev, paneId)
  if (!parentPane) return prev

  const siblingId = parentPane.children.find((id) => id !== paneId)
  if (!siblingId) return prev

  const newPanes = { ...prev.panes }
  delete newPanes[paneId]

  let rootPaneId = prev.current.rootPaneId

  if (parentPane.id === prev.current.rootPaneId) {
    delete newPanes[parentPane.id]
    rootPaneId = siblingId
  } else {
    const grandParent = findParentPane(prev, parentPane.id)
    if (!grandParent) return prev
    const idx = grandParent.children.indexOf(parentPane.id) as 0 | 1
    const updatedChildren: [string, string] = [...grandParent.children] as [string, string]
    updatedChildren[idx] = siblingId
    newPanes[grandParent.id] = { ...grandParent, children: updatedChildren }
    delete newPanes[parentPane.id]
  }

  const siblingPane = newPanes[siblingId]
  const nextTabId =
    siblingPane && siblingPane.type === "leaf" ? siblingPane.tabId : null

  return {
    ...prev,
    tabs,
    panes: newPanes,
    current: {
      rootPaneId,
      paneId: siblingId,
      tabId: nextTabId,
    },
  }
}

/** Split an existing content pane into two, duplicating the current tab. */
export const splitPaneAtom = atom(
  null,
  (
    get,
    set,
    args: {
      paneId: string
      direction: "horizontal" | "vertical"
      entityType: TabType
      entityId: string
    }
  ) => {
    set(editorAtom, (prev) => {
      const pane = prev.panes[args.paneId]
      if (!pane || pane.type !== "leaf") return prev

      const newPaneId = nanoid(9)
      const splitId = nanoid(9)
      const tabId = nanoid(9)

      let newTab: Tab
      if (args.entityType === "book") {
        newTab = {
          id: tabId,
          type: "book",
          bookId: args.entityId,
          blockId: null,
          connectionId: null,
        }
      } else {
        newTab = {
          id: tabId,
          type: "connection",
          connectionId: args.entityId,
          table: null,
        }
      }

      const newContentPane: ContentPane = {
        type: "leaf",
        id: newPaneId,
        tabsOrder: [tabId],
        tabId,
      }

      const splitPane: SplitPane = {
        type: "split",
        id: splitId,
        direction: args.direction,
        children: [args.paneId, newPaneId],
      }

      const newPanes = { ...prev.panes }

      if (prev.current.rootPaneId === args.paneId) {
        newPanes[splitId] = splitPane
        newPanes[newPaneId] = newContentPane
      } else {
        const parent = findParentPane(prev, args.paneId)
        if (!parent) return prev
        const idx = parent.children.indexOf(args.paneId) as 0 | 1
        const updatedChildren: [string, string] = [...parent.children] as [string, string]
        updatedChildren[idx] = splitId
        newPanes[parent.id] = { ...parent, children: updatedChildren }
        newPanes[splitId] = splitPane
        newPanes[newPaneId] = newContentPane
      }

      return {
        ...prev,
        tabs: { ...prev.tabs, [tabId]: newTab },
        panes: newPanes,
        current: {
          rootPaneId:
            prev.current.rootPaneId === args.paneId
              ? splitId
              : prev.current.rootPaneId,
          paneId: newPaneId,
          tabId,
        },
      }
    })
    set(saveEditorStateAtom)
  }
)

/** Update the selected block within a BookTab. */
export const selectBlockAtom = atom(
  null,
  (get, set, args: { tabId: string; blockId: string }) => {
    set(editorAtom, (prev) => {
      const tab = prev.tabs[args.tabId]
      if (!tab || tab.type !== "book") return prev
      return {
        ...prev,
        tabs: {
          ...prev.tabs,
          [args.tabId]: { ...tab, blockId: args.blockId },
        },
      }
    })
    set(saveEditorStateAtom)
  }
)

/** Set the connection ID on a BookTab. */
export const setTabConnectionAtom = atom(
  null,
  (get, set, args: { tabId: string; connectionId: string }) => {
    set(editorAtom, (prev) => {
      const tab = prev.tabs[args.tabId]
      if (!tab || tab.type !== "book") return prev
      return {
        ...prev,
        tabs: {
          ...prev.tabs,
          [args.tabId]: { ...tab, connectionId: args.connectionId },
        },
      }
    })
    set(saveEditorStateAtom)
  }
)

/** Set the active table in a DatabaseTab. */
export const selectTableAtom = atom(
  null,
  (get, set, args: { tabId: string; table: string | null }) => {
    set(editorAtom, (prev) => {
      const tab = prev.tabs[args.tabId]
      if (!tab || tab.type !== "connection") return prev
      return {
        ...prev,
        tabs: { ...prev.tabs, [args.tabId]: { ...tab, table: args.table } },
      }
    })
    set(saveEditorStateAtom)
  }
)
