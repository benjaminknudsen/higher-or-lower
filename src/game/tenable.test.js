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
test('ten distinct answers win with a reset answer timer', () => {
  let r=fresh()
  for(let i=1;i<=10;i++) r=guessTenable(r,String(i),6000)
  assert.equal(r.status,'won'); assert.equal(r.found.length,10); assert.equal(r.lives,3); assert.equal(r.remaining,60)
  assert.strictEqual(tickTenable(r,999999),r)
})
test('timer uses deadline, expires at zero and rejects late submissions', () => {
  assert.equal(tickTenable(fresh(),1501).remaining,60)
  assert.equal(tickTenable(fresh(),61000).status,'playing')
  const late=guessTenable(fresh(),'1',61000)
  assert.equal(late.remaining,60); assert.equal(late.found.length,0); assert.equal(late.lives,2)
  assert.equal(tickTenable(fresh(),999999).remaining,0)
})
test('latest10 preserves newest-first rank and allows answers in any order', () => {
  const r=guessTenable(createTenableRound(testChallenges[2],1000),'Klub 1',2000)
  assert.deepEqual(r.found,[9])
})
test('invalid sizes, ambiguous full labels and invalid durations are rejected', () => {
  assert.throws(()=>validateChallenge({...testChallenges[0],answers:[]}))
  assert.throws(()=>validateChallenge({...testChallenges[0],durationSeconds:0}))
  const answers=testChallenges[0].answers.map(a=>({...a}))
  answers[1].aliases=['et']
  assert.throws(()=>validateChallenge({...testChallenges[0],answers}))
})

test('default one-minute timer expires at its deadline and accepts custom durations', () => {
  const { durationSeconds, ...challenge } = testChallenges[0]
  assert.equal(durationSeconds, 60)
  const round = createTenableRound(challenge, 1000)
  assert.equal(round.remaining, 60)
  assert.equal(tickTenable(round, 60999).status, 'playing')
  assert.equal(tickTenable(round, 61000).lives, 2)
  assert.equal(createTenableRound({...challenge,durationSeconds:90},1000).deadline,91000)
  assert.equal(createTenableRound(testChallenges[0], 1000).remaining, 60)
})

test('each nonempty submission resets the answer window, including wrong, repeated and ambiguous answers', () => {
  let round=guessTenable(fresh(),'1',21000)
  assert.equal(round.remaining,60); assert.equal(round.deadline,81000)
  round=guessTenable(round,'1',31000)
  assert.equal(round.deadline,91000); assert.equal(round.lives,3)
  round=guessTenable(round,'forkert',41000)
  assert.equal(round.deadline,101000); assert.equal(round.lives,2)
  const empty=guessTenable(round,' ',51000)
  assert.equal(empty.deadline,101000); assert.equal(empty.remaining,50)
  const challenge={...testChallenges[0],answers:testChallenges[0].answers.map(a=>({...a,aliases:[...a.aliases,'fælles']}))}
  const ambiguous=guessTenable(createTenableRound(challenge,1000),'fælles',21000)
  assert.equal(ambiguous.deadline,81000); assert.equal(ambiguous.lives,3)
})
test('timeouts consume one life per elapsed window and never charge twice for the same window', () => {
  const first=tickTenable(fresh(),61000)
  assert.equal(first.lives,2); assert.equal(first.remaining,60); assert.equal(first.deadline,121000)
  assert.equal(tickTenable(first,61000).lives,2)
  const second=tickTenable(first,121000)
  assert.equal(second.lives,1); assert.equal(second.remaining,60)
  const last=tickTenable(second,181000)
  assert.equal(last.lives,0); assert.equal(last.status,'lost'); assert.equal(last.remaining,0)
  assert.strictEqual(guessTenable(last,'1',182000),last)
  assert.equal(tickTenable(fresh(),121000).lives,1)
  const resumed=tickTenable(fresh(),126000)
  assert.equal(resumed.remaining,55); assert.equal(resumed.deadline,181000)
})
test('a late answer is discarded once, and a new submission can use the next answer window', () => {
  const expired=guessTenable(fresh(),'forkert',61000)
  assert.equal(expired.lives,2); assert.equal(expired.remaining,60)
  const next=guessTenable(expired,'1',62000)
  assert.equal(next.found.length,1); assert.equal(next.lives,2); assert.equal(next.deadline,122000)
})
