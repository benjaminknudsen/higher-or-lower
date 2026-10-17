import test from 'node:test'
import assert from 'node:assert/strict'
import { createGame, gameReducer } from './engine.js'
import dataset from '../data/fixtures/players.test.json' with { type: 'json' }

const player = (id, goals, extra = {}) => ({ id, name: `Test ${id}`, stats: { goals, appearances: goals * 2 }, ...extra })
const create = (values, statisticKey = 'goals') => createGame({ players: values.map((value, index) => player(String(index), value)), statisticKey }, () => .999)
const answer = (state, direction) => gameReducer(state, { type: 'guess', direction, questionId: state.index })
const next = (state) => gameReducer(state, { type: 'continue', questionId: state.index })

test('correct higher and lower guesses each award exactly one point', () => {
  let state = answer(create([10, 20, 5]), 'higher')
  assert.equal(state.score, 1)
  assert.equal(state.phase, 'revealed')
  state = answer(next(state), 'lower')
  assert.equal(state.score, 2)
  assert.equal(state.correct, true)
})

for (const direction of ['higher', 'lower']) {
  test(`equal statistics accept ${direction}, including zero goals`, () => {
    const state = answer(create([0, 0]), direction)
    assert.equal(state.correct, true)
    assert.equal(state.score, 1)
    assert.equal(next(state).phase, 'complete')
  })
}

test('wrong guess reveals before Game Over, without adding points', () => {
  let state = answer(create([20, 10]), 'higher')
  assert.equal(state.correct, false)
  assert.equal(state.phase, 'revealed')
  assert.equal(state.score, 0)
  state = next(state)
  assert.equal(state.phase, 'over')
  assert.equal(answer(state, 'lower'), state)
})

test('duplicate answers cannot change the first answer or add extra points', () => {
  const state = answer(create([10, 20, 30]), 'higher')
  assert.equal(answer(state, 'higher'), state)
  assert.equal(answer(state, 'lower'), state)
  assert.equal(state.score, 1)
})

test('next round carries the last player forward and rejects stale actions', () => {
  const previous = answer(create([10, 20, 30]), 'higher')
  const state = next(previous)
  assert.equal(state.deck[state.index - 1].id, previous.deck[previous.index].id)
  assert.notEqual(state.deck[state.index].id, previous.deck[previous.index].id)
  assert.equal(state.phase, 'asking')
  assert.equal(gameReducer(state, { type: 'guess', direction: 'higher', questionId: previous.index }), state)
  assert.equal(gameReducer(state, { type: 'continue', questionId: previous.index }), state)
  assert.equal(next(state), state)
})

test('all players can be exhausted once, with a final score of N minus 1', () => {
  let state = create([10, 20, 5, 5, 0, 30])
  const introduced = new Set([state.deck[0].id])
  while (state.phase !== 'complete') {
    const current = state.deck[state.index - 1]
    const challenger = state.deck[state.index]
    assert.equal(introduced.has(challenger.id), false)
    introduced.add(challenger.id)
    state = next(answer(state, challenger.stats.goals >= current.stats.goals ? 'higher' : 'lower'))
  }
  assert.equal(introduced.size, 6)
  assert.equal(state.score, 5)
  assert.equal(next(state), state)
})

test('shuffle preserves the input and introduces no duplicate players across many games', () => {
  const players = dataset.clubs.fcm.players
  const original = JSON.stringify(players)
  const orders = new Set()
  for (let count = 0; count < 100; count++) {
    const state = createGame({ players, statisticKey: 'goals' })
    assert.equal(state.deck.length, players.length)
    assert.equal(new Set(state.deck.map(({ id }) => id)).size, players.length)
    orders.add(state.deck.map(({ id }) => id).join(','))
  }
  assert.ok(orders.size > 1)
  assert.equal(JSON.stringify(players), original)
})

test('invalid or duplicate entries cannot appear as challengers', () => {
  const players = [player('a', 0), player('a', 10), player('b', 12), player('c', null), player('d', -1), player('e', '12'), player('f', NaN), player('g', Infinity)]
  const state = createGame({ players, statisticKey: 'goals' })
  assert.equal(state.deck.length, 2)
  assert.equal(state.phase, 'asking')
})

for (const players of [[], [player('only', 1)]]) {
  test(`${players.length} eligible players produce a safe unavailable state`, () => {
    const state = createGame({ players, statisticKey: 'goals' })
    assert.equal(state.phase, 'unavailable')
    assert.equal(answer(state, 'higher'), state)
    assert.equal(next(state), state)
  })
}

test('the same engine supports another configured statistic', () => {
  const state = answer(create([4, 8], 'appearances'), 'higher')
  assert.equal(state.statisticKey, 'appearances')
  assert.equal(state.correct, true)
})

test('unknown directions and action types are ignored', () => {
  const state = create([1, 2])
  assert.equal(answer(state, 'invalid'), state)
  assert.equal(gameReducer(state, { type: 'unknown', questionId: state.index }), state)
})

test('fixture data is explicitly marked as fictional at dataset level and in every name', () => {
  assert.equal(dataset.isTestData, true)
  assert.match(dataset.notice, /fiktive/)
  for (const entry of dataset.clubs.fcm.players) assert.match(entry.name, /^Testspiller /)
})
