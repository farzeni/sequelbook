import { useSetAtom } from "jotai"
import { useEffect } from "react"
import { autoSaveAtom } from "@/store/books"

const AUTO_SAVE_INTERVAL_MS = 2000

/** Periodically saves all dirty books to disk. Mount once in App. */
export function useAutoSave() {
  const saveAllDirty = useSetAtom(autoSaveAtom)

  useEffect(() => {
    const id = setInterval(() => {
      saveAllDirty()
    }, AUTO_SAVE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [saveAllDirty])
}
