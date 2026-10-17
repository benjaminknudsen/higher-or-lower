import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import database from './players.json' with { type: 'json' }
import { APPEARANCES_SCOPE, validateDatabase, getVerifiedPlayers } from './quality.js'
import { createGame, gameReducer } from '../game/engine.js'

// Synthetic entries below exist only inside tests and never enter the local player file.
const row = (overrides = {}) => ({ id: 'synthetic:one', name: 'Synthetic player one', appearances: 12, source: 'https://www.transfermarkt.com/fc-midtjylland/rekordspieler/verein/865', scopeId: APPEARANCES_SCOPE, verificationNote: 'Synthetic test fixture for Competition: Total; not factual player data.', lastChecked: '2026-10-17', verified: true, ...overrides })
const fixture = players => ({ clubId: 'fcm', scopeId: APPEARANCES_SCOPE, asOf: '2026-04-04', players })
const eligible = data => getVerifiedPlayers(data, 'fcm', 'appearances')

test('all 150 supplied Apps values match the manually supplied list exactly', () => {
  assert.equal(validateDatabase(database).valid, true)
  assert.equal(eligible(database).length, 150)
  assert.equal(database.players.length, 161)
  assert.equal(database.asOf, null)
  assert.equal(new Set(database.players.map(player => player.id)).size, 161)
  assert.equal(new Set(database.players.map(player => player.name)).size, 161)
  assert.deepEqual(getVerifiedPlayers(database, 'fcm', 'goals'), [])
  const imported = database.players.filter(player => player.verified === true)
  // Digest of ordered [name, Apps] pairs parsed from the user's attachment,
  // not from the finished JSON. Detects column shifts, omissions and changed values.
  const digest = createHash('sha256').update(JSON.stringify(imported.map(({ name, appearances }) => [name, appearances]))).digest('hex')
  assert.equal(digest, '89b41bd04fa121bc566be11784ddf2505b628c914bf09d3fc063bf9396788d82')
  for (const player of imported) {
    assert.equal(player.source, database.reference)
    assert.equal(player.lastChecked, '2026-10-17')
    assert.equal(player.scopeId, APPEARANCES_SCOPE)
    assert.match(player.verificationNote, /Brugerens manuelt kontrollerede/)
  }
})
test('existing records retain identity and provenance; absent players stay excluded', () => {
  const historical = database.players.filter(player => player.previousVerification)
  assert.equal(historical.length, 42)
  assert.equal(historical.filter(player => player.verified).length, 31)
  const pending = historical.filter(player => !player.verified)
  assert.equal(pending.length, 11)
  for (const player of pending) {
    assert.ok(player.source && player.lastChecked && player.note)
    assert.equal(player.scopeId, database.previousDefinition.scopeId)
    assert.equal(eligible(fixture([{ ...player, verified: true }])).length, 0)
  }
  const find = id => database.players.find(player => player.id === id)
  assert.equal(find('fcm:mads-doehr-thychosen').name, 'Mads Thychosen')
  assert.equal(find('fcm:jens-lys-cajuste').name, 'Jens Cajuste')
  assert.equal(find('fcm:erik-sviatchenko').appearances, 322)
  assert.equal(find('fcm:erik-sviatchenko').previousVerification.appearances, 325)
  assert.equal(find('fcm:tim-sparv').appearances, 172)
  assert.equal(find('fcm:juninho').appearances, 114)
  assert.equal(find('fcm:adam-buksa').appearances, 45)
})
test('incomplete or invalid entries are skipped individually without disabling valid players', () => {
  const data = fixture([row(), null, {}, row({ id: 'draft', name: 'Draft', appearances: null, verified: false })])
  assert.equal(validateDatabase(data).valid, true)
  assert.equal(validateDatabase(data).warnings.length, 3)
  assert.deepEqual(eligible(data).map(player => player.id), ['synthetic:one'])
})
for (const [label, change] of [
  ['missing name', { name: '' }], ['missing ID', { id: null }],
  ['unverified count', { verified: false }], ['string true', { verified: 'true' }],
  ['null count', { appearances: null }], ['string count', { appearances: '12' }],
  ['negative count', { appearances: -1 }], ['fractional count', { appearances: 1.5 }],
  ['unsafe integer', { appearances: Number.MAX_SAFE_INTEGER + 1 }],
  ['missing source', { source: null }], ['unsafe source', { source: 'javascript:alert(1)' }],
  ['source credentials', { source: 'https://secret:secret@www.fcm.dk/nyheder/' }],
  ['missing date', { lastChecked: null }], ['invalid date', { lastChecked: '2026-02-30' }],
  ['league-only statistics', { scopeId: 'superliga-only' }],
  ['missing row scope', { scopeId: undefined }],
  ['missing control note', { verificationNote: '' }],
  ['other club reference', { source: 'https://www.transfermarkt.com/club/rekordspieler/verein/999' }],
  ['club total without TM reference', { source: 'https://www.fcm.dk/nyheder/example/' }],
]) {
  test(`excludes ${label} while retaining the rest of the pool`, () => {
    assert.equal(eligible(fixture([row(change), row({ id: 'synthetic:two', name: 'Synthetic player two' })])).length, 1)
  })
}
test('zero is playable when explicitly verified, but unknown never becomes zero', () => {
  const data = fixture([row({ appearances: 0 }), row({ id: 'draft', name: 'Unknown', appearances: null })])
  assert.equal(eligible(data)[0].stats.appearances, 0)
  assert.equal(eligible(data).length, 1)
})
test('ambiguous duplicate IDs or names are all excluded instead of picking one statistic', () => {
  assert.deepEqual(eligible(fixture([row(), row({ appearances: 13 })])), [])
  assert.deepEqual(eligible(fixture([row(), row({ id: 'different-id', name: ' SYNTHETIC PLAYER ONE ' })])), [])
})
test('an incomplete draft does not hide an already verified identity', () => {
  assert.equal(eligible(fixture([row(), row({ verified: false })])).length, 1)
})
test('changing only the count and control date updates the game without a second source registry/import', () => {
  const data = fixture([row()])
  assert.equal(eligible(data)[0].stats.appearances, 12)
  data.players[0].appearances = 15
  data.players[0].lastChecked = '2026-10-18'
  assert.equal(eligible(data)[0].stats.appearances, 15)
  assert.equal(eligible(data)[0].lastChecked, '2026-10-18')
})
test('wrong club, missing list, demo data and mixed global definitions fail safely', () => {
  for (const input of [null, {}, fixture(null), { ...fixture([]), clubId: 'other' }, { ...fixture([]), scopeId: 'league-only' }, { ...fixture([]), isTestData: true }]) {
    assert.equal(validateDatabase(input).valid, false)
    assert.deepEqual(eligible(input), [])
  }
  assert.deepEqual(getVerifiedPlayers(database, 'other', 'appearances'), [])
})
test('the game uses every eligible fixture exactly once and retains tie/score/completion logic', () => {
  const players = eligible(fixture([row(), row({ id: 'two', name: 'Two', appearances: 12 }), row({ id: 'three', name: 'Three', appearances: 20 })]))
  let state = createGame({ players, statisticKey: 'appearances' }, () => .99999)
  assert.equal(state.deck.length, players.length)
  while (state.phase === 'asking') {
    const first = state.deck[state.index - 1].stats.appearances
    const second = state.deck[state.index].stats.appearances
    state = gameReducer(state, { type: 'guess', direction: second >= first ? 'higher' : 'lower', questionId: state.index })
    state = gameReducer(state, { type: 'continue', questionId: state.index })
  }
  assert.equal(state.phase, 'complete')
  assert.equal(state.score, players.length - 1)
})

test('the playable production pool completes 149 questions using all 150 distinct players', () => {
  const players = eligible(database)
  let state = createGame({ players, statisticKey: 'appearances' }, () => .99999)
  assert.equal(state.phase, 'asking')
  assert.equal(state.deck.length, 150)
  assert.equal(new Set(state.deck.map(player => player.id)).size, 150)
  let questions = 0
  while (state.phase === 'asking') {
    const first = state.deck[state.index - 1].stats.appearances
    const second = state.deck[state.index].stats.appearances
    state = gameReducer(state, { type: 'guess', direction: second >= first ? 'higher' : 'lower', questionId: state.index })
    questions++
    state = gameReducer(state, { type: 'continue', questionId: state.index })
  }
  assert.equal(questions, 149)
  assert.equal(state.phase, 'complete')
  assert.equal(state.score, 149)
})
