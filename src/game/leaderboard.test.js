import test from 'node:test'
import assert from 'node:assert/strict'
import { leaderboardRepository, rankLeaderboard } from '../services/leaderboard.js'

test('rankings are deterministic, preserve input and share places for equal scores', () => {
  const entries = [{ id: 'c', name: 'C', score: 7 }, { id: 'b', name: 'B', score: 10 }, { id: 'a', name: 'A', score: 10 }]
  const before = structuredClone(entries)
  const sorted = rankLeaderboard(entries)
  assert.deepEqual(sorted.map(e => [e.id, e.rank]), [['a', 1], ['b', 1], ['c', 3]])
  assert.deepEqual(sorted, rankLeaderboard([...entries].reverse()))
  assert.deepEqual(entries, before)
  assert.deepEqual(rankLeaderboard([]), [])
})
test('demo adapter inserts the actual local player at the right score and marks the source', async () => {
  const result = await leaderboardRepository.list({ modeId: 'appearances', profileName: 'Min ulv', highScore: 7 })
  assert.equal(result.source, 'demo')
  assert.equal(result.entries.find(e => e.isSelf).name, 'Min ulv')
  assert.equal(result.entries.find(e => e.isSelf).rank, 6)
  assert.equal(result.entries.filter(e => e.isSelf).length, 1)
  assert.equal((await leaderboardRepository.list({ modeId: 'appearances', profileName: 'FCM-fan', highScore: 100 })).entries[0].isSelf, true)
  assert.deepEqual((await leaderboardRepository.list({ modeId: 'goals', profileName: 'Ulv', highScore: 0 })).entries, [])
})
test('invalid leaderboard scores and duplicate IDs never produce extra entries', () => {
  const entries = rankLeaderboard([{ id: 'a', name: 'A', score: 0 }, { id: 'a', name: 'A', score: 8 }, { id: 'b', name: 'B', score: -1 }, { id: 'c', name: 'C', score: '10' }])
  assert.equal(entries.length, 1)
  assert.equal(entries[0].score, 0)
})
test('lineup leaderboard uses cumulative correct players and ignores best round and points', async () => {
  const { rankLineupLeaderboard } = await import('../services/leaderboard.js')
  const entries = rankLineupLeaderboard([
    { id:'a', name:'A', totalCorrect:27, score:110, best:110 },
    { id:'b', name:'B', totalCorrect:47, score:0, best:10 },
    { id:'c', name:'C', totalCorrect:27, score:55, best:55 },
  ])
  assert.deepEqual(entries.map(e=>[e.id,e.score,e.rank]),[['b',47,1],['a',27,2],['c',27,2]])
  const result=await leaderboardRepository.list({modeId:'lineup',profileName:'Benjamin',highScore:110,totalCorrect:47})
  assert.equal(result.metric,'totalCorrect');assert.equal(result.entries[0].score,47);assert.equal(result.entries[0].name,'Benjamin')
  assert.equal(result.entries[0].isSelf,true)
  assert.equal((await leaderboardRepository.list({modeId:'lineup',profileName:'Ulv',highScore:110})).entries[0].score,0)
})
