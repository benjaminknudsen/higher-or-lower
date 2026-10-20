export const INSTALL_URL = 'https://benjaminknudsen.github.io/higher-or-lower/#installer'
export const INSTALL_TEXT = 'Tror du, du kender FC Midtjylland? Prøv FCM Games og udfordr mig!'
export function isAppleMobile(nav) {
  return /iPhone|iPad|iPod/i.test(nav?.userAgent || '') || (/Mac/i.test(nav?.platform || '') && nav?.maxTouchPoints > 1)
}
export function isEmbeddedBrowser(nav) { return /Instagram|FBAN|FBAV|Line\/|TikTok/i.test(nav?.userAgent || '') }
export function createInstallController(win) {
  const media = win.matchMedia('(display-mode: standalone)')
  const standalone = () => media.matches || win.navigator.standalone === true
  let prompt = null, started = false
  let state = { standalone: standalone(), installed: false, available: false, busy: false }
  const listeners = new Set()
  function update(next) { state = { ...state, ...next }; listeners.forEach(listener => listener()) }
  function capture(event) { event.preventDefault(); prompt = event; update({ available: true }) }
  function installed() { prompt = null; update({ installed: true, available: false, busy: false }) }
  function refresh() { update({ standalone: standalone() }) }
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    start() {
      if (started) return
      started = true
      win.addEventListener('beforeinstallprompt', capture)
      win.addEventListener('appinstalled', installed)
      win.addEventListener('pageshow', refresh)
      media.addEventListener?.('change', refresh)
    },
    stop() {
      win.removeEventListener('beforeinstallprompt', capture)
      win.removeEventListener('appinstalled', installed)
      win.removeEventListener('pageshow', refresh)
      media.removeEventListener?.('change', refresh)
      started = false
    },
    async requestInstall() {
      if (state.standalone || state.installed) return 'ready'
      if (state.busy) return 'busy'
      if (!prompt) return 'manual'
      const event = prompt; prompt = null; update({ available: false, busy: true })
      try {
        // Invoke synchronously from the button click to preserve user activation.
        const result = await event.prompt()
        const choice = result?.outcome ? result : await event.userChoice
        return choice?.outcome === 'accepted' ? 'accepted' : 'dismissed'
      } catch { return 'manual' }
      finally { update({ busy: false }) }
    },
  }
}
let controller
export function getInstallController() {
  controller ??= createInstallController(window)
  return controller
}
export async function shareInstallLink(platform = navigator) {
  try {
    if (typeof platform.share === 'function') {
      await platform.share({ title: 'FCM Games', text: INSTALL_TEXT, url: INSTALL_URL })
      return 'shared'
    }
  } catch (error) { if (error?.name === 'AbortError') return 'cancelled' }
  try {
    if (typeof platform.clipboard?.writeText === 'function') { await platform.clipboard.writeText(INSTALL_URL); return 'copied' }
  } catch { /* Offer a selectable link when clipboard permission is denied. */ }
  return 'manual'
}
