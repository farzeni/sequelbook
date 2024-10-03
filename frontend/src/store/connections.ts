export * from "./books"
export * from "./types"
import { appState } from "@hooks/store"
import * as connectionsStore from "@lib/wailsjs/go/connections/ConnectionStore"
import { connections } from "@lib/wailsjs/go/models"
import { SaveEditorState } from "./editor"
import { ConnectionMap, DatabaseTab, Tab } from "./types"

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

  appState.connections = connectionStore
}

export async function AddConnection(data: connections.ConnectionData) {
  const newConnection = await connectionsStore.CreateConnection(data)

  appState.connections[newConnection.id] = newConnection
}

export async function UpdateConnection(
  connectionId: string,
  data: connections.ConnectionData
) {
  const c = await connectionsStore.UpdateConnection(connectionId, data)

  appState.connections[connectionId] = c
}

export async function RemoveConnection(connectionId: string) {
  await connectionsStore.DeleteConnection(connectionId)

  delete appState.connections[connectionId]

  SaveEditorState()
}
