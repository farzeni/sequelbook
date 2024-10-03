export * from "./books"
export * from "./types"
import { useStore } from "@hooks/store"
import * as core from "@lib/wailsjs/go/core/Backend"
import { produce } from "immer"
import {
  AppState,
  ContentPane,
  Pane,
  PaneMap,
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

function replacePaneById(
  paneMap: PaneMap,
  paneId: string,
  id: string,
  newPane: Pane
): string {
  const updatedPaneMap = { ...paneMap }
  const pane = updatedPaneMap[paneId]

  if (!pane || pane.type === "leaf") {
    throw new Error(`Pane with ID ${paneId} does not exist`)
  }

  if (pane.children[0] === id) {
    pane.children[0] = newPane.id
    updatedPaneMap[newPane.id] = newPane
  } else if (pane.children[1] === id) {
    pane.children[1] = newPane.id
    updatedPaneMap[newPane.id] = newPane
  }

  const isRoot = (paneId: string) => {
    return !Object.values(updatedPaneMap).some(
      (p) =>
        p.type === "split" &&
        (p.children[0] === paneId || p.children[1] === paneId)
    )
  }

  for (const key in updatedPaneMap) {
    if (isRoot(key)) {
      return key
    }
  }

  throw new Error("Root not found")
}

export function DoSplitPane(
  pane: ContentPane,
  direction: "horizontal" | "vertical"
) {
  useStore.setState(
    produce((state: AppState) => {
      console.log("Split pane", pane.id, direction)
      const newPane: ContentPane = {
        type: "leaf",
        id: generateUniqueId(),
        tabsOrder: [],
        tabId: null,
      }

      const tab = state.editor.tab()

      if (tab) {
        newPane.tabsOrder.push(tab.id)
        newPane.tabId = tab.id
      }

      const splitPane: SplitPane = {
        type: "split",
        id: generateUniqueId(),
        direction: direction,
        children: [pane.id, newPane.id],
      }

      console.log("replace pane", pane.id)
      const panes = replacePaneById(
        state.editor.panes,
        state.editor.rootPaneId,
        pane.id,
        splitPane
      )

      state.editor.rootPaneId = panes
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
      state.editor.tabId = tabId
    })
  )

  SaveEditorState()
}

export function OpenInTab(entityType: TabType, entityId: string) {
  let tabId = null

  useStore.setState(
    produce((state: AppState) => {
      const tab = findEntityTabInPane(state.editor.pane(), entityId)
      const pane = state.editor.pane()

      if (pane.type !== "leaf") {
        return
      }

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

          pane.tabsOrder.push(tabId)

          console.log("pane.tabsOrder", pane.tabsOrder[0])
        }

        if (entityType === "connection") {
          state.editor.tabs[tabId] = {
            id: tabId,
            type: "connection",
            connectionId: entityId,
            cellId: null,
            bookId: null,
          }
          pane.tabsOrder.push(tabId)
          pane.tabId = tabId
        }
      } else {
        pane.tabId = tab.id
        tabId = tab.id
      }
    })
  )
  if (tabId) {
    SelectTab(tabId)
    SaveEditorState()
  }

  console.log(useStore.getState().editor)

  return tabId
}

export function CloseTab(tabId: string) {
  let nextTabId = null

  useStore.setState(
    produce((state: AppState) => {
      const pane = state.editor.pane()

      if (pane.type !== "leaf") {
        return
      }

      const tabIdx = pane.tabsOrder.findIndex((id) => id === tabId)

      console.log("close tab", tabId, state.editor.tabId)

      if (state.editor.tabId === tabId) {
        console.log("closing current tab")
        if (pane.tabsOrder.length === 1) {
          console.log("closing last tab")
          pane.tabId = null
          state.editor.tabId = null
        } else {
          const nextTabIdx = tabIdx === 0 ? 1 : tabIdx - 1

          nextTabId = pane.tabsOrder[nextTabIdx]
          console.log("closing tab, selecting next tab")
        }
      }

      pane.tabsOrder.splice(tabIdx, 1)
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
