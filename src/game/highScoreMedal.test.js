import test from 'node:test'
import assert from 'node:assert/strict'
import { getHighScoreMedalTier } from './highScoreMedal.js'

test('medal colors switch at each exact high-score threshold', () => {
  for (const [score, tier] of [
    [0, 'gray'],
    [9, 'gray'],
    [10, 'green'],
    [24, 'green'],
    [25, 'yellow'],
    [34, 'yellow'],
    [35, 'red'],
    [49, 'red'],
    [50, 'cyan'],
    [99, 'cyan'],
    [100, 'gold'],
    [250, 'gold'],
  ]) {
    assert.equal(getHighScoreMedalTier(score).id, tier, `score ${score}`)
  }
})

test('invalid high-score values use the initial gray tier', () => {
  for (const score of [-1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(getHighScoreMedalTier(score).id, 'gray')
  }
})
