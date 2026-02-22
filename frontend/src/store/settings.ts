import { atom } from "jotai"
import { settingsAtom } from "./atoms"
import type { AppConfig } from "./types"
import * as SettingsService from "@/bindings/github.com/sequelbook/sequelbook/bindings/settingsservice"

// ─── Write atoms ─────────────────────────────────────────────────────────────

/** Load app settings from the backend into the atom. */
export const loadSettingsAtom = atom(null, async (_get, set) => {
  const config = await SettingsService.GetConfig()
  set(settingsAtom, config)
})

/** Persist a settings update to the backend. */
export const saveSettingsAtom = atom(
  null,
  async (get, set, updates: Partial<AppConfig>) => {
    set(settingsAtom, (prev) => ({ ...prev, ...updates }))
    const full = get(settingsAtom)
    await SettingsService.UpdateConfig(full)
  }
)
