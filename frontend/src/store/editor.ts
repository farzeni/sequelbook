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

function _printPaneTree(pane: Pane, level: number = 0) {
  if (!level || level === 0) {
    console.log("=== pane tree ===")
    console.log(appState.editor.panes)
  }

  if (pane.type === "split") {
    console.log(" ".repeat(level * 2), "pane: split", pane.id, " children ", [
      ...pane.children,
    ])
    pane.children.forEach((id) => {
      _printPaneTree(appState.editor.panes[id], level + 1)
    })
  } else {
    console.log(
      " ".repeat(level * 2),
      "pane: leaf",
      pane.id,
      " selected tab",
      pane.tabId
    )

    pane.tabsOrder.forEach((id) => {
      console.log(" ".repeat(level * 2 + 2), "tab", id)
    })
  }
}

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
    console.log("loading editor state")
    const state = await core.LoadEditorState()
    const editorState = JSON.parse(state)
    appState.editor = {
      ...appState.editor,
      ...editorState,
    }
    console.log("loaded editor state", appState.editor)
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

export function SelectPane(paneId?: string): Pane | null {
  const pane = appState.editor.panes[paneId || appState.editor.current.paneId]

  if (pane.type === "split") {
    return SelectPane(pane.children[0])
  }

  if (pane.tabsOrder.length > 0) {
    appState.editor.current.paneId = paneId || appState.editor.current.paneId
    appState.editor.current.tabId = pane.tabId || pane.tabsOrder[0]
  }

  SaveEditorState()

  return pane
}

export function SelectTab(tabId: string, paneId?: string) {
  let pane
  if (paneId) {
    pane = appState.editor.panes[paneId]
  } else {
    pane = findPaneByTabId(tabId)
  }

  if (!pane) {
    return
  }

  const tab = appState.editor.tabs[tabId]

  if (!tab || pane.type !== "leaf") {
    return
  }

  appState.editor.current = {
    ...appState.editor.current,
    paneId: pane.id,
    tabId: tab.id,
  }

  pane.tabId = tabId

  console.debug("======= select tab", tabId, "pane", pane.id)

  SaveEditorState()
}
;``

export function OpenInTab(
  entityType: TabType,
  entityId: string,
  paneId?: string
) {
  let tabId = null
  const pane = appState.editor.panes[paneId || appState.editor.current.paneId]
  console.log("open in tab", entityType, entityId, paneId, pane)
  if (pane.type !== "leaf") {
    return
  }

  const tab = findEntityTabInPane(pane, entityId)

  if (!tab) {
    tabId = generateUniqueId()
    let newTab: Tab | null = null

    if (entityType === "book") {
      const book = appState.books[entityId]
      newTab = {
        id: tabId,
        type: "book",
        bookId: entityId,
        cellId: book?.cells[0]?.id || null,
        connectionId: null,
      }
    }

    if (entityType === "connection") {
      newTab = {
        id: tabId,
        type: "connection",
        connectionId: entityId,
        table: null,
      }
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
    if (pane.tabsOrder.length > 1) {
      nextTabId = pane.tabsOrder[tabIdx === 0 ? 1 : tabIdx - 1]
    }
  }

  pane.tabsOrder.splice(tabIdx, 1)
  delete appState.editor.tabs[tabId]

  if (nextTabId) {
    SelectTab(nextTabId)
  } else if (pane.tabsOrder.length === 0) {
    ClosePane(pane.id)
  }

  SaveEditorState()
}

export function ClosePane(paneId: string) {
  if (Object.keys(appState.editor.panes).length <= 1) return

  // close pane
  const parentPane = findParentPane(paneId)

  console.log(
    "parent pane ",
    parentPane?.id,
    "root pane",
    appState.editor.current.rootPaneId
  )

  if (!parentPane) {
    return
  }

  const sibilingPaneId = parentPane.children.find((id) => id !== paneId)

  if (!sibilingPaneId) {
    return
  }

  if (parentPane.id == appState.editor.current.rootPaneId) {
    console.log("closing root pane")
    delete appState.editor.panes[appState.editor.current.rootPaneId]
    appState.editor.current.rootPaneId = sibilingPaneId

    SelectPane(sibilingPaneId)
  } else {
    console.log("closing child pane")
    const grandParentPane = findParentPane(parentPane.id)

    if (!grandParentPane) {
      console.log("no grand parent pane")
      return
    }

    const idx = grandParentPane.children.findIndex((id) => id === parentPane.id)

    grandParentPane.children[idx] = sibilingPaneId

    delete appState.editor.panes[parentPane.id]

    SelectPane(grandParentPane.id)
  }

  delete appState.editor.panes[paneId]
}

function generateUniqueId(): string {
  return Math.random().toString(36).substr(2, 9)
}
