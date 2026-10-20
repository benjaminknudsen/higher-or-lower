import { useSyncExternalStore } from 'react'
import { applyTheme, normalizeTheme, saveTheme, THEME_KEY } from '../services/theme'
const eventName = 'fcm-theme-change'
function subscribe(listener) {
  const sync = event => {
    if (event.key !== THEME_KEY && event.key !== null) return
    applyTheme(event.newValue)
    listener()
  }
  window.addEventListener(eventName, listener)
  window.addEventListener('storage', sync)
  return () => { window.removeEventListener(eventName,listener); window.removeEventListener('storage',sync) }
}
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, () => normalizeTheme(document.documentElement.dataset.theme))
  function toggle() {
    let storage
    try { storage = window.localStorage } catch { /* Session-only theme. */ }
    saveTheme(theme === 'neon' ? 'fcm' : 'neon', storage)
    window.dispatchEvent(new Event(eventName))
  }
  return <button type="button" className="theme-toggle" onClick={toggle} aria-label={`Aktivt tema: ${theme === 'fcm' ? 'FCM' : 'Neon'}. Skift til ${theme === 'fcm' ? 'Neon' : 'FCM'}`} aria-pressed={theme === 'fcm'} title={`Tema: ${theme === 'fcm' ? 'FCM' : 'Neon'} · Skift tema`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.5-3.3 1.8 1.8 0 0 1 1.4-3H18a3 3 0 0 0 3-3A8.8 8.8 0 0 0 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="7.5" cy="10" r="1.5" fill="var(--color-primary)" /><circle cx="11" cy="6.8" r="1.5" fill="var(--color-secondary)" /><circle cx="16" cy="8" r="1.5" fill="var(--color-text)" /></svg><span>{theme === 'fcm' ? 'FCM' : 'Neon'}</span></button>
}
