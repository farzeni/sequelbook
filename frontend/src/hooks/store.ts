import { AppState, ContentPane, Pane, Tab } from "@store/types"
import { proxy } from "valtio"
export const editorState = proxy<AppState["editor"]>({
  sidebar: "books",
  tabs: {},
  panes: {
    root: {
      type: "leaf",
      id: "root",
      tabsOrder: [],
      tabId: null,
    },
  },

  rootPaneId: "root",
  tabId: null,
  paneId: "root",

  get rootPane(): Pane {
    return this.panes[this.rootPaneId]
  },

  set rootPane(pane: Pane) {
    this.rootPaneId = pane.id
  },

  get pane(): ContentPane {
    const pane = this.panes[this.paneId]
    if (pane.type !== "leaf") {
      throw new Error("Expected a leaf pane")
    }

    return pane
  },

  set pane(pane: ContentPane) {
    if (pane.type !== "leaf") {
      throw new Error("Expected a leaf pane")
    }

    this.paneId = pane.id
  },

  get tab(): Tab | null {
    console.log("-=--", this.tabId)
    return this.tabs[this.tabId || ""] || null
  },
})

export const appState = proxy<AppState>({
  books: {},
  connections: {},
  results: {},
  editor: editorState,
})
