export const LINEUP_KEY = 'fcm.lineup.v1'
export const DURATION = 180000
export const normalizeName = name => name.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('da').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/[‐‑–]/g, '-').trim().replace(/\s+/g, ' ')
export const maskName = name => name.normalize('NFC').replace(/\p{L}/gu, '•')
export const letterCount = name => [...name.normalize('NFC')].filter(c => /\p{L}/u.test(c)).length
const text = value => typeof value === 'string' && value.trim().length > 0
const url = value => typeof value === 'string' && /^https:\/\//.test(value)
export function validMatch(m) {
  if (!m || (m.active !== undefined && typeof m.active !== 'boolean') || m.verified !== true || !text(m.id) || !text(m.home) || !text(m.away) || ![m.home, m.away].includes('FC Midtjylland') || !text(m.competition) || !/^\d{4}-\d{2}-\d{2}$/.test(m.date) || !Number.isFinite(Date.parse(m.date)) || !Array.isArray(m.sources) || !m.sources.length || !m.sources.every(url)) return false
  if (!Array.isArray(m.score) || m.score.length !== 2 || !m.score.every(n => Number.isInteger(n) && n >= 0) || typeof m.formation !== 'string') return false
  if (new Date(m.date).toISOString().slice(0,10) !== m.date || !Array.isArray(m.players) || m.players.some(p => !p || typeof p !== 'object' || !text(p.name))) return false
  const rows = [1, ...m.formation.split('-').map(Number)]
  if (rows.length < 4 || rows.length > 6 || !rows.every(n => Number.isInteger(n) && n > 0 && n <= 5) || rows.reduce((a,b) => a+b,0) !== 11 || !Array.isArray(m.players) || m.players.length !== 11) return false
  return new Set(m.players.map(p => p.id)).size === 11 && new Set(m.players.map(p => normalizeName(p.name || ''))).size === 11 && m.players.every(p => text(p.id) && text(p.name) && text(p.position) && Number.isInteger(p.row) && Number.isInteger(p.slot) && p.row >= 0 && p.row < rows.length && p.slot >= 0 && p.slot < rows[p.row] && (p.row !== 0 || p.position === 'GK') && Array.isArray(p.aliases) && p.aliases.every(text) && (p.shirtNumber == null || (Number.isInteger(p.shirtNumber) && p.shirtNumber > 0 && p.shirtNumber <= 99 && url(p.numberSource)))) && new Set(m.players.map(p => `${p.row}:${p.slot}`)).size === 11
}
export const isActiveMatch = match => match?.active !== false && validMatch(match)

// Keep old snapshots and results, but never resume an explicitly retired match.
export function retireInactiveRound(store, matches) {
  if (!store.round || !matches.some(m => m.id === store.round.match.id && m.active === false)) return store
  const archivedRounds = Array.isArray(store.archivedRounds) ? store.archivedRounds : []
  return { ...store, round: null, archivedRounds: archivedRounds.some(r => r.id === store.round.id) ? archivedRounds : [...archivedRounds, store.round] }
}

