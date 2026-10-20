import test from 'node:test'
import assert from 'node:assert/strict'
import { createLocalTopResults, rankTopResults } from '../services/localTopResults.js'

function storageDouble() {
  const values = new Map()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

test('guest attempts keep only the three best and sort equal scores by oldest then ID', () => {
  const results = createLocalTopResults(storageDouble())
  for (const attempt of [
    { id: 'e', score: 9, createdAt: '2026-10-05T00:00:00.000Z' },
    { id: 'd', score: 10, createdAt: '2026-10-02T00:00:00.000Z' },
    { id: 'c', score: 10, createdAt: '2026-10-01T00:00:00.000Z' },
    { id: 'b', score: 10, createdAt: '2026-10-01T00:00:00.000Z' },
    { id: 'a', score: 8, createdAt: '2026-10-01T00:00:00.000Z' },
  ]) results.record('appearances', attempt)
  assert.deepEqual(results.list('appearances').map(({ id, score }) => [id, score]), [
    ['b', 10], ['c', 10], ['d', 10],
  ])
})

test('same attempt is deduplicated and guest game types stay separate', () => {
  const results = createLocalTopResults(storageDouble())
  const attempt = { id: 'shared-id', score: 5, createdAt: '2026-10-20T00:00:00.000Z' }
  results.record('appearances', attempt)
  results.record('appearances', attempt)
  results.record('lineup', { ...attempt, score: 40 })
  assert.equal(results.list('appearances').length, 1)
  assert.deepEqual(results.list('lineup').map(item => item.score), [40])
})

test('local result sorting ignores malformed records', () => {
  assert.deepEqual(rankTopResults([
    { id: 'bad', score: -1, createdAt: '2026-10-20T00:00:00.000Z' },
    { id: 'good', score: 0, createdAt: '2026-10-20T00:00:00.000Z' },
  ]).map(item => item.id), ['good'])
})
