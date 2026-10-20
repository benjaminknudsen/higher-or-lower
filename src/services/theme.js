export const THEME_KEY = 'fcm-games:theme:v1'
export const normalizeTheme = value => value === 'fcm' ? 'fcm' : 'neon'
export function readTheme(storage) {
  try { return normalizeTheme(storage.getItem(THEME_KEY)) } catch { return 'neon' }
}
export function applyTheme(theme, doc = document) {
  const value = normalizeTheme(theme)
  doc.documentElement.dataset.theme = value
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', value === 'fcm' ? '#0D0D10' : '#161625')
  return value
}
export function saveTheme(theme, storage, doc = document) {
  const value = applyTheme(theme, doc)
  try { storage?.setItem(THEME_KEY, value) } catch { /* Keep the choice for this session if storage is denied. */ }
  return value
}
