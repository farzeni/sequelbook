import { AppState } from "@store/types"
import { create } from "zustand"

export const useStore = create<AppState>()(() => ({
  books: {},
  connections: {},
  results: {},
  editor: {
    sidebar: "books",

    pane: {
      type: "leaf",
      id: "root",
      tabs: {},
      tabsOrder: [],
      tabId: null,
    },

    tabs: {},
    tabsOrder: [],
    currentTabId: null,
  },
}))
