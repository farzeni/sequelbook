import { actions } from "./actions"
import type { ActionDef, ActionScope, FocusZone, KeyCombo } from "./types"
import { comboToString, parseCombo } from "./utils"

/** User overrides: action ID -> new key combo (or null to unbind). */
export type KeybindingOverrides = Record<string, KeyCombo | null>

interface KeymapEntry {
  /** Canonical combo string for fast comparison, e.g. "ctrl+shift+Enter" */
  combo: string
  action: ActionDef
}

/**
 * Build a resolved keymap from the action registry + optional user overrides.
 * Returns a lookup that maps `eventCombo -> KeymapEntry[]` so the dispatcher
 * can test scope/when guards in order.
 *
 * Multiple actions may share the same key combo if they have different scopes
 * (e.g. Escape means "focus editor" globally but "back to editor" in results).
 */
export function buildKeymap(overrides: KeybindingOverrides = {}): Map<string, KeymapEntry[]> {
  const map = new Map<string, KeymapEntry[]>()

  for (const action of actions) {
    const override = overrides[action.id]
    if (override === null) continue // explicitly unbound

    const raw = override ?? action.defaultKey
    const parsed = parseCombo(raw)
    const combo = comboToString(parsed)

    const entry: KeymapEntry = { combo, action }
    const existing = map.get(combo)
    if (existing) {
      existing.push(entry)
    } else {
      map.set(combo, [entry])
    }
  }

  return map
}

/**
 * Resolve which action (if any) should fire for a given event combo string
 * and current focus zone.
 *
 * Priority: scoped actions matching the current zone first, then global actions.
 */
export function resolveAction(
  keymap: Map<string, KeymapEntry[]>,
  eventCombo: string,
  focusZone: FocusZone | null,
): ActionDef | null {
  const entries = keymap.get(eventCombo)
  if (!entries) return null

  let globalMatch: ActionDef | null = null

  for (const { action } of entries) {
    if (action.scope === "global") {
      globalMatch ??= action
    } else if (action.scope === focusZone) {
      return action
    }
  }

  return globalMatch
}

/**
 * Get the resolved key combo for a given action ID (accounting for overrides).
 * Returns null if the action is unbound.
 */
export function getActionKeybinding(
  actionId: string,
  overrides: KeybindingOverrides = {},
): KeyCombo | null {
  const override = overrides[actionId]
  if (override === null) return null
  if (override !== undefined) return override

  const action = actions.find((a) => a.id === actionId)
  return action?.defaultKey ?? null
}
