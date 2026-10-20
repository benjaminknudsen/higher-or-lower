import { useEffect, useState } from 'react'
import { browserStorage, highScoreKey, readHighScore, saveHighScore } from '../game/highScore'
import useAuthAccount from './useAuthAccount.js'
import useOnlineStats from './useOnlineStats.js'

// GameScreen keys a session by club/mode. Keep the opening record for this run.
export default function useHighScore(clubId, modeId, score, enabled) {
  const account = useAuthAccount()
  const signedIn = account.status === 'signed-in' && Boolean(account.userId)
  const online = useOnlineStats(signedIn ? account.userId : null, modeId)
  const key = highScoreKey(clubId, modeId)
  const [record, setRecord] = useState(() => {
    const stored = readHighScore(browserStorage(), key)
    return { ...stored, openingValue: stored.value }
  })

  const saveScore = (nextScore) => {
    if (!enabled || account.status !== 'guest') return
    const next = saveHighScore(browserStorage(), key, nextScore, record.value)
    setRecord((previous) => next.value === previous.value && next.persisted === previous.persisted ? previous : { ...previous, ...next })
  }

  useEffect(() => {
    if (signedIn) return undefined
    const sync = (event) => {
      if (event.key !== key && event.key !== null) return
      setRecord((previous) => ({ ...previous, ...readHighScore(browserStorage(), key, previous.value) }))
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [key, signedIn])

  const value = signedIn ? (online.stats.best_score ?? 0) : account.status === 'guest' ? record.value : 0
  const openingValue = signedIn ? (online.stats.best_score ?? 0) : account.status === 'guest' ? record.openingValue : 0

  return {
    saveScore,
    highScore: Math.max(value, enabled ? score : 0),
    isNewRecord: enabled && score > openingValue && score >= value,
    persisted: signedIn ? !online.error : account.status === 'guest' && record.persisted,
    loading: signedIn && online.loading,
    error: signedIn ? online.error : '',
  }
}
