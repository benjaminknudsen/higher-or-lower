import { LINEUP_KEY, readStore } from '../game/lineup.js'
function browserStorage() {
  try { return window.localStorage } catch { return null }
}
// The round is session-only. Keep completed results and match-selection history.
export function loadLineupStore(storage = browserStorage()) {
  return { ...readStore(storage), round: null }
}
export function saveLineupStore(store, storage = browserStorage()) {
  try {
    storage.setItem(LINEUP_KEY, JSON.stringify({ ...store, round: null }))
    return true
  } catch { return false }
}
export function clearSavedLineupRound(storage = browserStorage()) {
  try {
    const saved = JSON.parse(storage.getItem(LINEUP_KEY))
    if (saved?.version === 1 && saved.round != null) {
      storage.setItem(LINEUP_KEY, JSON.stringify({ ...saved, round: null }))
    }
  } catch { /* Blocked or invalid storage cannot restore a round either. */ }
}