export function selectMatch(matches, played = [], random = Math.random) {
  const valid = matches.filter(isActiveMatch).filter((m,i,a) => a.findIndex(n => n.id === m.id) === i)
  let pool = valid.filter(m => !played.includes(m.id))
  let history = played.filter(id => valid.some(m => m.id === id))
  if (!pool.length) { history = []; pool = valid.filter(m => valid.length === 1 || m.id !== played.at(-1)) }
  if (!pool.length) return null
  const match = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]
  return { match, played: [...history, match.id] }
}
export function createRound(match, now = Date.now(), id = globalThis.crypto.randomUUID()) {
  return { id, modeId: 'lineup', match: structuredClone(match), startedAt: now, deadline: now + DURATION, guessed: [], hints: [], errors: 0, status: 'playing', endedAt: null, lastGuessAt: 0 }
}
export const scoreRound = r => Math.max(0, r.guessed.length * 10 - r.hints.length * 5)
export const remaining = (r, now = Date.now()) => Math.max(0, Math.ceil((r.deadline - (r.endedAt ?? now)) / 1000))
export function tick(r, now = Date.now()) {
  return r.status === 'playing' && now >= r.deadline ? { ...r, status: 'time', endedAt: r.deadline } : r
}
export function guess(round, input, now = Date.now()) {
  const r = tick(round, now), name = normalizeName(input)
  if (r.status !== 'playing' || !name || now - r.lastGuessAt < 650) return { round: r, feedback: '' }
  const candidates = r.match.players.filter(p => [p.name, ...p.aliases, ...p.name.split(/\s+/u)].some(n => normalizeName(n) === name))
  if (candidates.length > 1) return { round: r, feedback: 'Navnet er tvetydigt. Skriv hele navnet.' }
  const player = candidates[0]
  if (player && r.guessed.includes(player.id)) return { round: r, feedback: 'Den spiller har du allerede fundet.' }
  const next = { ...r, lastGuessAt: now }
  if (player) {
    next.guessed = [...r.guessed, player.id]
    if (next.guessed.length === 11) { next.status = 'perfect'; next.endedAt = now }
    return { round: next, feedback: `${player.name} · +10 point`, kind: 'correct' }
  }
  next.errors++
  if (next.errors === 3) { next.status = 'errors'; next.endedAt = now }
  return { round: next, feedback: 'Spilleren var ikke i startopstillingen.', kind: 'wrong' }
}
export function buyHint(round, playerId, now = Date.now()) {
  const r = tick(round, now), p = r.match.players.find(p => p.id === playerId)
  if (r.status !== 'playing' || !p?.shirtNumber || !url(p.numberSource) || r.hints.includes(playerId) || r.guessed.includes(playerId) || scoreRound(r) < 5) return r
  return { ...r, hints: [...r.hints, playerId] }
}
export const emptyStore = () => ({ version: 1, played: [], round: null, results: [] })
export function validRound(r) {
  if (!r || !text(r.id) || !validMatch(r.match) || !Number.isFinite(r.startedAt) || r.deadline !== r.startedAt + DURATION || !Number.isInteger(r.errors) || r.errors < 0 || r.errors > 3 || !['playing','perfect','errors','time'].includes(r.status)) return false
  const ids = r.match.players.map(p => p.id)
  if (![r.guessed,r.hints].every(a => Array.isArray(a) && a.length <= 11 && new Set(a).size === a.length && a.every(id => ids.includes(id))) || r.hints.length * 5 > r.guessed.length * 10 || !Number.isFinite(r.lastGuessAt)) return false
  if (r.hints.some(id => !r.match.players.find(p => p.id === id)?.shirtNumber)) return false
  if (r.status === 'playing') return r.endedAt === null && r.errors < 3 && r.guessed.length < 11
  return Number.isFinite(r.endedAt) && r.endedAt >= r.startedAt && r.endedAt <= r.deadline && (r.status !== 'perfect' || r.guessed.length === 11) && (r.status !== 'errors' || r.errors === 3) && (r.status !== 'time' || r.endedAt === r.deadline)
}
export function readStore(storage) {
  try {
    const data = JSON.parse(storage.getItem(LINEUP_KEY))
    if (data?.version !== 1 || !Array.isArray(data.played) || !Array.isArray(data.results)) return emptyStore()
    return { ...data, played: data.played.filter(text), round: validRound(data.round) ? data.round : null, results: data.results.filter(r => r && text(r.id) && Number.isInteger(r.correct) && r.correct >= 0 && r.correct <= 11 && Number.isInteger(r.score) && r.score >= 0 && r.score <= 110) }
  } catch { return emptyStore() }
}
export function recordResult(store, round) {
  if (round.status === 'playing' || store.results.some(r => r.id === round.id)) return { ...store, round }
  const result = { id: round.id, modeId: 'lineup', matchId: round.match.id, score: scoreRound(round), correct: round.guessed.length, errors: round.errors, hints: round.hints.length, status: round.status, startedAt: round.startedAt, endedAt: round.endedAt, durationMs: round.endedAt - round.startedAt }
  return { ...store, round, results: [...store.results, result] }
}
export function statistics(store) {
  return { rounds: store.results.length, best: Math.max(0,...store.results.map(r => r.score)), perfect: store.results.filter(r => r.status === 'perfect').length, correct: store.results.reduce((n,r) => n+r.correct,0) }
}
