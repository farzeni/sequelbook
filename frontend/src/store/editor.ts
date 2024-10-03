export * from "./books"
export * from "./types"
import { appState } from "@hooks/store"
import * as core from "@lib/wailsjs/go/core/Backend"
import {
  ContentPane,
  Pane,
  PaneMap,
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

function replacePanes(paneMap: PaneMap, id: string, newPane: Pane): string {
  return JSON.stringify(paneMap)
}

export function DoSplitPane(
  pane: ContentPane,
  direction: "horizontal" | "vertical"
) {
  console.log("Split pane", pane.id, direction)

  const newPane: ContentPane = {
    type: "leaf",
    id: generateUniqueId(),
    tabsOrder: [],
    tabId: null,
  }

  const tab = appState.editor.tabs[pane.tabId || ""]

  if (tab) {
    // const newTab: Tab = {
    //   id: generateUniqueId(),
    //   type: tab.type,
    //   bookId: tab.bookId,
    //   cellId: tab.cellId,
    //   connectionId: tab.connectionId,
    // }

    // newPane.tabsOrder.push(newTab.id)
    // newPane.tabId = newTab.id

    newPane.tabsOrder.push(tab.id)
    newPane.tabId = tab.id
  }

  const splitPane: SplitPane = {
    type: "split",
    id: generateUniqueId(),
    direction: direction,
    children: [pane.id, newPane.id],
  }

  console.log("replace pane", pane.id, splitPane)
  console.log("==> ", [pane.id, newPane.id])

  // find parent pane
  if (appState.editor.rootPaneId === pane.id) {
    appState.editor.rootPaneId = splitPane.id
  } else {
    for (const paneId in appState.editor.panes) {
      const parentPane = appState.editor.panes[paneId]

      if (parentPane.type === "split") {
        if (parentPane.children.includes(pane.id)) {
          const idx = parentPane.children.findIndex((id) => id === pane.id)
          parentPane.children[idx] = splitPane.id
          break
        }
      }
    }
  }

  appState.editor.panes[newPane.id] = newPane
  appState.editor.panes[splitPane.id] = splitPane

  console.log("new panes", appState.editor.panes)
  console.log("new panes", appState.editor.rootPaneId)
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

export function SelectTab(tabId: string) {
  const tab = appState.editor.tabs[tabId]

  if (!tab) {
    return
  }

  appState.editor.tabId = tabId

  console.log("Select tab", tabId, tab)

  SaveEditorState()
}

export function OpenInTab(entityType: TabType, entityId: string) {
  let tabId = null
  const pane = appState.editor.pane

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

      appState.editor.pane.tabsOrder.push(tabId)
    }

    if (newTab) {
      appState.editor.tabs[tabId] = newTab
      pane.tabsOrder.push(tabId)
      pane.tabId = tabId
    }
  } else {
    pane.tabId = tab.id
    appState.editor.tabId = tab.id
  }

  if (tabId) {
    SelectTab(tabId)
    SaveEditorState()
  }

  return tabId
}

export function CloseTab(tabId: string) {
  let nextTabId = null

  const pane = appState.editor.pane

  if (pane.type !== "leaf") {
    return
  }

  const tabIdx = pane.tabsOrder.findIndex((id) => id === tabId)

  console.log("close tab", tabId, appState.editor.tabId)

  if (appState.editor.tabId === tabId) {
    console.log("closing current tab")
    if (pane.tabsOrder.length === 1) {
      console.log("closing last tab")
      pane.tabId = null
      appState.editor.tabId = null
    } else {
      const nextTabIdx = tabIdx === 0 ? 1 : tabIdx - 1

      nextTabId = pane.tabsOrder[nextTabIdx]
      console.log("closing tab, selecting next tab")
    }
  }

  pane.tabsOrder.splice(tabIdx, 1)
  delete appState.editor.tabs[tabId]

  if (nextTabId) {
    SelectTab(nextTabId)
  }

  SaveEditorState()
}

function generateUniqueId(): string {
  return Math.random().toString(36).substr(2, 9)
}
