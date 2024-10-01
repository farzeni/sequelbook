export * from "./books"
export * from "./types"
import { useStore } from "@hooks/store"
import * as connectionsStore from "@lib/wailsjs/go/connections/ConnectionStore"
import { connections } from "@lib/wailsjs/go/models"
import { produce } from "immer"
import { SaveEditorState } from "./editor"
import { AppState, ConnectionMap, DatabaseTab, Tab } from "./types"

export function isDatabaseTab(tab: Tab): tab is DatabaseTab {
  return tab.type === "connection"
}

export function isDatabaseID(tabId: string): boolean {
  return tabId.startsWith("con")
}

export async function LoadConnections() {
  const connections = await connectionsStore.ListConnections()
  let connectionStore: ConnectionMap = {}

  for (const connection of connections || []) {
    connectionStore[connection.id] = connection
  }

  useStore.setState(
    produce((state: AppState) => {
      state.connections = connectionStore
    })
  )
}

export async function AddConnection(data: connections.ConnectionData) {
  const newConnection = await connectionsStore.CreateConnection(data)

  useStore.setState(
    produce((state: AppState) => {
      state.connections[newConnection.id] = newConnection
    })
  )
}

export async function UpdateConnection(
  connectionId: string,
  data: connections.ConnectionData
) {
  const c = await connectionsStore.UpdateConnection(connectionId, data)

  useStore.setState(
    produce((state: AppState) => {
      state.connections[connectionId] = c
    })
  )
}

export async function RemoveConnection(connectionId: string) {
  useStore.setState(
    produce((state: AppState) => {
      delete state.connections[connectionId]

      for (const tab of Object.keys(state.editor.tabs)) {
        if (state.editor.tabs[tab].connectionId === connectionId) {
          state.editor.tabs[tab].connectionId = null
        }
      }
    })
  )

  await connectionsStore.DeleteConnection(connectionId)

  SaveEditorState()
}

export function BookSelectConnection(bookId: string, connectionId: string) {
  const connection = useStore.getState().connections[connectionId]

  if (!connection) {
    return
  }

  const tab = useStore.getState().editor.tabs[bookId]

  if (!tab) {
    return
  }

  useStore.setState(
    produce((state: AppState) => {
      state.editor.tabs[bookId].connectionId = connection.id
    })
  )

  SaveEditorState()
}
