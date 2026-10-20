import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './themes.css'
import App from './App.jsx'
import AuthRoot from './components/auth/AuthRoot.jsx'
import './pwa.js'
import { installViewportSizing } from './viewport.js'
import { clearSavedLineupRound } from './services/lineupStorage.js'
import { getInstallController } from './services/installFlow.js'

getInstallController().start()
if (import.meta.hot) import.meta.hot.dispose(() => getInstallController().stop())

clearSavedLineupRound()

// Set the installed app's visible height before React's first render.
const stopViewportSizing = installViewportSizing(window, document)
if (import.meta.hot) import.meta.hot.dispose(stopViewportSizing)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthRoot><App /></AuthRoot>
  </StrictMode>,
)
