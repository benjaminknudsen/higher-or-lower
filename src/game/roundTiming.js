export const REVEAL_DELAY = { correct: 1200, wrong: 1600, tied: 1600 }

// Injectable browser primitives keep timing/lifecycle behavior testable without dependencies.
export function scheduleNextRound({ phase, questionId, correct, tied, onAdvance, documentRef = document, timers = window }) {
  if (phase !== 'revealed') return () => {}
  const delay = tied ? REVEAL_DELAY.tied : correct ? REVEAL_DELAY.correct : REVEAL_DELAY.wrong
  let timer = null
  let cancelled = false
  let consumed = false
  const clear = () => {
    if (timer !== null) timers.clearTimeout(timer)
    timer = null
  }
  const schedule = () => {
    clear()
    if (cancelled || consumed || documentRef.visibilityState === 'hidden') return
    timer = timers.setTimeout(() => {
      timer = null
      if (cancelled || consumed || documentRef.visibilityState === 'hidden') return
      consumed = true
      onAdvance(questionId)
    }, delay)
  }
  documentRef.addEventListener('visibilitychange', schedule)
  schedule()
  return () => {
    cancelled = true
    clear()
    documentRef.removeEventListener('visibilitychange', schedule)
  }
}
