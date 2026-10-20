const STORAGE_KEY = 'fcm.guest-top-results.v1'
const CHANGE_EVENT = 'fcm-guest-top-results-changed'

function validAttempt(attempt) {
  return attempt && typeof attempt.id === 'string' && Number.isSafeInteger(attempt.score)
    && attempt.score >= 0 && Number.isFinite(Date.parse(attempt.createdAt))
}

export function rankTopResults(attempts) {
  const unique = new Map()
  for (const attempt of attempts) {
    if (validAttempt(attempt) && !unique.has(attempt.id)) unique.set(attempt.id, attempt)
  }
  return [...unique.values()]
    .sort((a, b) => b.score - a.score || Date.parse(a.createdAt) - Date.parse(b.createdAt)
      || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, 3)
}

export function createLocalTopResults(storage) {
  function readAll() {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return { appearances: [], goals: [], lineup: [] }
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error('Dine lokale bedste forsøg kunne ikke læses.')
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Dine lokale bedste forsøg har et ugyldigt format.')
    }
    const results = {}
    for (const gameType of ['appearances', 'goals', 'lineup']) {
      const attempts = parsed[gameType] ?? []
      if (!Array.isArray(attempts) || attempts.some(attempt => !validAttempt(attempt))) {
        throw new Error('Dine lokale bedste forsøg har et ugyldigt format.')
      }
      results[gameType] = rankTopResults(attempts)
    }
    return results
  }
  function write(results) {
    if (!storage) throw new Error('Lokal lagring er ikke tilgængelig.')
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(results))
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
    } catch {
      throw new Error('Dine lokale bedste forsøg kunne ikke gemmes.')
    }
  }
  return {
    list(gameType) {
      if (!['appearances', 'goals', 'lineup'].includes(gameType)) throw new Error('Ugyldig spiltype.')
      return readAll()[gameType]
    },
    record(gameType, attempt) {
      if (!['appearances', 'goals', 'lineup'].includes(gameType) || !validAttempt(attempt)) {
        throw new Error('Forsøget kunne ikke gemmes, fordi dataene er ugyldige.')
      }
      const results = readAll()
      results[gameType] = rankTopResults([...results[gameType], attempt])
      write(results)
      return results[gameType]
    },
  }
}

export { CHANGE_EVENT as LOCAL_TOP_RESULTS_CHANGE_EVENT }
