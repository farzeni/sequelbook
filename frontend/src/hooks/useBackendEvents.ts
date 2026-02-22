import { Events } from "@wailsio/runtime"
import { useSetAtom } from "jotai"
import { useEffect } from "react"
import { activeConnectionIdAtom, activeEntryIdAtom, connectionStatusAtom } from "@/store/atoms"
import { toaster } from "@/components/ui/toaster"
import type { ConnectionStateChangedPayload, NotificationPayload } from "@/bindings/github.com/sequelbook/sequelbook/events/models"
import { Severity } from "@/bindings/github.com/sequelbook/sequelbook/events/models"
import type { ConnectionState } from "@/store/types"

// Event name constants — must match Go events/ package
const EVENT_CONNECTION_STATE_CHANGED = "sequelbook:connection-state-changed"
const EVENT_QUERY_STARTED = "sequelbook:query-started"
const EVENT_QUERY_COMPLETED = "sequelbook:query-completed"
const EVENT_QUERY_FAILED = "sequelbook:query-failed"
const EVENT_QUERY_CANCELLED = "sequelbook:query-cancelled"
const EVENT_NOTIFICATION = "sequelbook:notification"

/**
 * Subscribes to all backend events and keeps the store in sync.
 * Must be mounted once at the app root after store initialization.
 *
 * Consolidates useConnectionEvents + adds query and notification event handling.
 */
export function useBackendEvents() {
  const setConnectionStatus = useSetAtom(connectionStatusAtom)
  const setActiveConnectionId = useSetAtom(activeConnectionIdAtom)
  const setActiveEntryId = useSetAtom(activeEntryIdAtom)

  useEffect(() => {
    const unsubs: (() => void)[] = []

    // ─── Connection state ──────────────────────────────────────────────
    unsubs.push(
      Events.On(EVENT_CONNECTION_STATE_CHANGED, (ev) => {
        const payload = ev.data as ConnectionStateChangedPayload
        const state = payload.state as ConnectionState
        setConnectionStatus(state)

        if (state === "disconnected" || state === "error") {
          setActiveConnectionId(null)
          setActiveEntryId(null)
        }
      })
    )

    // ─── Query lifecycle (prep for Phase 4 — handlers are stubs) ──────
    unsubs.push(
      Events.On(EVENT_QUERY_STARTED, (ev) => {
        console.debug("event:query-started", ev.data)
      })
    )

    unsubs.push(
      Events.On(EVENT_QUERY_COMPLETED, (ev) => {
        console.debug("event:query-completed", ev.data)
      })
    )

    unsubs.push(
      Events.On(EVENT_QUERY_FAILED, (ev) => {
        console.debug("event:query-failed", ev.data)
      })
    )

    unsubs.push(
      Events.On(EVENT_QUERY_CANCELLED, (ev) => {
        console.debug("event:query-cancelled", ev.data)
      })
    )

    // ─── Notifications → Chakra toast ──────────────────────────────────
    unsubs.push(
      Events.On(EVENT_NOTIFICATION, (ev) => {
        const payload = ev.data as NotificationPayload
        const type = severityToToastType(payload.severity)
        toaster.create({
          title: payload.title,
          description: payload.message,
          type,
        })
      })
    )

    return () => {
      for (const unsub of unsubs) unsub()
    }
  }, [setConnectionStatus, setActiveConnectionId, setActiveEntryId])
}

function severityToToastType(severity: Severity | string): "info" | "warning" | "error" | "success" {
  switch (severity) {
    case Severity.SeverityWarning:
    case "warning":
      return "warning"
    case Severity.SeverityError:
    case "error":
      return "error"
    default:
      return "info"
  }
}
