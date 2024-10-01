export * from "./books"
export * from "./types"
import { useStore } from "@hooks/store"
import * as core from "@lib/wailsjs/go/core/Backend"
import { produce } from "immer"
import { isBookID } from "./books"
import { isDatabaseID } from "./connections"
import { AppState, ContentPane, Pane, SidebarSection, SplitPane } from "./types"

function findPaneById(pane: Pane, id: string): Pane | null {
  if (pane.id === id) {
    return pane
  }
  if (pane.type === "split") {
    return (
      findPaneById(pane.children[0], id) || findPaneById(pane.children[1], id)
    )
  }
  return null
}

function replacePaneById(pane: Pane, id: string, newPane: Pane): boolean {
  if (pane.type === "split") {
    if (pane.children[0].id === id) {
      pane.children[0] = newPane
      return true
    }
    if (pane.children[1].id === id) {
      pane.children[1] = newPane
      return true
    }
    return (
      replacePaneById(pane.children[0], id, newPane) ||
      replacePaneById(pane.children[1], id, newPane)
    )
  }
  return false
}

function generateUniqueId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function DoSplitPane(paneId: string, direction: "horizontal" | "vertical") {
  useStore.setState(
    produce((state: AppState) => {
      const pane = findPaneById(state.editor.pane, paneId)
      if (pane && pane.type === "leaf") {
        const newPane: ContentPane = {
          type: "leaf",
          id: generateUniqueId(),
          tabs: {},
          tabsOrder: [],
          tabId: null,
        }

        const splitPane: SplitPane = {
          type: "split",
          id: generateUniqueId(),
          direction: direction,
          children: [pane, newPane],
        }
        replacePaneById(state.editor.pane, paneId, splitPane)
      }
    })
  )
}

export async function LoadEditorState() {
  const state = await core.LoadEditorState()

  try {
    const editorState = JSON.parse(state)
    useStore.setState(
      produce((state: AppState) => {
        state.editor = {
          ...state.editor,
          ...editorState,
        }
      })
    )
  } catch (error) {
    console.error("Error loading editor state", error)
  }
}

export async function SaveEditorState() {
  const state = useStore.getState().editor

  try {
    await core.SaveEditorState(JSON.stringify(state))
  } catch (error) {
    console.error("Error saving editor state", error)
  }
}

export function SetSidebar(section: SidebarSection | null) {
  useStore.setState(
    produce((state: AppState) => {
      state.editor.sidebar =
        state.editor.sidebar === section && !!section ? null : section
    })
  )
}

export function SelectTab(tabId: string) {
  if (isBookID(tabId)) {
    const book = useStore.getState().books[tabId]

    if (!book) {
      return
    }

    useStore.setState(
      produce((state: AppState) => {
        state.editor.currentTabId = book.id

        if (!state.editor.tabs[book.id]) {
          state.editor.tabs[book.id] = {
            type: "book",
            bookId: book.id,
            cellId: null,
            connectionId: null,
          }
        }
      })
    )
  }

  if (isDatabaseID(tabId)) {
    const connection = useStore.getState().connections[tabId]

    if (!connection) {
      return
    }

    useStore.setState(
      produce((state: AppState) => {
        state.editor.currentTabId = connection.id

        if (!state.editor.tabs[connection.id]) {
          state.editor.tabs[connection.id] = {
            type: "connection",
            connectionId: connection.id,
            cellId: null,
            bookId: null,
          }
        }
      })
    )
  }

  AddTab(tabId)
}

export function AddTab(tabId: string) {
  const tab = useStore.getState().editor.tabs[tabId]
  const tabsOrder = useStore.getState().editor.tabsOrder
  const book = useStore.getState().books[tabId]

  if (tab && !tabsOrder.includes(tabId)) {
    useStore.setState(
      produce((state: AppState) => {
        state.editor.tabsOrder.push(tabId)
      })
    )
  }

  if (tab) {
    return
  }

  if (tabId.startsWith("bok")) {
    if (!book) {
      return
    }

    if (!tab) {
      const newTab = {
        bookId: tabId,
        content: book,
        cellId: null,
        connectionId: null,
        results: {},
      }

      useStore.setState(
        produce((state: AppState) => {
          state.editor.tabs[tabId] = {
            type: "book",
            ...newTab,
          }
          state.editor.tabsOrder.push(tabId)
        })
      )
      return
    }
  }

  if (tabId.startsWith("con")) {
    const connection = useStore.getState().connections[tabId]

    if (!connection) {
      return
    }

    if (!tab) {
      const newTab = {
        connectionId: tabId,
        content: connection,
        cellId: null,
        bookId: null,
        results: {},
      }

      useStore.setState(
        produce((state: AppState) => {
          state.editor.tabs[tabId] = {
            type: "connection",
            ...newTab,
          }
          state.editor.tabsOrder.push(tabId)
        })
      )
      return
    }
  }

  SaveEditorState()
}

export function RemoveTab(bookId: string) {
  const editor = useStore.getState().editor
  const tabIdx = editor.tabsOrder.findIndex((id) => id === bookId)

  useStore.setState(
    produce((state: AppState) => {
      delete state.editor.tabs[bookId]
      state.editor.tabsOrder = state.editor.tabsOrder.filter(
        (id: string) => id !== bookId
      )
    })
  )

  if (useStore.getState().editor.currentTabId === bookId) {
    if (editor.tabsOrder.length === 1) {
      useStore.setState(
        produce((state: AppState) => {
          state.editor.currentTabId = null
        })
      )
    } else {
      const newTabIdx = tabIdx === 0 ? 1 : tabIdx - 1
      SelectTab(editor.tabsOrder[newTabIdx])
    }
  }

  SaveEditorState()
}
