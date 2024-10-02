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
  useStore.setState(produce((state: AppState) => {}))

  await connectionsStore.DeleteConnection(connectionId)

  SaveEditorState()
}
