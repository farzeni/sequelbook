import { atom } from "jotai"
import { blockContentRegistryAtom } from "./atoms"

/** Register a live-content getter for a block. Called when a code cell mounts. */
export const registerBlockContentAtom = atom(
  null,
  (_get, set, args: { blockId: string; getContent: () => string }) => {
    set(blockContentRegistryAtom, (prev) => ({ ...prev, [args.blockId]: args.getContent }))
  }
)

/** Unregister a block's content getter. Called when a code cell unmounts. */
export const unregisterBlockContentAtom = atom(null, (_get, set, blockId: string) => {
  set(blockContentRegistryAtom, (prev) => {
    const next = { ...prev }
    delete next[blockId]
    return next
  })
})
