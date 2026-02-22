import type { KeyCombo } from "./types"

export const isMac =
  typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

/** Canonical modifier order used for keymap lookups. */
const MODIFIER_ORDER = ["ctrl", "alt", "shift", "meta"] as const

interface ParsedCombo {
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
  key: string
}

/**
 * Parse a human-readable key combo string ("Ctrl+Shift+Enter") into a
 * normalised form suitable for matching against KeyboardEvents.
 *
 * "Mod" is treated as "Meta" on macOS, "Ctrl" elsewhere.
 */
export function parseCombo(combo: KeyCombo): ParsedCombo {
  const parts = combo.split("+").map((p) => p.trim())
  const parsed: ParsedCombo = { ctrl: false, alt: false, shift: false, meta: false, key: "" }

  for (const part of parts) {
    const lower = part.toLowerCase()
    if (lower === "ctrl" || lower === "control") {
      parsed.ctrl = true
    } else if (lower === "alt" || lower === "option") {
      parsed.alt = true
    } else if (lower === "shift") {
      parsed.shift = true
    } else if (lower === "meta" || lower === "cmd" || lower === "command") {
      parsed.meta = true
    } else if (lower === "mod") {
      if (isMac) parsed.meta = true
      else parsed.ctrl = true
    } else {
      parsed.key = normalizeKeyName(part)
    }
  }
  return parsed
}

/** Convert a KeyboardEvent into the same normalised combo string used as map keys. */
export function eventToCombo(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey) parts.push("ctrl")
  if (e.altKey) parts.push("alt")
  if (e.shiftKey) parts.push("shift")
  if (e.metaKey) parts.push("meta")
  parts.push(normalizeKeyName(e.key))
  return parts.join("+")
}

/** Build the canonical combo string from a ParsedCombo (used as map key). */
export function comboToString(parsed: ParsedCombo): string {
  const parts: string[] = []
  for (const mod of MODIFIER_ORDER) {
    if (parsed[mod]) parts.push(mod)
  }
  parts.push(parsed.key)
  return parts.join("+")
}

/**
 * Format a KeyCombo for display to the user, using platform-appropriate symbols.
 * e.g. "Ctrl+Shift+Enter" → "⌘⇧↵" on Mac, "Ctrl+Shift+Enter" on Linux/Windows.
 */
export function formatShortcut(combo: KeyCombo): string {
  const parsed = parseCombo(combo)

  if (isMac) {
    const parts: string[] = []
    if (parsed.ctrl) parts.push("⌃")
    if (parsed.alt) parts.push("⌥")
    if (parsed.shift) parts.push("⇧")
    if (parsed.meta) parts.push("⌘")
    parts.push(displayKeyMac(parsed.key))
    return parts.join("")
  }

  const parts: string[] = []
  if (parsed.ctrl) parts.push("Ctrl")
  if (parsed.alt) parts.push("Alt")
  if (parsed.shift) parts.push("Shift")
  if (parsed.meta) parts.push("Super")
  parts.push(displayKeyLinux(parsed.key))
  return parts.join("+")
}

function normalizeKeyName(key: string): string {
  const map: Record<string, string> = {
    arrowup: "ArrowUp",
    arrowdown: "ArrowDown",
    arrowleft: "ArrowLeft",
    arrowright: "ArrowRight",
    enter: "Enter",
    return: "Enter",
    escape: "Escape",
    esc: "Escape",
    backspace: "Backspace",
    delete: "Delete",
    tab: "Tab",
    space: " ",
    pageup: "PageUp",
    pagedown: "PageDown",
    home: "Home",
    end: "End",
  }
  return map[key.toLowerCase()] ?? key
}

function displayKeyMac(key: string): string {
  const map: Record<string, string> = {
    Enter: "↵",
    Backspace: "⌫",
    Delete: "⌦",
    Escape: "⎋",
    Tab: "⇥",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    " ": "Space",
  }
  return map[key] ?? key
}

function displayKeyLinux(key: string): string {
  const map: Record<string, string> = {
    " ": "Space",
    "\\": "\\",
  }
  return map[key] ?? key
}
