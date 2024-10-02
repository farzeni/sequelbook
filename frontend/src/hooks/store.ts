import { AppState, ContentPane } from "@store/types"
import { create } from "zustand"

export const useStore = create<AppState>()((): AppState => {
  const rootPane: ContentPane = {
    type: "leaf",
    id: "root",
    tabsOrder: [],
    tabId: null,
  }

  return {
    books: {},
    connections: {},
    results: {},
    editor: {
      sidebar: "books",
      rootPane: rootPane,
      tabs: {},

      tab: null,
      pane: rootPane,
    },
  }
})
