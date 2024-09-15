import { ColorModeScript } from '@chakra-ui/react'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import theme from './config/theme'

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <App />
    </React.StrictMode>
)
