const isScore = (value) => Number.isSafeInteger(value) && value >= 0

export function highScoreKey(clubId, modeId) {
  return `fcm-higher-or-lower:highscore:v1:${encodeURIComponent(clubId)}:${encodeURIComponent(modeId)}`
}

export function browserStorage() {
  try { return window.localStorage } catch { return null }
}

export function readHighScore(storage, key, fallback = 0) {
  try {
    const raw = storage?.getItem(key)
    const value = typeof raw === 'string' && /^(0|[1-9]\d*)$/.test(raw) ? Number(raw) : 0
    return { value: Math.max(isScore(value) ? value : 0, isScore(fallback) ? fallback : 0), persisted: Boolean(storage) }
  } catch { return { value: isScore(fallback) ? fallback : 0, persisted: false } }
}

export function saveHighScore(storage, key, score, previous = 0) {
  const stored = readHighScore(storage, key, previous)
  const value = Math.max(stored.value, isScore(score) ? score : 0)
  try {
    if (!storage || !stored.persisted) return { value, persisted: false }
    // Read before writing so a higher record from another tab is not overwritten.
    if (storage.getItem(key) !== String(value)) storage.setItem(key, String(value))
    return { value, persisted: true }
  } catch { return { value, persisted: false } }
}
