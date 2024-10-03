import { AppState, ContentPane } from "@store/types"
import { create } from "zustand"

export const useStore = create<AppState>()((_, get): AppState => {
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
      tabs: {},
      panes: {
        root: rootPane,
      },

      rootPaneId: rootPane.id,
      tabId: null,
      paneId: rootPane.id,

      pane: () => {
        const pane = get().editor.panes[get().editor.paneId]

        if (pane.type === "split") {
          throw new Error("Pane is a split pane")
        }

        return pane
      },

      rootPane: () => get().editor.panes[get().editor.rootPaneId],
      tab: () => get().editor.tabs[get().editor.tabId || ""] || null,
    },
  }
})
