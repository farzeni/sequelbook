import type { Getter, Setter } from "jotai"

/** Focus zones map 1:1 with UI regions that own distinct keybinding contexts. */
export type FocusZone = "editor" | "results" | "sidebar"

/**
 * Scope determines when an action's keybinding is active:
 * - "global"  — always active regardless of focus zone
 * - other     — active only when the matching FocusZone is focused
 */
export type ActionScope = "global" | FocusZone

/** Modifier-aware key combination string, e.g. "Ctrl+Shift+Enter". */
export type KeyCombo = string

/** Context passed to `when` guards so actions can inspect app state. */
export interface ActionContext {
  focusZone: FocusZone | null
  activeBlockType: string | null
  hasActiveTab: boolean
  hasActiveBook: boolean
}

/** Jotai store accessors forwarded to action handlers. */
export interface ActionStore {
  get: Getter
  set: Setter
}

export interface ActionDef {
  /** Unique action identifier, e.g. "execute-block". */
  id: string
  /** Human-readable label shown in command palette and tooltips. */
  label: string
  /** Optional longer description for the command palette. */
  description?: string
  /** Keybinding scope. */
  scope: ActionScope
  /** Default key combination. Platforms use Ctrl on Linux/Windows, Cmd on Mac. */
  defaultKey: KeyCombo
  /**
   * Optional guard — return false to skip this action even when keybinding matches.
   * Used for context-sensitive actions (e.g. execute-block only on query blocks).
   */
  when?: (ctx: ActionContext) => boolean
  /** The handler. Receives Jotai get/set so it can read/write atoms. */
  execute: (store: ActionStore) => void | Promise<void>
}
