import { atom } from "jotai"
import { blockFocusRegistryAtom } from "./atoms"

/** Register a focus function for a block. Called when a cell mounts. */
export const registerBlockFocusAtom = atom(
  null,
  (_get, set, args: { blockId: string; focus: () => void }) => {
    set(blockFocusRegistryAtom, (prev) => ({ ...prev, [args.blockId]: args.focus }))
  }
)

/** Unregister a block's focus function. Called when a cell unmounts. */
export const unregisterBlockFocusAtom = atom(null, (_get, set, blockId: string) => {
  set(blockFocusRegistryAtom, (prev) => {
    const next = { ...prev }
    delete next[blockId]
    return next
  })
})
