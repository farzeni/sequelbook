import { atom } from "jotai"
import type {
  AppConfig,
  BookMap,
  CellStateMap,
  ConnectionMap,
  ConnectionState,
  EditorState,
  ResultMap,
} from "./types"

// ─── Default editor state ────────────────────────────────────────────────────

const ROOT_PANE_ID = "root"

export const DEFAULT_EDITOR_STATE: EditorState = {
  sidebar: "books",
  tabs: {},
  panes: {
    [ROOT_PANE_ID]: {
      type: "leaf",
      id: ROOT_PANE_ID,
      tabsOrder: [],
      tabId: null,
    },
  },
  current: {
    rootPaneId: ROOT_PANE_ID,
    tabId: null,
    paneId: ROOT_PANE_ID,
  },
}

// ─── Primitive atoms (one per domain) ────────────────────────────────────────

export const booksAtom = atom<BookMap>({})

export const connectionsAtom = atom<ConnectionMap>({})

export const connectionStatusAtom = atom<ConnectionState>("disconnected")

/** The backend connection manager ID — used for Disconnect() calls. */
export const activeConnectionIdAtom = atom<string | null>(null)

/** The settings entry ID of the active connection — used for UI comparisons. */
export const activeEntryIdAtom = atom<string | null>(null)

export const resultsAtom = atom<ResultMap>({})

export const editorAtom = atom<EditorState>(DEFAULT_EDITOR_STATE)

export const cellStatesAtom = atom<CellStateMap>({})

export const settingsAtom = atom<AppConfig>({
  pageSize: 50,
  booksDir: "",
  fontSize: 14,
})

/** Completion schema and dialect for CodeMirror SQL autocompletion. */
export const dbSchemaAtom = atom<{ schema: { [_ in string]?: string[] }; dialect: string } | null>(null)

/** Registry of blockId -> focus() for programmatic cell focus (keyboard shortcuts). */
export const blockFocusRegistryAtom = atom<Record<string, () => void>>({})

/** Registry of blockId -> getContent() so executeBlock always reads the live editor value. */
export const blockContentRegistryAtom = atom<Record<string, () => string>>({})
