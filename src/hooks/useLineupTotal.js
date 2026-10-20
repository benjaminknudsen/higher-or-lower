import { useSyncExternalStore } from 'react'
import { loadLineupStore } from '../services/lineupStorage'
import { statistics } from '../game/lineup'
const readTotal = () => statistics(loadLineupStore()).correct
function subscribe(listener) {
  window.addEventListener('storage', listener)
  window.addEventListener('pageshow', listener)
  document.addEventListener('visibilitychange', listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener('pageshow', listener)
    document.removeEventListener('visibilitychange', listener)
  }
}
export default function useLineupTotal() {
  return useSyncExternalStore(subscribe, readTotal)
}
