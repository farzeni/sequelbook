import BookContent from "@app/Book"
import Sidebar from "@app/Sidebar"
import Tabbar from "@app/Tabbar"
import "@assets/css/main.css"
import { InitStore, useStore } from "@hooks/store"
import { Quit, WindowMaximise, WindowMinimise } from "@lib/wailsjs/runtime"
import i18n from "i18next"
import { Minus, Square, X } from "lucide-react"
import { useEffect } from "react"
import { initReactI18next } from "react-i18next"

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
    <div className="flex h-full overflow-hidden ">
      <Sidebar />
      <div className="flex-1 h-full ">
        <div
          className="flex bg-gray-50 border-b"
          style={{ "--wails-draggable": "drag" } as React.CSSProperties}>

          <Tabbar />
          <div className="flex items-center">
            <div className="w-12 h-full flex justify-center items-center  hover:bg-gray-100">
              <Minus className="text-gray-500" size={16} onClick={WindowMinimise} />
            </div>
            <div className="w-12 h-full flex justify-center items-center  hover:bg-gray-100" onClick={WindowMaximise}>
              <Square className="text-gray-500" size={16} />
            </div>
            <div className="w-12 h-full flex justify-center items-center  hover:bg-gray-100" onClick={Quit}>
              <X className="text-gray-500" size={16} />
            </div>
          </div>
        </div>
        <div className="overflow-hidden">
          <BookContent />
        </div>
      </div>
    </div>
  )
}

export default App
