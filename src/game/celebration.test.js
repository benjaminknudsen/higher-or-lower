import test from 'node:test'
import assert from 'node:assert/strict'
import { celebrationForScore } from './celebration.js'

test('success intensity increases at 5, 10 and 20 correct answers', () => {
  for (const [score, level, particles] of [[0,1,12],[1,1,12],[4,1,12],[5,2,16],[9,2,16],[10,3,20],[19,3,20],[20,4,24]]) {
    assert.deepEqual(celebrationForScore(score), { level, particles })
  }
})
test('long streaks stay capped instead of producing unbounded motion and particles', () => {
  assert.deepEqual(celebrationForScore(149), { level: 4, particles: 24 })
  assert.deepEqual(celebrationForScore(Number.MAX_SAFE_INTEGER), { level: 4, particles: 24 })
})

test('headlines and extra fireworks appear only at the four exact milestones', async () => {
  const { milestoneForScore } = await import('./celebration.js')
  for (const [score, title, sparks] of [[10, 'STÆRKT!', 0], [20, 'DU KENDER DINE ULVE!', 0], [50, 'ULVELEGENDE!', 24], [100, 'DU ER JO FCM!', 48]]) {
    assert.deepEqual(milestoneForScore(score), { title, sparks })
  }
  for (const score of [0, 1, 9, 11, 19, 21, 49, 51, 99, 101, 149]) {
    assert.equal(milestoneForScore(score), null)
  }
})
