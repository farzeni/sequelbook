export * from "./books"
export * from "./types"
import { useStore } from "@hooks/store"
import * as core from "@lib/wailsjs/go/core/Backend"
import { produce } from "immer"
import {
  AppState,
  ContentPane,
  Pane,
  SidebarSection,
  SplitPane,
  Tab,
  TabType,
} from "./types"

export function findEntityTabInPane(pane: Pane, entityId: string): Tab | null {
  const tabs = useStore.getState().editor.tabs

  if (!pane || pane.type === "split") {
    return null
  }

  for (const tabId of pane.tabsOrder) {
    const tab = tabs[tabId]

    if (tab.type === "book" && tab.bookId === entityId) {
      return tab
    }

    if (tab.type === "connection" && tab.connectionId === entityId) {
      return tab
    }
  }

  return null
}

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

function doSplitPane(paneId: string, direction: "horizontal" | "vertical") {
  useStore.setState(
    produce((state: AppState) => {
      const pane = findPaneById(state.editor.rootPane, paneId)
      if (pane && pane.type === "leaf") {
        const newPane: ContentPane = {
          type: "leaf",
          id: generateUniqueId(),
          tabsOrder: [],
          tabId: null,
        }

        const splitPane: SplitPane = {
          type: "split",
          id: generateUniqueId(),
          direction: direction,
          children: [pane, newPane],
        }
        replacePaneById(state.editor.rootPane, paneId, splitPane)
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

export function SelectSidebarSection(section: SidebarSection | null) {
  useStore.setState(
    produce((state: AppState) => {
      state.editor.sidebar =
        state.editor.sidebar === section && !!section ? null : section
    })
  )
}

export function SelectTab(tabId: string) {
  const tab = useStore.getState().editor.tabs[tabId]

  if (!tab) {
    return
  }

  useStore.setState(
    produce((state: AppState) => {
      state.editor.tab = state.editor.tabs[tabId]
    })
  )

  SaveEditorState()
}

export function OpenInTab(entityType: TabType, entityId: string) {
  let tabId = null

  useStore.setState(
    produce((state: AppState) => {
      const tab = findEntityTabInPane(state.editor.pane, entityId)

      if (!tab) {
        tabId = generateUniqueId()

        if (entityType === "book") {
          state.editor.tabs[tabId] = {
            id: tabId,
            type: "book",
            bookId: entityId,
            cellId: null,
            connectionId: null,
          }
          state.editor.pane.tabsOrder.push(tabId)

          console.log("pane.tabsOrder", state.editor.pane.tabsOrder)
        }

        if (entityType === "connection") {
          state.editor.tabs[tabId] = {
            id: tabId,
            type: "connection",
            connectionId: entityId,
            cellId: null,
            bookId: null,
          }
          state.editor.pane.tabsOrder.push(tabId)
          state.editor.pane.tabId = tabId
        }
      } else {
        state.editor.tab = tab
        state.editor.pane.tabId = tab.id
        tabId = tab.id
      }
    })
  )
  if (tabId) {
    SelectTab(tabId)
    SaveEditorState()
  }

  return tabId
}

export function CloseTab(tabId: string) {
  let nextTabId = null

  useStore.setState(
    produce((state: AppState) => {
      const tabIdx = state.editor.pane.tabsOrder.findIndex((id) => id === tabId)

      console.log("close tab", tabId, state.editor.tab?.id)

      if (state.editor.tab?.id === tabId) {
        console.log("closing current tab")
        if (state.editor.pane.tabsOrder.length === 1) {
          console.log("closing last tab")
          state.editor.pane.tabId = null
          state.editor.tab = null
        } else {
          const nextTabIdx = tabIdx === 0 ? 1 : tabIdx - 1

          nextTabId = state.editor.pane.tabsOrder[nextTabIdx]
          console.log("closing tab, selecting next tab")
        }
      }

      state.editor.pane.tabsOrder.splice(tabIdx, 1)
      delete state.editor.tabs[tabId]
    })
  )

  if (nextTabId) {
    SelectTab(nextTabId)
  }

  SaveEditorState()
}

function generateUniqueId(): string {
  return Math.random().toString(36).substr(2, 9)
}
