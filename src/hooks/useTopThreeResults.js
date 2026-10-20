import { useEffect, useState } from 'react'
import { onlinePlatform } from '../services/onlinePlatformRuntime.js'
import { createLocalTopResults, LOCAL_TOP_RESULTS_CHANGE_EVENT, rankTopResults } from '../services/localTopResults.js'
import { loadLineupStore } from '../services/lineupStorage.js'

function getLocalStore() {
  return typeof window === 'undefined' ? null : window.localStorage
}

function existingGuestLineupAttempts() {
  return loadLineupStore().results.filter(result => Number.isFinite(result.endedAt)
    && Number.isFinite(new Date(result.endedAt).getTime())
    && Number.isSafeInteger(result.score) && result.score >= 0 && typeof result.id === 'string')
    .map(result => ({ id: result.id, score: result.score, createdAt: new Date(result.endedAt).toISOString() }))
}

export default function useTopThreeResults(gameType, userId, isGuest, identityLoading = false) {
  const key = `${gameType}:${userId ?? 'account'}`
  const [state, setState] = useState({ key: '', attempts: [], loading: true, error: '' })
  const [, setLocalRevision] = useState(0)
  let localResult = { attempts: [], error: '' }
  if (isGuest) {
    try {
      const localResults = createLocalTopResults(getLocalStore()).list(gameType)
      const existingLocalAttempts = gameType === 'lineup' ? existingGuestLineupAttempts() : []
      localResult = { attempts: rankTopResults([...localResults, ...existingLocalAttempts]), error: '' }
    } catch (error) {
      localResult = { attempts: [], error: error.message || 'Dine lokale bedste forsøg kunne ikke hentes.' }
    }
  }

  useEffect(() => {
    if (!isGuest || typeof window === 'undefined') return
    const refreshLocal = () => setLocalRevision(value => value + 1)
    window.addEventListener(LOCAL_TOP_RESULTS_CHANGE_EVENT, refreshLocal)
    return () => window.removeEventListener(LOCAL_TOP_RESULTS_CHANGE_EVENT, refreshLocal)
  }, [isGuest])

  useEffect(() => {
    let current = true
    if (!userId || identityLoading) {
      return () => { current = false }
    }
    onlinePlatform.getMyTopThreeResults(userId, gameType).then(attempts => {
      if (current) setState({ key, attempts, loading: false, error: '' })
    }).catch(error => {
      if (current) setState({ key, attempts: [], loading: false, error: error.message })
    })
    return () => {
      current = false
    }
  }, [gameType, userId, identityLoading, key])
  if (identityLoading) return { attempts: [], loading: true, error: '' }
  if (isGuest) return { ...localResult, loading: false }
  if (!userId) return { attempts: [], loading: false, error: '' }
  if (state.key !== key) return { attempts: [], loading: true, error: '' }
  return { attempts: state.attempts, loading: state.loading, error: state.error }
}
