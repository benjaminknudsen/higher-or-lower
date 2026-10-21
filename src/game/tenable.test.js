import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTenableRound, guessTenable, tickTenable, normalizeAnswer, validateChallenge } from './tenable.js'
import { testChallenges } from '../data/tenable/testChallenges.js'
const fresh = () => createTenableRound(testChallenges[0], 1000)
test('TEST fixtures have ten unique ranked answers across all difficulties and types', () => {
  for (const c of testChallenges) { validateChallenge(c); assert.equal(c.isTest,true); assert.match(c.title,/TEST/); assert.match(c.source,/TEST/) }
  assert.equal(new Set(testChallenges.map(c => c.difficulty)).size,3)
  assert.equal(new Set(testChallenges.map(c => c.type)).size,2)
})
test('normalization supports case, Unicode and extra whitespace without fuzzy acceptance', () => {
  assert.equal(normalizeAnswer('  TESTSPILLER   A '),'testspiller a')
  const r = createTenableRound(testChallenges[1],1000)
  assert.deepEqual(guessTenable(r,'  SPILLER  a ',2000).found,[0])
  for (const wrong of ['A','Testspiller','Testspiller AA','Spiller B ekstra']) assert.equal(guessTenable(r,wrong,2000).lives,2)
  assert.equal(normalizeAnswer('Jose\u0301'), normalizeAnswer('JOSÉ'))
})
test('aliases reveal correct rank, repeats and empty answers cost no lives', () => {
  const r = guessTenable(fresh(),'  EN ',2000)
  assert.deepEqual(r.found,[0]); assert.equal(r.lives,3)
  assert.equal(guessTenable(r,'1',3000).lives,3)
  assert.equal(guessTenable(r,'et',3000).found.length,1)
  assert.equal(guessTenable(r,'  ',3000).lives,3)
  assert.deepEqual(guessTenable(r,'10',3000).found,[0,9])
})
test('three wrong answers lose and terminal state cannot be changed', () => {
  let r = fresh()
  for (let i=0;i<3;i++) r=guessTenable(r,'forkert',2000)
  assert.equal(r.status,'lost'); assert.equal(r.lives,0)
  assert.strictEqual(guessTenable(r,'1',3000),r)
})
test('ten distinct answers win and retain remaining time', () => {
  let r=fresh()
  for(let i=1;i<=10;i++) r=guessTenable(r,String(i),6000)
  assert.equal(r.status,'won'); assert.equal(r.found.length,10); assert.equal(r.lives,3); assert.equal(r.remaining,55)
  assert.strictEqual(tickTenable(r,999999),r)
})
test('timer uses deadline, expires at zero and rejects late submissions', () => {
  assert.equal(tickTenable(fresh(),1501).remaining,60)
  assert.equal(tickTenable(fresh(),61000).status,'lost')
  const late=guessTenable(fresh(),'1',61000)
  assert.equal(late.remaining,0); assert.equal(late.found.length,0); assert.equal(late.lives,3)
  assert.equal(tickTenable(fresh(),999999).remaining,0)
})
test('latest10 preserves newest-first rank and allows answers in any order', () => {
  const r=guessTenable(createTenableRound(testChallenges[2],1000),'Klub 1',2000)
  assert.deepEqual(r.found,[9])
})
test('invalid sizes, ambiguous aliases and invalid durations are rejected', () => {
  assert.throws(()=>validateChallenge({...testChallenges[0],answers:[]}))
  assert.throws(()=>validateChallenge({...testChallenges[0],durationSeconds:0}))
  const answers=testChallenges[0].answers.map(a=>({...a}))
  answers[1].aliases=['et']
  assert.throws(()=>validateChallenge({...testChallenges[0],answers}))
})

// Validate the playable catalogue separately from deterministic engine fixtures.
test('football catalogue has three valid challenges per difficulty and no visible test labels', async () => {
  const { practiceChallenges } = await import('../data/tenable/practiceChallenges.js')
  assert.equal(practiceChallenges.length, 9)
  assert.equal(new Set(practiceChallenges.map(c => c.id)).size, 9)
  for (const difficulty of ['easy','medium','hard']) assert.equal(practiceChallenges.filter(c => c.difficulty === difficulty).length, 3)
  for (const c of practiceChallenges) {
    validateChallenge(c)
    assert.equal(c.durationSeconds, 300)
    for (const text of [c.title,c.description,c.source,...c.answers.map(a => a.label)]) assert.doesNotMatch(text, /test/i)
  }
})

test('default five-minute timer expires at its deadline and accepts custom durations', () => {
  const { durationSeconds, ...challenge } = testChallenges[0]
  assert.equal(durationSeconds, 60)
  const round = createTenableRound(challenge, 1000)
  assert.equal(round.remaining, 300)
  assert.equal(tickTenable(round, 61000).remaining, 240)
  assert.equal(tickTenable(round, 300999).status, 'playing')
  assert.equal(tickTenable(round, 301000).status, 'lost')
  assert.equal(createTenableRound(testChallenges[0], 1000).remaining, 60)
})
