import { appState } from "@hooks/store"
import * as core from "@lib/wailsjs/go/core/Backend"
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
  console.debug("LOAD SETTINGS")
  await LoadSettings()
  console.debug("STORE INITIALIZED")
}

export async function LoadSettings() {
  try {
    console.log("------------------loading editor state")
    const settings = await core.LoadSettings()
    console.log("====> SETTINGS loaded settings", settings)
    appState.settings = settings
    console.log("loaded editor state", appState)
  } catch (error) {
    console.log("No editor state found")
  }
}

export * from "./books"
export * from "./connections"
export * from "./editor"
export * from "./types"
