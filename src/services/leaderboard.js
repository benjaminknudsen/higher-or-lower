import { leaderboardDemo } from '../data/leaderboardDemo.js'

// Entry: {id, name, score, isSelf, rank}. Equal scores share a rank;
// IDs provide a deterministic display order, independent of the incoming order.
export function rankLeaderboard(entries) {
  const seen = new Set()
  const sorted = entries.filter(entry => {
    if (!entry.id || seen.has(entry.id) || !entry.name || !Number.isSafeInteger(entry.score) || entry.score < 0) return false
    seen.add(entry.id)
    return true
  }).map(entry => ({ ...entry })).sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  let rank = 0
  return sorted.map((entry, index) => {
    if (index === 0 || entry.score !== sorted[index - 1].score) rank = index + 1
    return { ...entry, rank }
  })
}

// Async repository boundary: a future Supabase adapter returns the same model.
// At that point the server must supply ranks and authenticate the current user.
export const leaderboardRepository = {
  async list({ modeId, profileName, highScore }) {
    if (modeId !== 'appearances') return { source: 'demo', entries: [] }
    return {
      source: 'demo',
      entries: rankLeaderboard([
        ...leaderboardDemo,
        { id: 'local:self', name: profileName, score: highScore, isSelf: true },
      ]),
    }
  },
}
