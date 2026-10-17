const CHEERS = ['Godt set!', 'Det er rigtigt!', 'Godt spillet!']

export function roundFeedback(state, unit) {
  if (state.phase !== 'revealed') return { kind: 'idle', title: 'Højere eller lavere?', detail: 'Vælg dit svar.' }
  const first = state.deck[state.index - 1].stats[state.statisticKey]
  const second = state.deck[state.index].stats[state.statisticKey]
  const tied = first === second
  if (tied) return { kind: 'correct', title: 'Samme tal.', detail: `${second} ${unit} hver. Begge svar tæller. +1 point.` }
  if (state.correct) return { kind: 'correct', title: CHEERS[(state.score - 1) % CHEERS.length], detail: `${second} ${unit}. +1 point. Næste spiller.` }
  return { kind: 'wrong', title: 'Ikke denne gang.', detail: `Facit: ${second > first ? 'HIGHER' : 'LOWER'}. ${second} ${unit} mod ${first}.` }
}

export function resultMessage(score, completed) {
  if (completed) return { title: 'FULD PLADE!', detail: 'Du har klaret alle spillerne. Prøv igen med en ny rækkefølge.' }
  if (score === 0) return { title: 'En ny chance?', detail: 'Det første gæt er ikke altid det letteste. Prøv en ny runde.' }
  if (score < 3) return { title: 'Tak for kampen.', detail: 'En kort runde. Din næste stime venter.' }
  if (score < 6) return { title: 'En god stime.', detail: 'Du var godt på vej. Kan du nå endnu længere næste gang?' }
  return { title: 'Godt spillet.', detail: 'Du kender klubben godt. Prøv igen, og gå efter en ny rekord.' }
}
