import { useEffect, useState } from 'react'
import { leaderboardRepository } from '../services/leaderboard'

export default function useLeaderboard(modeId, profileName, highScore) {
  const [result, setResult] = useState({ source: 'demo', entries: [], loading: true, failed: false })
  useEffect(() => {
    let current = true
    leaderboardRepository.list({ modeId, profileName, highScore }).then(data => {
      if (current) setResult({ ...data, loading: false, failed: false })
    }).catch(() => {
      if (current) setResult({ source: 'demo', entries: [], loading: false, failed: true })
    })
    return () => { current = false }
  }, [modeId, profileName, highScore])
  return result
}
