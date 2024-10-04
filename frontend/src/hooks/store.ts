import { AppState } from "@store/types"
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
  current: {
    rootPaneId: "root",
    tabId: null,
    paneId: "root",
  },
})

export const appState = proxy<AppState>({
  books: {},
  connections: {},
  results: {},
  editor: editorState,
})
