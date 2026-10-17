import { registerSW } from 'virtual:pwa-register'

// Keep updates out of live games. No changes to gameplay or localStorage.
let updateReady = false
let registration
let lastCheck = 0

function applyMenuUpdate() {
  if (updateReady && !window.location.hash.startsWith('#spil/')) {
    updateReady = false
    updateSW(true).catch(() => { updateReady = true })
  }
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateReady = true
    applyMenuUpdate()
  },
  onRegisteredSW(_url, swRegistration) {
    registration = swRegistration
  },
  onRegisterError() {
    // Normal online play remains available if a browser blocks registration.
    console.warn('Offline-funktionen kunne ikke aktiveres. Prøv igen, når du er online.')
  },
})

function checkForUpdate() {
  applyMenuUpdate()
  if (document.visibilityState !== 'visible' || !navigator.onLine || !registration) return
  if (Date.now() - lastCheck < 60_000) return
  lastCheck = Date.now()
  registration.update().catch(() => { /* Offline or transient network errors are harmless. */ })
}

window.addEventListener('hashchange', applyMenuUpdate)
window.addEventListener('online', checkForUpdate)
document.addEventListener('visibilitychange', checkForUpdate)
