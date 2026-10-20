import { useCallback, useEffect, useRef, useState } from 'react'
import { onlineGameResults } from '../services/onlineGameResultsRuntime.js'

export default function useOnlineResultSync(userId, result) {
  const [state, setState] = useState({ id: '', status: 'idle', message: '' })
  const [retryToken, setRetryToken] = useState(0)
  const submitted = useRef(new Set())
  const inFlight = useRef(new Set())
  const resultId = result?.resultId ?? ''
  const gameType = result?.gameType ?? ''
  const score = result?.score ?? 0
  const answers = result?.answers ?? 0
  const correct = result?.correct ?? 0
  const hints = result?.hints ?? null
  const errors = result?.errors ?? null
  const isPerfect = result?.isPerfect ?? false
  const durationMs = result?.durationMs ?? 0
  const ownerKey = userId && resultId ? `${userId}:${gameType}:${resultId}` : ''
  const send = useCallback(async () => {
    if (!ownerKey || submitted.current.has(ownerKey) || inFlight.current.has(ownerKey)) return
    inFlight.current.add(ownerKey)
    setState({ id: ownerKey, status: 'syncing', message: 'Gemmer resultat…' })
    try {
      const response = await onlineGameResults.submit(userId, { resultId, gameType, score, answers, correct, hints, errors, isPerfect, durationMs })
      inFlight.current.delete(ownerKey)
      if (response.ok) submitted.current.add(ownerKey)
      setState({ id: ownerKey, status: response.ok ? 'synced' : 'pending', message: response.ok ? 'Resultatet er synkroniseret.' : response.message })
    } catch (error) {
      inFlight.current.delete(ownerKey)
      setState({ id: ownerKey, status: 'pending', message: error.message || 'Resultatet kunne ikke gemmes til synkronisering.' })
    }
  }, [userId, ownerKey, resultId, gameType, score, answers, correct, hints, errors, isPerfect, durationMs])
  useEffect(() => {
    if (!ownerKey || submitted.current.has(ownerKey)) return
    void send()
  }, [ownerKey, retryToken, send])
  return {
    ...state,
    status: state.id === ownerKey ? state.status : ownerKey ? 'syncing' : 'idle',
    message: state.id === ownerKey ? state.message : ownerKey ? 'Resultatet afventer synkronisering…' : '',
    retry: () => setRetryToken(value => value + 1),
  }
}
