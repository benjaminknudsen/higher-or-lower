export const normalizeAnswer = value => String(value).normalize('NFKC').toLocaleLowerCase('da-DK').trim().replace(/\s+/gu, ' ')
export function validateChallenge(c) {
  if (!c.id || !c.title || !['easy','medium','hard'].includes(c.difficulty) || !['top10','latest10'].includes(c.type) || c.answers?.length !== 10) throw new Error('Ugyldig udfordring: kræver præcis 10 svar.')
  const seen = new Set()
  for (const a of c.answers) {
    if (!a.label?.trim()) throw new Error('Tomt svar')
    for (const v of new Set([a.label,...(a.aliases || [])].map(normalizeAnswer))) {
      if (!v || seen.has(v)) throw new Error('Tvetydig navnevariant')
      seen.add(v)
    }
  }
  if (!Number.isFinite(c.durationSeconds ?? 300) || (c.durationSeconds ?? 300) <= 0) throw new Error('Ugyldig tidsgrænse')
  return c
}
export function createTenableRound(challenge, now = Date.now()) {
  validateChallenge(challenge)
  return { challenge, found:[], lives:3, deadline:now+(challenge.durationSeconds ?? 300)*1000, remaining:challenge.durationSeconds ?? 300, status:'playing', feedback:'Gæt svarene i vilkårlig rækkefølge.', feedbackType:'info' }
}
export function tickTenable(round, now = Date.now()) {
  if (round.status !== 'playing') return round
  const remaining = Math.max(0, Math.ceil((round.deadline-now)/1000))
  return { ...round, remaining, ...(remaining === 0 ? { status:'lost', feedback:'Tiden er gået.', feedbackType:'wrong' } : {}) }
}
export function guessTenable(round, input, now = Date.now()) {
  const r = tickTenable(round, now)
  if (r.status !== 'playing') return r
  const normalized = normalizeAnswer(input)
  if (!normalized) return { ...r, feedback:'Skriv et svar først.', feedbackType:'info' }
  const index = r.challenge.answers.findIndex(a => [a.label,...(a.aliases || [])].some(v => normalizeAnswer(v) === normalized))
  if (r.found.includes(index)) return { ...r, feedback:'Allerede fundet. Du beholder dine liv.', feedbackType:'info' }
  if (index < 0) {
    const lives = r.lives-1
    return { ...r, lives, status:lives === 0 ? 'lost':'playing', feedback:lives === 0 ? 'Ingen liv tilbage.':'Forkert svar. Du mister ét liv.', feedbackType:'wrong' }
  }
  const found = [...r.found,index]
  return { ...r, found, status:found.length === 10 ? 'won':'playing', feedback:`Korrekt! ${r.challenge.answers[index].label} er nummer ${index+1}.`, feedbackType:'correct' }
}
