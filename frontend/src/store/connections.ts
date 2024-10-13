export * from "./books"
export * from "./types"
import { appState } from "@hooks/store"
import * as connectionsStore from "@lib/wailsjs/go/connections/ConnectionStore"
import { connections } from "@lib/wailsjs/go/models"
import * as pooler from "@lib/wailsjs/go/runners/Pooler"
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

export async function GetConnectionTables(connectionId: string) {
  // const tables = await connectionsStore.GetConnectionTables(connectionId)
  // return tables
}

export async function Query(connectionId: string, query: string) {
  const tab = appState.editor.tabs[appState.editor.current.tabId || ""]

  if (!tab || tab.type !== "book") {
    console.debug("No tab selected")
    return
  }

  const connection = appState.connections[connectionId]

  if (!connection) {
    console.debug("No connection found")
    return
  }

  console.debug("Executing query", connectionId, query)
  const result = await pooler.Query(connection, query)

  return result
}

export async function SelectTable(tabId: string, tableName: string | null) {
  const tab = appState.editor.tabs[tabId]

  if (!tab || tab.type !== "connection") {
    return
  }

  tab.table = tableName

  console.debug("SelectTable", tabId, tableName)

  SaveEditorState()
}

export async function GetTableData(connectionId: string, tableName: string) {
  const connection = appState.connections[connectionId]

  if (!connection) {
    console.debug("No connection found")
    return
  }

  const q = "SELECT * FROM " + tableName

  console.debug("GetTableData: exec", connectionId, q)
  const data = await pooler.Query(connection, q)

  return data
}
