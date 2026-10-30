export const normalizeAnswer = value => String(value).normalize('NFKD').toLocaleLowerCase('da-DK')
  .replace(/\p{M}/gu, '').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ß/g, 'ss')
  .replace(/ł/g, 'l').replace(/đ/g, 'd').replace(/ı/g, 'i')
  .replace(/[.’'`]/gu, '').replace(/[‐‑‒–—-]/gu, ' ').trim().replace(/\s+/gu, ' ')

const clubPrefixes = new Set(['fc','fk','afc','sc','cf','ac','as','ss','ssc','bsc','rsc','tsg','nk','hnk','kf','sk','ff','cp','bc','f','c','s','a'])

const variants = answer => [...new Set([
  answer.label, ...(answer.aliases || []),
  ...(['player','coach'].includes(answer.kind) ? answer.surnames ?? [answer.label.split(/\s+/u).at(-1)] : []),
  ...(['player','coach'].includes(answer.kind) ? [answer.label,...(answer.aliases || [])].flatMap(name => normalizeAnswer(name).split(' ')) : []),
  ...(answer.kind === 'club' ? [answer.label,...(answer.aliases || [])].flatMap(name => normalizeAnswer(name).split(' ')).filter(word => word.length > 1 && !clubPrefixes.has(word)) : []),
].map(normalizeAnswer))]

export function matchTenableAnswer(challenge, input) {
  const value = normalizeAnswer(input)
  if (!value) return { kind:'empty' }
  const matches = challenge.answers.flatMap((answer,index) => variants(answer).includes(value) ? [index] : [])
  if (matches.length > 1) return { kind:'ambiguous' }
  return matches.length ? { kind:'correct', index:matches[0] } : { kind:'wrong' }
}

export function validateChallenge(c) {
  if (!c || c.status === 'blocked' || !c.id || !c.title || !['easy','medium','hard'].includes(c.difficulty) || !['top10','latest10','any10'].includes(c.type) || !Array.isArray(c.answers) || (c.type === 'any10' ? c.answers.length < 10 : c.answers.length !== 10)) throw new Error('Ugyldig udfordring: kræver mindst 10 svar; ranglister kræver præcis 10.')
  const seen = new Set()
  for (const a of c.answers) {
    if (!a || typeof a.label !== 'string' || !normalizeAnswer(a.label)) throw new Error('Tomt svar')
    if ((a.aliases !== undefined && (!Array.isArray(a.aliases) || a.aliases.some(v => typeof v !== 'string' || !normalizeAnswer(v)))) || (a.surnames !== undefined && (!Array.isArray(a.surnames) || a.surnames.some(v => typeof v !== 'string' || !normalizeAnswer(v))))) throw new Error('Ugyldig navnevariant')
    const label = normalizeAnswer(a.label)
    if (seen.has(label)) throw new Error('Dubleret svar')
    seen.add(label)
  }
  // Shared surnames/aliases are allowed in the data, but never resolved arbitrarily.
  if (c.answers.some((a,index) => matchTenableAnswer(c,a.label).index !== index)) throw new Error('Tvetydigt fuldt navn')
  if (!Number.isFinite(c.durationSeconds ?? 60) || (c.durationSeconds ?? 60) <= 0) throw new Error('Ugyldig tidsgrænse')
  return c
}
export function createTenableRound(challenge, now = Date.now()) {
  validateChallenge(challenge)
  return { challenge, found:[], lives:3, deadline:now+(challenge.durationSeconds ?? 60)*1000, remaining:challenge.durationSeconds ?? 60, status:'playing', feedback:'Gæt svarene i vilkårlig rækkefølge.', feedbackType:'info' }
}

export function tenableBoard(round) {
  if (round.challenge.type !== 'any10') return round.challenge.answers.map((answer,index) => ({ answer,index }))
  const indices = [...round.found]
  if (round.status !== 'playing') {
    for (let index=0; indices.length<10 && index<round.challenge.answers.length; index++) if (!indices.includes(index)) indices.push(index)
  }
  return Array.from({length:10},(_,slot) => ({ index:indices[slot] ?? null, answer:round.challenge.answers[indices[slot]] ?? null }))
}
export function tickTenable(round, now = Date.now()) {
  if (round.status !== 'playing') return round
  if (now >= round.deadline) {
    const duration = (round.challenge.durationSeconds ?? 60)*1000
    // Account for elapsed answer windows even when the tab was in the background.
    const expired = Math.floor((now-round.deadline)/duration)+1
    const lives = Math.max(0,round.lives-expired)
    const deadline = round.deadline+expired*duration
    return { ...round, lives, deadline, remaining:lives ? Math.ceil((deadline-now)/1000) : 0, status:lives ? 'playing':'lost', feedback:lives ? 'Tiden er gået. Du mister ét liv og får ny tid.':'Tiden er gået. Ingen liv tilbage.', feedbackType:'wrong' }
  }
  const remaining = Math.max(0, Math.ceil((round.deadline-now)/1000))
  return { ...round, remaining }
}
export function guessTenable(round, input, now = Date.now()) {
  let r = tickTenable(round, now)
  // A submission at/after expiry belongs to the expired answer window.
  if (r.status !== 'playing' || r.lives !== round.lives) return r
  const match = matchTenableAnswer(r.challenge,input)
  if (match.kind === 'empty') return { ...r, feedback:'Skriv et svar først.', feedbackType:'info' }
  const duration = r.challenge.durationSeconds ?? 60
  r = { ...r, deadline:now+duration*1000, remaining:duration }
  if (match.kind === 'ambiguous') return { ...r, feedback:'Navnet er tvetydigt. Skriv hele navnet. Du beholder dine liv.', feedbackType:'info' }
  const index = match.index ?? -1
  if (r.found.includes(index)) return { ...r, feedback:'Allerede fundet. Du beholder dine liv.', feedbackType:'info' }
  if (index < 0) {
    const lives = r.lives-1
    return { ...r, lives, status:lives === 0 ? 'lost':'playing', feedback:lives === 0 ? 'Ingen liv tilbage.':'Forkert svar. Du mister ét liv.', feedbackType:'wrong' }
  }
  const found = [...r.found,index]
  return { ...r, found, status:found.length === 10 ? 'won':'playing', feedback:r.challenge.type === 'any10' ? `Korrekt! ${r.challenge.answers[index].label}.` : `Korrekt! ${r.challenge.answers[index].label} er nummer ${index+1}.`, feedbackType:'correct' }
}
