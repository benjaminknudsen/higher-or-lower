import { useEffect, useState } from 'react'
import { browserStorage, highScoreKey, readHighScore, saveHighScore } from '../game/highScore'

// GameScreen keys a session by club/mode. Keep the opening record for this run.
export default function useHighScore(clubId, modeId, score, enabled) {
  const key = highScoreKey(clubId, modeId)
  const [record, setRecord] = useState(() => {
    const stored = readHighScore(browserStorage(), key)
    return { ...stored, openingValue: stored.value }
  })

  const saveScore = (nextScore) => {
    if (!enabled) return
    const next = saveHighScore(browserStorage(), key, nextScore, record.value)
    setRecord((previous) => next.value === previous.value && next.persisted === previous.persisted ? previous : { ...previous, ...next })
  }

  useEffect(() => {
    const sync = (event) => {
      if (event.key !== key && event.key !== null) return
      setRecord((previous) => ({ ...previous, ...readHighScore(browserStorage(), key, previous.value) }))
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [key])

  return {
    saveScore,
    highScore: Math.max(record.value, enabled ? score : 0),
    isNewRecord: enabled && score > record.openingValue && score >= record.value,
    persisted: record.persisted,
  }
}
