import { LoadBooks } from "./books"
import { LoadConnections } from "./connections"
import { LoadEditorState } from "./editor"

export async function InitStore() {
  console.debug("LOAD BOOKS")
  await LoadBooks()
  console.debug("LOAD CONNECTIONS")
  await LoadConnections()
  console.debug("LOAD EDITOR STATE")
  await LoadEditorState()
}

export * from "./books"
export * from "./connections"
export * from "./editor"
export * from "./types"
