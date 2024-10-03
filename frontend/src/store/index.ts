import { LoadBooks } from "./books"
import { LoadConnections } from "./connections"
import { LoadEditorState } from "./editor"

export async function InitStore() {
  console.log("LOAD BOOKS")
  await LoadBooks()
  console.log("LOAD CONNECTIONS")
  await LoadConnections()
  console.log("LOAD EDITOR STATE")
  await LoadEditorState()
}

export * from "./books"
export * from "./connections"
export * from "./editor"
export * from "./types"
