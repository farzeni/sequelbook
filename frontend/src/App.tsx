import { useAtomValue, useSetAtom } from "jotai"
import { useEffect, useState } from "react"
import { Group, Panel, Separator } from "react-resizable-panels"
import Sidebar from "./components/Sidebar"
import Workspace from "./components/Workspace"
import { Toaster } from "./components/ui/toaster"
import { useAutoSave } from "./hooks/useAutoSave"
import { useBackendEvents } from "./hooks/useBackendEvents"
import { useKeyboardShortcuts, useFocusZone } from "./shortcuts"
import { initStoreAtom, settingsAtom } from "./store"

function App() {
  const [initialized, setInitialized] = useState(false)
  const initStore = useSetAtom(initStoreAtom)
  const settings = useAtomValue(settingsAtom)

  useBackendEvents()
  useAutoSave()
  useFocusZone()
  useKeyboardShortcuts()

  useEffect(() => {
    initStore().then(() => setInitialized(true))
  }, [])

  useEffect(() => {
    const size = settings.fontSize && settings.fontSize > 0 ? settings.fontSize : 14
    document.documentElement.style.setProperty("--app-font-size", `${size}px`)
  }, [settings.fontSize])

  if (!initialized) {
    return null
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Toaster />
      <Group orientation="horizontal" style={{ height: "100%", width: "100%" }}>
        <Panel defaultSize={18} minSize={3}>
          <Sidebar />
        </Panel>
        <Separator
          style={{
            width: "1px",
            background: "var(--chakra-colors-border)",
            cursor: "col-resize",
          }}
        />
        <Panel defaultSize={82}>
          <Workspace />
        </Panel>
      </Group>
    </div>
  )
}

export default App
