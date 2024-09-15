import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { HashRouter } from "react-router-dom";
import { ThemeUIProvider } from 'theme-ui';
import { theme } from './config/theme';
import Router from "./Router";


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
    return (
        <ThemeUIProvider theme={theme}>
            <HashRouter>
                <Router />
            </HashRouter>
        </ThemeUIProvider>
    )
}

export default App
