import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './pwa.js'
import { installViewportSizing } from './viewport.js'

// Set the installed app's visible height before React's first render.
const stopViewportSizing = installViewportSizing(window, document)
if (import.meta.hot) import.meta.hot.dispose(stopViewportSizing)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
