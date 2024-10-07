import { AppState, EditorState } from "@store/types"
import { useEffect, useMemo } from "react"
import { proxy, useSnapshot } from "valtio"

export const editorState = proxy<EditorState>({
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

export const useEditorPane = () => {
  const editor = useSnapshot(appState.editor)

  return useMemo(() => {
    return editor.panes[editor.current.paneId]
  }, [editor.current.paneId, editor.panes])
}

export const useEditorRootPane = () => {
  const editor = useSnapshot(appState.editor)

  useEffect(() => {
    console.log(">>>>>>>>. panes changed")
  }, [editor.panes])

  useEffect(() => {
    console.log(">>>>>>> root pane id changed")
  }, [editor.current.rootPaneId])

  return useMemo(() => {
    console.log(
      "================= root pane id changed",
      editor.current.rootPaneId
    )
    return editor.panes[editor.current.rootPaneId]
  }, [editor.current.rootPaneId, editor.panes])
}

export const useEditorTab = () => {
  const editor = useSnapshot(appState.editor)

  return useMemo(() => {
    return editor.tabs[editor.current.tabId || ""]
  }, [editor.current.tabId, editor.tabs])
}
