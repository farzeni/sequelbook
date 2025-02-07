import Sidebar from "@app/Sidebar"
import "@assets/css/main.css"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@components/ui/resizable"
import { EventBusProvider } from "@hooks/events"
import { ThemeProvider } from "@hooks/theme"
import { InitStore } from "@store"
import i18n from "i18next"
import { useEffect, useState } from "react"
import { initReactI18next } from "react-i18next"
import SettingsDialog from "./Settings"
import Workspace from "./Workspace"

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    // the translations
    // (tip move them in a JSON file and import them,
    // or even better, manage them via a UI: https://react.i18next.com/guides/multiple-translation-files#manage-your-translations-with-a-management-gui)
    resources: {},
    lng: "en",
    fallbackLng: "en",

    interpolation: {
      escapeValue: false // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    }
  });

function App() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    async function Init() {
      await InitStore()
      setInitialized(true)
    }
    if (!initialized) {
      Init()
    }
  }, [initialized])

  if (!initialized) {
    return null
  }

  return (
    <EventBusProvider>
      <ThemeProvider storageKey="sb-ui-theme">
        <div className="flex h-full overflow-hidden ">
          <ResizablePanelGroup
            direction="horizontal"
            className="max-w-full rounded-lg border md:min-w-[450px]"
          >
            <ResizablePanel defaultSize={18} minSize={2.5} >
              <Sidebar />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={82} >
              <Workspace />
            </ResizablePanel>
          </ResizablePanelGroup>
          <SettingsDialog />
        </div>
      </ThemeProvider>
    </EventBusProvider>
  )
}

export default App
