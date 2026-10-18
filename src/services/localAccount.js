import { browserStorage } from '../game/highScore.js'

export const PROFILE_KEY = 'fcm-higher-or-lower:profile:v1'
export const STATISTICS_PREFIX = 'fcm-higher-or-lower:game-stats:v1:'
export const ACCOUNT_EVENT = 'fcm-account-change'

export function normalizeProfileName(value) {
  const clean = typeof value === 'string' ? Array.from(value).filter(char => char.codePointAt(0) >= 32 && char.codePointAt(0) !== 127).join('') : ''
  return Array.from(clean.trim().replace(/\s+/g, ' ')).slice(0, 24).join('') || 'FCM-fan'
}

function validGame(value) {
  return value?.version === 1 && typeof value.clubId === 'string' && typeof value.modeId === 'string'
    && [value.answers, value.correct, value.lastQuestion].every(Number.isSafeInteger)
    && value.answers > 0 && value.correct >= 0 && value.correct <= value.answers && value.lastQuestion >= value.answers
}

// Profile: {name}. Game statistics: one small record per played session.
// Separate session keys prevent two open games from overwriting each other's totals.
export function createLocalAccountStore(getStorage = browserStorage, notify = () => {}) {
  let fallbackProfile = { name: 'FCM-fan' }
  let unsavedProfile = false
  const fallbackGames = new Map()
  let persistent = true
  function storage() {
    try {
      const value = getStorage()
      if (!value) persistent = false
      return value
    } catch { persistent = false; return null }
  }
  function read(key) {
    let raw
    try { raw = storage()?.getItem(key) } catch { persistent = false; return null }
    try { return JSON.parse(raw ?? 'null') } catch { return null }
  }
  function write(key, value) {
    try {
      const target = storage()
      if (!target) return false
      target.setItem(key, JSON.stringify(value))
      return true
    } catch { persistent = false; return false }
  }
  function loadProfile() {
    if (unsavedProfile) return fallbackProfile
    const saved = read(PROFILE_KEY)
    return saved?.version === 1 ? { name: normalizeProfileName(saved.name) } : fallbackProfile
  }
  function saveProfile(name) {
    fallbackProfile = { name: normalizeProfileName(name) }
    unsavedProfile = !write(PROFILE_KEY, { version: 1, ...fallbackProfile })
    notify()
    return fallbackProfile
  }
  function readGame(key) {
    const saved = read(key)
    const fallback = fallbackGames.get(key)
    return validGame(fallback) && (!validGame(saved) || fallback.lastQuestion > saved.lastQuestion) ? fallback : validGame(saved) ? saved : null
  }
  function recordAnswer({ sessionId, clubId, modeId, questionId, correct }) {
    if (!sessionId || !clubId || !modeId || !Number.isSafeInteger(questionId) || questionId < 1 || typeof correct !== 'boolean') return false
    const key = STATISTICS_PREFIX + encodeURIComponent(sessionId)
    const previous = readGame(key)
    if (previous && (previous.lastQuestion >= questionId || previous.clubId !== clubId || previous.modeId !== modeId)) return false
    const game = { version: 1, clubId, modeId, lastQuestion: questionId, answers: (previous?.answers ?? 0) + 1, correct: (previous?.correct ?? 0) + Number(correct) }
    if (write(key, game)) fallbackGames.delete(key)
    else fallbackGames.set(key, game)
    notify()
    return true
  }
  function loadStatistics(clubId) {
    const keys = new Set(fallbackGames.keys())
    try {
      const target = storage()
      for (let index = 0; index < (target?.length ?? 0); index++) {
        const key = target.key(index)
        if (key?.startsWith(STATISTICS_PREFIX)) keys.add(key)
      }
    } catch { persistent = false }
    const games = [...keys].map(readGame).filter(game => game?.clubId === clubId)
    const answers = games.reduce((sum, game) => sum + game.answers, 0)
    const correct = games.reduce((sum, game) => sum + game.correct, 0)
    return { gamesPlayed: games.length, answers, correct, accuracy: answers ? Math.round(correct / answers * 100) : 0 }
  }
  return { loadProfile, saveProfile, recordAnswer, loadStatistics, get persistent() { return persistent } }
}

export const localAccountStore = createLocalAccountStore(browserStorage, () => {
  window.dispatchEvent(new Event(ACCOUNT_EVENT))
})
