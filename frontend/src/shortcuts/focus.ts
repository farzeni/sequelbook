import { atom, useSetAtom } from "jotai"
import { useEffect } from "react"
import type { FocusZone } from "./types"

/** The currently active focus zone. Null means no specific zone (treated as global). */
export const focusZoneAtom = atom<FocusZone | null>(null)

/** Data attribute name used on DOM elements to declare their focus zone. */
const FOCUS_ZONE_ATTR = "data-focus-zone"

/**
 * Walks up from `el` looking for the nearest ancestor (or self) with
 * a `data-focus-zone` attribute. Returns the zone value or null.
 */
function detectZone(el: Element | null): FocusZone | null {
  let current = el
  while (current) {
    const zone = current.getAttribute(FOCUS_ZONE_ATTR)
    if (zone) return zone as FocusZone
    current = current.parentElement
  }
  return null
}

/**
 * Mount once at the app root. Listens for focusin/focusout on the window and
 * updates `focusZoneAtom` based on the `data-focus-zone` attribute of the
 * focused element's nearest zone ancestor.
 */
export function useFocusZone() {
  const setZone = useSetAtom(focusZoneAtom)

  useEffect(() => {
    function handleFocusIn(e: FocusEvent) {
      const zone = detectZone(e.target as Element | null)
      setZone(zone)
    }

    function handleFocusOut(e: FocusEvent) {
      if (!e.relatedTarget) {
        setZone(null)
      }
    }

    window.addEventListener("focusin", handleFocusIn)
    window.addEventListener("focusout", handleFocusOut)
    return () => {
      window.removeEventListener("focusin", handleFocusIn)
      window.removeEventListener("focusout", handleFocusOut)
    }
  }, [setZone])
}
