import BookContent from "@app/Book"
import Sidebar from "@app/Sidebar"
import Tabbar from "@app/Tabbar"
import "@assets/css/main.css"
import { useBooks } from "@hooks/books"
import i18n from "i18next"
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
  const { getBooks } = useBooks()

  useEffect(() => {
    getBooks()
  }, [])

  return (
    <div className="flex h-full overflow-hidden ">
      <Sidebar />
      <div className="flex-1 h-full ">
        <Tabbar />
        <div className="overflow-hidden">
          <BookContent />
        </div>
      </div>
    </div>
  )
}

export default App
