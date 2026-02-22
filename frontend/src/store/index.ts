import { atom } from "jotai"
import { loadBooksAtom } from "./books"
import { loadConnectionsAtom } from "./connections"
import { loadEditorStateAtom } from "./editor"
import { loadSettingsAtom } from "./settings"

// ─── Store initialization ─────────────────────────────────────────────────────

/**
 * Async write atom that bootstraps all domains in sequence.
 * Call once on app mount: `useSetAtom(initStoreAtom)()`
 *
 * Mirrors the legacy InitStore() in legacy/frontend/src/store/index.ts.
 */
export const initStoreAtom = atom(null, async (_get, set) => {
  await set(loadBooksAtom)
  await set(loadConnectionsAtom)
  await set(loadSettingsAtom)
  await set(loadEditorStateAtom)
  console.debug("initStoreAtom: store initialized")
})

// ─── Re-exports ───────────────────────────────────────────────────────────────

// Primitive atoms
export { booksAtom, connectionsAtom, connectionStatusAtom, activeConnectionIdAtom, activeEntryIdAtom, cellStatesAtom, dbSchemaAtom, editorAtom, resultsAtom, settingsAtom, blockFocusRegistryAtom } from "./atoms"
export { registerBlockFocusAtom, unregisterBlockFocusAtom } from "./blockFocus"
export { registerBlockContentAtom, unregisterBlockContentAtom } from "./blockContent"

// Editor
export {
  rootPaneAtom,
  currentPaneAtom,
  currentTabAtom,
  selectSidebarAtom,
  selectTabAtom,
  selectPaneAtom,
  openInTabAtom,
  closeTabAtom,
  closePaneAtom,
  splitPaneAtom,
  selectBlockAtom,
  setTabConnectionAtom,
  selectTableAtom,
} from "./editor"

// Books
export {
  autoSaveAtom,
  currentBookAtom,
  loadBooksAtom,
  addBookAtom,
  updateBookTitleAtom,
  removeBookAtom,
  deleteBookAtom,
  addChapterAtom,
  addBlockAtom,
  updateBlockAtom,
  updateBlockPageSizeAtom,
  removeBlockAtom,
  moveBlockAtom,
  duplicateBlockAtom,
  executeBlockAtom,
  cancelQueryAtom,
} from "./books"

// Connections
export {
  connectionListAtom,
  loadConnectionsAtom,
  addConnectionAtom,
  updateConnectionAtom,
  removeConnectionAtom,
  connectAtom,
  disconnectAtom,
  setConnectionStatusAtom,
} from "./connections"

// activeConnectionIdAtom is already re-exported from ./atoms above

// Results
export {
  resultByIdAtom,
  storeResultAtom,
  disposeResultAtom,
  fetchPageAtom,
  navigatePageAtom,
  clearResultsAtom,
  setCellStateAtom,
  convertQueryResponse,
} from "./results"

// Settings
export { loadSettingsAtom, saveSettingsAtom } from "./settings"

// Types
export type {
  // Backend models
  Block,
  BlockType,
  Section,
  Chapter,
  Book,
  OpenBook,
  ConnectionConfig,
  ConnectionEntry,
  ConnectionStatus,
  ConnectionState,
  DisplayType,
  Column,
  QueryMeta,
  QueryResult,
  CellState,
  CellStateMap,
  ResultPage,
  ResultMeta,
  QueryResponse,
  AppConfig,
  // Map types
  BookMap,
  ConnectionMap,
  ResultMap,
  // Editor state
  SidebarSection,
  TabType,
  BookTab,
  DatabaseTab,
  Tab,
  TabMap,
  ContentPane,
  SplitPane,
  Pane,
  PaneMap,
  EditorSelection,
  EditorState,
} from "./types"
