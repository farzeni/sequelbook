import Sidebar from "@app/Sidebar"
import Tabbar from "@app/Tabbar"
import "@assets/css/main.css"
import { EventBusProvider } from "@hooks/events"
import { InitStore } from "@store"
import i18n from "i18next"
import { useEffect } from "react"
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


  useEffect(() => {
    InitStore()
  }, [])

  return (
    <EventBusProvider>
      <div className="flex h-full overflow-hidden ">
        <Sidebar />
        <div className="flex-1 h-full ">
          <div
            className="flex bg-gray-50 border-b"
            style={{ "--wails-draggable": "drag" } as React.CSSProperties}>

            <Tabbar />
            {/* FRAMELESS CONTROL BTNs */}
            {/* <div className="flex items-center">
            <div className="w-12 h-full flex justify-center items-center  hover:bg-gray-100">
              <Minus className="text-gray-500" size={16} onClick={WindowMinimise} />
            </div>
            <div className="w-12 h-full flex justify-center items-center  hover:bg-gray-100" onClick={WindowMaximise}>
              <Square className="text-gray-500" size={16} />
            </div>
            <div className="w-12 h-full flex justify-center items-center  hover:bg-gray-100" onClick={Quit}>
              <X className="text-gray-500" size={16} />
            </div>
          </div> */}
          </div>
          <div className="overflow-hidden">
            <Workspace />
          </div>
        </div>
      </div>
    </EventBusProvider>
  )
}

export default App
