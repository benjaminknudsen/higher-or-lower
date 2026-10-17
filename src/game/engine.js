// The engine only knows the selected statistic, so future modes can share it.
export function createGame({ players = [], statisticKey }, random = Math.random) {
  const seen = new Set()
  const deck = players.filter((player) => {
    const value = player.stats?.[statisticKey]
    if (!player.id || !player.name || seen.has(player.id) || !Number.isFinite(value) || value < 0) return false
    seen.add(player.id)
    return true
  })

  // Fisher–Yates: shuffle once, then draw without replacing any player.
  for (let index = deck.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[deck[index], deck[other]] = [deck[other], deck[index]]
  }

  return {
    deck,
    statisticKey,
    index: 1,
    score: 0,
    phase: deck.length >= 2 ? 'asking' : 'unavailable',
    correct: null,
    guess: null,
  }
}

export function gameReducer(state, action) {
  // Ignore stale/duplicate actions, including rapid taps before React paints.
  if (action.questionId !== state.index) return state

  if (action.type === 'guess' && state.phase === 'asking') {
    if (action.direction !== 'higher' && action.direction !== 'lower') return state
    const first = state.deck[state.index - 1].stats[state.statisticKey]
    const second = state.deck[state.index].stats[state.statisticKey]
    const correct = action.direction === 'higher' ? second >= first : second <= first
    return {
      ...state,
      phase: 'revealed',
      correct,
      guess: action.direction,
      score: state.score + (correct ? 1 : 0),
    }
  }

  if (action.type === 'continue' && state.phase === 'revealed') {
    if (!state.correct) return { ...state, phase: 'over' }
    if (state.index === state.deck.length - 1) return { ...state, phase: 'complete' }
    return { ...state, index: state.index + 1, phase: 'asking', correct: null, guess: null }
  }

  return state
}
