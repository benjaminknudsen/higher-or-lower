import test from 'node:test'
import assert from 'node:assert/strict'
import { createLocalAccountStore, normalizeProfileName, PROFILE_KEY, STATISTICS_PREFIX } from '../services/localAccount.js'
import { highScoreKey } from './highScore.js'

function memoryStorage() {
  const data = new Map()
  return { get length() { return data.size }, key: i => [...data.keys()][i], getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
}
const answer = (store, sessionId, questionId, correct, clubId = 'fcm') => store.recordAnswer({ sessionId, questionId, correct, clubId, modeId: 'appearances' })

test('empty profile/statistics start at zero and never infer history from an old highscore', () => {
  const storage = memoryStorage()
  const key = highScoreKey('fcm', 'appearances')
  storage.setItem(key, '42')
  const store = createLocalAccountStore(() => storage)
  assert.deepEqual(store.loadProfile(), { name: 'FCM-fan' })
  assert.deepEqual(store.loadStatistics('fcm'), { gamesPlayed: 0, answers: 0, correct: 0, accuracy: 0 })
  store.saveProfile('  Maja   Ulv  ')
  answer(store, 'one', 1, true)
  assert.equal(storage.getItem(key), '42')
  const reopened = createLocalAccountStore(() => storage)
  assert.deepEqual(reopened.loadProfile(), { name: 'Maja Ulv' })
  assert.deepEqual(reopened.loadStatistics('fcm'), { gamesPlayed: 1, answers: 1, correct: 1, accuracy: 100 })
})
test('real accepted answers count once, including wrong answers and unfinished games', () => {
  const storage = memoryStorage()
  const store = createLocalAccountStore(() => storage)
  assert.equal(answer(store, 'one', 1, true), true)
  assert.equal(answer(store, 'one', 1, true), false)
  assert.equal(answer(store, 'one', 2, false), true)
  assert.equal(answer(store, 'one', 1, false), false)
  assert.equal(answer(store, 'two', 1, true), true)
  answer(store, 'other-club', 1, true, 'other')
  assert.deepEqual(store.loadStatistics('fcm'), { gamesPlayed: 2, answers: 3, correct: 2, accuracy: 67 })
})
test('two game instances use separate keys and preserve each other after reopening', () => {
  const storage = memoryStorage()
  const a = createLocalAccountStore(() => storage)
  const b = createLocalAccountStore(() => storage)
  answer(a, 'a', 1, true)
  answer(b, 'b', 1, false)
  answer(a, 'a', 2, true)
  assert.deepEqual(b.loadStatistics('fcm'), { gamesPlayed: 2, answers: 3, correct: 2, accuracy: 67 })
  assert.equal(answer(createLocalAccountStore(() => storage), 'a', 2, true), false)
})
test('invalid/corrupt local records are ignored without affecting valid games', () => {
  const storage = memoryStorage()
  const store = createLocalAccountStore(() => storage)
  storage.setItem(PROFILE_KEY, '{broken')
  storage.setItem(STATISTICS_PREFIX + 'bad', '{broken')
  storage.setItem(STATISTICS_PREFIX + 'invalid', JSON.stringify({ version: 1, clubId: 'fcm', modeId: 'appearances', answers: 2, correct: 10, lastQuestion: 2 }))
  assert.deepEqual(store.loadProfile(), { name: 'FCM-fan' })
  assert.equal(answer(store, 'one', 0, true), false)
  assert.equal(answer(store, 'one', 1, 'true'), false)
  answer(store, 'good', 1, false)
  assert.deepEqual(store.loadStatistics('fcm'), { gamesPlayed: 1, answers: 1, correct: 0, accuracy: 0 })
})
test('denied storage and write quota keep a truthful in-memory profile and statistics', () => {
  const store = createLocalAccountStore(() => { throw new Error('denied') })
  store.saveProfile('Ulv')
  answer(store, 'a', 1, true)
  answer(store, 'a', 1, true)
  assert.equal(store.loadProfile().name, 'Ulv')
  assert.deepEqual(store.loadStatistics('fcm'), { gamesPlayed: 1, answers: 1, correct: 1, accuracy: 100 })
  assert.equal(store.persistent, false)
  const storage = memoryStorage()
  storage.setItem(PROFILE_KEY, JSON.stringify({ version: 1, name: 'Old name' }))
  storage.setItem = () => { throw new Error('quota') }
  const quota = createLocalAccountStore(() => storage)
  quota.saveProfile('New name')
  assert.equal(quota.loadProfile().name, 'New name')
  assert.equal(quota.persistent, false)
})
test('profile names have a safe default and a Unicode-safe limit', () => {
  assert.equal(normalizeProfileName('  '), 'FCM-fan')
  assert.equal(normalizeProfileName(null), 'FCM-fan')
  assert.equal(normalizeProfileName('A\u0000B'), 'AB')
  assert.equal(Array.from(normalizeProfileName('🐺'.repeat(30))).length, 24)
})
