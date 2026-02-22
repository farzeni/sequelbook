import { atom } from "jotai"
import { activeConnectionIdAtom, activeEntryIdAtom, connectionsAtom, connectionStatusAtom, dbSchemaAtom } from "./atoms"
import { openInTabAtom } from "./editor"
import type { ConnectionEntry, ConnectionState } from "./types"
import * as ConnectionService from "@/bindings/github.com/sequelbook/sequelbook/bindings/connectionservice"
import * as SchemaService from "@/bindings/github.com/sequelbook/sequelbook/bindings/schemaservice"
import type { ConnectionConfig } from "@/bindings/github.com/sequelbook/sequelbook/core/connection/models"

// ─── Derived read atoms ───────────────────────────────────────────────────────

/** List of all saved connections as [id, entry] pairs. */
export const connectionListAtom = atom((get) =>
  Object.entries(get(connectionsAtom))
)

// ─── Write atoms ─────────────────────────────────────────────────────────────

/** Load saved connections from backend. */
export const loadConnectionsAtom = atom(null, async (_get, set) => {
  const entries = await ConnectionService.ListSavedConnections()
  set(connectionsAtom, Object.fromEntries(entries.map((e) => [e.id, e])))
})

/** Add or save a connection entry. Returns the saved entry with server-assigned ID. */
export const addConnectionAtom = atom(
  null,
  async (_get, set, entry: ConnectionEntry) => {
    const saved = await ConnectionService.SaveConnection(entry)
    if (!saved) throw new Error("SaveConnection returned null")
    set(connectionsAtom, (prev) => ({ ...prev, [saved.id]: saved }))
    return saved.id
  }
)

/** Update an existing connection entry. */
export const updateConnectionAtom = atom(
  null,
  async (_get, set, entry: ConnectionEntry) => {
    const saved = await ConnectionService.SaveConnection(entry)
    if (!saved) return
    set(connectionsAtom, (prev) => {
      if (!(saved.id in prev)) return prev
      return { ...prev, [saved.id]: saved }
    })
  }
)

/** Remove a saved connection. */
export const removeConnectionAtom = atom(
  null,
  async (get, set, id: string) => {
    await ConnectionService.DeleteConnection(id)
    set(connectionsAtom, (prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    // Clear active connection if this entry was the active one
    if (get(activeEntryIdAtom) === id) {
      set(activeConnectionIdAtom, null)
      set(activeEntryIdAtom, null)
      set(connectionStatusAtom, "disconnected")
    }
  }
)

/** Initiate a connection to a database and open a Database tab. */
export const connectAtom = atom(
  null,
  async (get, set, entry: ConnectionEntry) => {
    set(connectionStatusAtom, "connecting")
    try {
      // If the backend still has a stale connection (frontend state lost track),
      // disconnect it first so the new Connect() call can succeed.
      const status = await ConnectionService.GetConnectionStatus()
      if (status.connected && status.connId) {
        try {
          await ConnectionService.Disconnect(status.connId)
        } catch {
          // best-effort teardown — proceed with connect regardless
        }
      }

      const config: ConnectionConfig = {
        type: entry.type || "postgres",
        host: entry.host,
        port: entry.port,
        database: entry.database,
        user: entry.user,
        password: entry.password,
        sslMode: entry.sslMode || "disable",
      }
      const connId = await ConnectionService.Connect(config)
      set(activeConnectionIdAtom, connId)      // backend manager ID for Disconnect()
      set(activeEntryIdAtom, entry.id)          // settings entry ID for UI
      set(connectionStatusAtom, "connected")
      set(openInTabAtom, { entityType: "connection", entityId: entry.id })

      // Load completion schema for CodeMirror autocompletion.
      try {
        const schema = await SchemaService.GetCompletionSchema(connId)
        set(dbSchemaAtom, { schema, dialect: config.type || "postgres" })
      } catch (err) {
        console.warn("Failed to load completion schema:", err)
      }
    } catch (err) {
      set(connectionStatusAtom, "error")
      set(activeConnectionIdAtom, null)
      set(activeEntryIdAtom, null)
      console.error("connectAtom: connection failed", err)
      throw err
    }
  }
)

/** Disconnect the active connection. */
export const disconnectAtom = atom(
  null,
  async (get, set, connId?: string) => {
    let activeId = connId ?? get(activeConnectionIdAtom) ?? undefined
    try {
      // If frontend lost the connId, ask the backend for the real one.
      if (!activeId) {
        const status = await ConnectionService.GetConnectionStatus()
        if (status.connected && status.connId) {
          activeId = status.connId
        }
      }
      if (activeId) {
        await ConnectionService.Disconnect(activeId)
      }
      set(activeConnectionIdAtom, null)
      set(activeEntryIdAtom, null)
      set(connectionStatusAtom, "disconnected")
      set(dbSchemaAtom, null)
    } catch (err) {
      console.error("disconnectAtom: failed", err)
      throw err
    }
  }
)

/** Receive a connection state change (driven by backend events). */
export const setConnectionStatusAtom = atom(
  null,
  (_get, set, state: ConnectionState) => {
    set(connectionStatusAtom, state)
  }
)
