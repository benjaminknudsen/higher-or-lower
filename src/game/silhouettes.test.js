import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { assignSilhouettes, SILHOUETTES } from './silhouettes.js'

const players = Array.from({ length: 150 }, (_, index) => ({ id: `test:${index}` }))
test('all five anonymous figures are used without neighbouring duplicates', () => {
  const sources = Object.values(assignSilhouettes(players, () => 0))
  assert.equal(sources.length, 150)
  assert.equal(new Set(sources).size, 5)
  for (let i = 1; i < sources.length; i++) assert.notEqual(sources[i], sources[i - 1])
  for (let i = 0; i < sources.length; i += 5) assert.equal(new Set(sources.slice(i, i + 5)).size, 5)
})
test('a session keeps stable player IDs and never modifies the player data', () => {
  const before = structuredClone(players)
  const assignments = assignSilhouettes(players, () => .999)
  assert.deepEqual(players, before)
  for (const player of players) assert.ok(SILHOUETTES.includes(assignments[player.id]))
  const challenger = players[1]
  const carriedForward = players[1]
  assert.equal(assignments[challenger.id], assignments[carriedForward.id])
  assert.deepEqual(assignSilhouettes([]), {})
})
test('fresh random assignments can give the same player a different silhouette next game', () => {
  assert.notDeepEqual(assignSilhouettes(players, () => 0), assignSilhouettes(players, () => .999))
})

test('all five variants have distinct local WebP assets', () => {
  const hashes = SILHOUETTES.map(path => {
    const bytes = readFileSync(new URL(`../../public${path}`, import.meta.url))
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP')
    return createHash('sha256').update(bytes).digest('hex')
  })
  assert.equal(new Set(hashes).size, 5)
})
