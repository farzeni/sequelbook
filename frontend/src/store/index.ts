import { LoadBooks } from "./books"
import { LoadConnections } from "./connections"
import { LoadEditorState } from "./editor"

export async function InitStore() {
  await LoadBooks()
  await LoadConnections()
  await LoadEditorState()
}

export * from "./books"
export * from "./connections"
export * from "./editor"
export * from "./types"
