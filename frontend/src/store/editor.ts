export * from "./books"
export * from "./types"
import { appState } from "@hooks/store"
import * as core from "@lib/wailsjs/go/core/Backend"
import {
  ContentPane,
  Pane,
  SidebarSection,
  SplitPane,
  Tab,
  TabType,
} from "./types"

export function findEntityTabInPane(pane: Pane, entityId: string): Tab | null {
  const tabs = appState.editor.tabs

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

function findPaneByTabId(tabId: string): ContentPane | null {
  for (const paneId in appState.editor.panes) {
    const pane = appState.editor.panes[paneId]

    if (pane.type === "leaf" && pane.tabsOrder.includes(tabId)) {
      return pane
    }
  }

  return null
}

function findParentPane(paneId: string): SplitPane | null {
  for (const id in appState.editor.panes) {
    const pane = appState.editor.panes[id]

    if (pane.type === "split" && pane.children.includes(paneId)) {
      return pane
    }
  }

  return null
}

export function DoSplitPane(
  pane: ContentPane,
  direction: "horizontal" | "vertical"
) {
  const newPane: ContentPane = {
    type: "leaf",
    id: generateUniqueId(),
    tabsOrder: [],
    tabId: null,
  }

  const tab = appState.editor.tabs[pane.tabId || ""]

  if (!tab) {
    return
  }

  const splitPane: SplitPane = {
    type: "split",
    id: generateUniqueId(),
    direction: direction,
    children: [pane.id, newPane.id],
  }

  // find parent pane
  if (appState.editor.current.rootPaneId === pane.id) {
    appState.editor.current.rootPaneId = splitPane.id
  } else {
    const parentPane = findParentPane(pane.id)

    if (!parentPane) {
      return
    }

    const idx = parentPane.children.findIndex((id) => id === pane.id)
    parentPane.children[idx] = splitPane.id
  }

  appState.editor.panes[newPane.id] = newPane
  appState.editor.panes[splitPane.id] = splitPane

  if (tab.type === "book") {
    OpenInTab("book", tab.bookId, newPane.id)
  } else {
    OpenInTab("connection", tab.connectionId, newPane.id)
  }
}

export async function LoadEditorState() {
  try {
    const state = await core.LoadEditorState()
    const editorState = JSON.parse(state)
    appState.editor = {
      ...appState.editor,
      ...editorState,
    }
  } catch (error) {
    console.log("No editor state found")
  }
}

export async function SaveEditorState() {
  const state = appState.editor

  try {
    await core.SaveEditorState(JSON.stringify(state))
  } catch (error) {
    console.error("Error saving editor state", error)
  }
}

export function SelectSidebarSection(section: SidebarSection | null) {
  appState.editor.sidebar =
    appState.editor.sidebar === section && !!section ? null : section
}

export function SelectTab(tabId: string, paneId?: string) {
  const pane = appState.editor.panes[paneId || appState.editor.current.paneId]

  const tab = appState.editor.tabs[tabId]

  if (!tab || pane.type !== "leaf") {
    return
  }

  appState.editor.current.tabId = tabId
  pane.tabId = tabId

  SaveEditorState()
}

export function OpenInTab(
  entityType: TabType,
  entityId: string,
  paneId?: string
) {
  let tabId = null
  const pane = appState.editor.panes[paneId || appState.editor.current.paneId]

  if (pane.type !== "leaf") {
    return
  }

  const tab = findEntityTabInPane(pane, entityId)

  if (!tab) {
    tabId = generateUniqueId()
    let newTab: Tab | null = null

    if (entityType === "book") {
      newTab = {
        id: tabId,
        type: "book",
        bookId: entityId,
        cellId: null,
        connectionId: null,
      }
    }

    if (entityType === "connection") {
      newTab = {
        id: tabId,
        type: "connection",
        connectionId: entityId,
      }

      pane.tabsOrder.push(tabId)
    }

    if (newTab) {
      appState.editor.tabs[tabId] = newTab
      pane.tabsOrder.push(tabId)
      pane.tabId = tabId
    }
  } else {
    pane.tabId = tab.id
  }

  if (tabId) {
    SelectTab(tabId)
    SaveEditorState()
  }

  return tabId
}

export function CloseTab(tabId: string) {
  let nextTabId = null

  const pane = findPaneByTabId(tabId)

  if (!pane || pane.type !== "leaf") {
    return
  }

  const tabIdx = pane.tabsOrder.findIndex((id) => id === tabId)

  if (appState.editor.current.tabId === tabId) {
    if (pane.tabsOrder.length === 1) {
      pane.tabId = null
      appState.editor.current.tabId = null
    } else {
      const nextTabIdx = tabIdx === 0 ? 1 : tabIdx - 1

      nextTabId = pane.tabsOrder[nextTabIdx]
    }
  }

  pane.tabsOrder.splice(tabIdx, 1)
  delete appState.editor.tabs[tabId]

  if (nextTabId) {
    console.log("selecting next tab", nextTabId)
    SelectTab(nextTabId)
  } else {
    console.log("closing pane")
    if (Object.keys(appState.editor.panes).length > 1) {
      // close pane
      const parentPane = findParentPane(pane.id)

      console.log("parent pane", parentPane)

      if (!parentPane) {
        return
      }

      const sibilingPaneId = parentPane.children.find((id) => id !== pane.id)

      if (!sibilingPaneId) {
        return
      }

      if (parentPane.id == appState.editor.current.rootPaneId) {
        console.log("closing root pane")
        appState.editor.current.rootPaneId = sibilingPaneId
      } else {
        console.log("closing child pane")
        const grandParentPane = findParentPane(parentPane.id)

        if (!grandParentPane) {
          return
        }

        const idx = grandParentPane.children.findIndex(
          (id) => id === parentPane.id
        )

        grandParentPane.children[idx] = sibilingPaneId

        delete appState.editor.panes[parentPane.id]
      }

      delete appState.editor.panes[pane.id]
    }
  }

  SaveEditorState()
}

function generateUniqueId(): string {
  return Math.random().toString(36).substr(2, 9)
}
