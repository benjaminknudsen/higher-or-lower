import { useEffect, useState } from 'react'
import { onlinePlatform } from '../services/onlinePlatformRuntime.js'

const empty = gameType => ({
  game_type: gameType, games_played: 0, best_score: 0, total_answers: 0,
  total_correct: 0, perfect_games: 0,
})

export default function useOnlineStats(userId, gameType) {
  const key = userId ? `${userId}:${gameType}` : ''
  const [result, setResult] = useState({ key: '', stats: empty(gameType), loading: false, error: '' })
  useEffect(() => {
    let current = true
    if (!userId) return () => { current = false }
    onlinePlatform.getStats(userId, gameType).then(stats => {
      if (current) setResult({ key, stats, loading: false, error: '' })
    }).catch(error => {
      if (current) setResult({ key, stats: empty(gameType), loading: false, error: error.message })
    })
    return () => { current = false }
  }, [userId, gameType, key])
  if (result.key !== key) return { stats: empty(gameType), loading: Boolean(userId), error: '' }
  return { stats: result.stats, loading: result.loading, error: result.error }
}
