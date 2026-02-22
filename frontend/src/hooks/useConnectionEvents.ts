import { Events } from "@wailsio/runtime"
import { useSetAtom } from "jotai"
import { useEffect } from "react"
import { activeConnectionIdAtom, activeEntryIdAtom, connectionStatusAtom } from "@/store/atoms"
import type { ConnectionStateChangedPayload } from "@/bindings/github.com/sequelbook/sequelbook/events/models"
import type { ConnectionState } from "@/store/types"

const EVENT_CONNECTION_STATE_CHANGED = "sequelbook:connection-state-changed"

/**
 * Subscribes to backend connection state events and keeps the store in sync.
 * Must be mounted once at the app root after store initialization.
 *
 * Note: activeConnectionIdAtom stores the backend manager connId;
 * activeEntryIdAtom stores the settings entry ID (used by UI components).
 * connectAtom sets both; here we only clear them on disconnect/error since
 * we don't have a connId→entryId mapping from the event alone.
 */
export function useConnectionEvents() {
  const setConnectionStatus = useSetAtom(connectionStatusAtom)
  const setActiveConnectionId = useSetAtom(activeConnectionIdAtom)
  const setActiveEntryId = useSetAtom(activeEntryIdAtom)

  useEffect(() => {
    const unsubscribe = Events.On(EVENT_CONNECTION_STATE_CHANGED, (ev) => {
      const payload = ev.data as ConnectionStateChangedPayload
      const state = payload.state as ConnectionState
      setConnectionStatus(state)

      if (state === "disconnected" || state === "error") {
        setActiveConnectionId(null)
        setActiveEntryId(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [setConnectionStatus, setActiveConnectionId, setActiveEntryId])
}
