import Sidebar from "@app/Sidebar"
import "@assets/css/main.css"
import { EventBusProvider } from "@hooks/events"
import { InitStore } from "@store"
import i18n from "i18next"
import { useEffect, useState } from "react"
import { initReactI18next } from "react-i18next"
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

  return (
    <EventBusProvider>
      <div className="flex h-full overflow-hidden ">
        <Sidebar />
        <Workspace />
      </div>
    </EventBusProvider>
  )
}

export default App
