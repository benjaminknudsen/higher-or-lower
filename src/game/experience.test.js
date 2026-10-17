import test from 'node:test'
import assert from 'node:assert/strict'
import { highScoreKey, readHighScore, saveHighScore } from './highScore.js'
import { scheduleNextRound, REVEAL_DELAY } from './roundTiming.js'
import { resultShareText, shareOrCopy } from './sharing.js'
import { roundFeedback, resultMessage } from './feedback.js'
import { createGame, gameReducer } from './engine.js'

function memoryStorage() {
  const values = new Map()
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
}
function clock() {
  let now = 0
  let id = 0
  const pending = new Map()
  const documentRef = new EventTarget()
  documentRef.visibilityState = 'visible'
  return {
    documentRef, pending,
    timers: { setTimeout: (fn, delay) => { pending.set(++id, { fn, due: now + delay }); return id }, clearTimeout: id => pending.delete(id) },
    advance(ms) { now += ms; for (const [id, task] of [...pending]) if (task.due <= now) { pending.delete(id); task.fn() } },
    visibility(value) { documentRef.visibilityState = value; documentRef.dispatchEvent(new Event('visibilitychange')) },
  }
}

test('personal best persists on reload and remains separate by club and mode', () => {
  const storage = memoryStorage()
  const key = highScoreKey('fcm', 'goals')
  saveHighScore(storage, key, 5)
  assert.equal(readHighScore(storage, key).value, 5)
  assert.equal(readHighScore(storage, highScoreKey('fcm', 'appearances')).value, 0)
  assert.equal(readHighScore(storage, highScoreKey('other', 'goals')).value, 0)
  assert.equal(saveHighScore(storage, key, 2).value, 5)
  storage.setItem(key, '9')
  assert.equal(saveHighScore(storage, key, 6, 5).value, 9)
  assert.equal(readHighScore(storage, key).value, 9)
})

test('corrupt or unsafe stored scores do not become records', () => {
  const storage = memoryStorage()
  const key = highScoreKey('fcm', 'goals')
  for (const invalid of ['-3', 'NaN', 'Infinity', '01', '1e2', '4.5', 'null', '{"score":99}', '9007199254740992']) {
    storage.setItem(key, invalid)
    assert.equal(readHighScore(storage, key).value, 0)
  }
  assert.equal(saveHighScore(storage, key, Infinity).value, 0)
  assert.equal(saveHighScore(storage, key, -1).value, 0)
})

test('denied/unavailable storage preserves an in-run fallback without throwing', () => {
  const key = highScoreKey('fcm', 'goals')
  const blocked = { getItem() { throw new Error('SecurityError') }, setItem() { throw new Error('QuotaExceededError') } }
  assert.deepEqual(readHighScore(blocked, key, 3), { value: 3, persisted: false })
  assert.deepEqual(saveHighScore(blocked, key, 5, 3), { value: 5, persisted: false })
  assert.deepEqual(saveHighScore(null, key, 4, 2), { value: 4, persisted: false })
  const readOnly = { getItem: () => '6', setItem() { throw new Error('QuotaExceededError') } }
  assert.deepEqual(saveHighScore(readOnly, key, 7), { value: 7, persisted: false })
})

for (const [correct, tied, delay] of [[true, false, REVEAL_DELAY.correct], [false, false, REVEAL_DELAY.wrong], [true, true, REVEAL_DELAY.tied]]) {
  test(`revealed correct=${correct}, tied=${tied} advances once after ${delay}ms`, () => {
    const fake = clock()
    const calls = []
    const cleanup = scheduleNextRound({ phase: 'revealed', questionId: 2, correct, tied, onAdvance: id => calls.push(id), ...fake })
    fake.advance(delay - 1)
    assert.deepEqual(calls, [])
    fake.advance(1)
    fake.visibility('visible')
    fake.advance(10000)
    assert.deepEqual(calls, [2])
    cleanup()
  })
}

test('leaving during reveal cancels both scheduled and already-queued callbacks', () => {
  const fake = clock()
  let calls = 0
  const cleanup = scheduleNextRound({ phase: 'revealed', questionId: 1, correct: true, tied: false, onAdvance: () => calls++, ...fake })
  const queued = [...fake.pending.values()][0].fn
  cleanup()
  fake.advance(10000)
  fake.visibility('visible')
  queued()
  assert.equal(calls, 0)
  assert.equal(fake.pending.size, 0)
})

test('hidden pages pause the reveal and restore a full reading interval on return', () => {
  const fake = clock()
  let calls = 0
  const cleanup = scheduleNextRound({ phase: 'revealed', questionId: 1, correct: true, tied: false, onAdvance: () => calls++, ...fake })
  fake.advance(900)
  fake.visibility('hidden')
  fake.advance(10000)
  assert.equal(calls, 0)
  fake.visibility('visible')
  fake.advance(1199)
  assert.equal(calls, 0)
  fake.advance(1)
  assert.equal(calls, 1)
  cleanup()
})

test('asking and terminal states never schedule a transition', () => {
  const fake = clock()
  for (const phase of ['asking', 'over', 'complete', 'unavailable']) {
    const cleanup = scheduleNextRound({ phase, onAdvance: () => assert.fail('Unexpected transition'), ...fake })
    fake.advance(10000)
    cleanup()
  }
  assert.equal(fake.pending.size, 0)
})

test('native share is preferred; user cancellation does not copy anything', async () => {
  const payload = { title: 'FCM', text: 'Resultat' }
  let copied = false
  assert.equal(await shareOrCopy(payload, { share: async data => assert.deepEqual(data, payload), clipboard: { writeText: async () => { copied = true } } }), 'shared')
  assert.equal(copied, false)
  assert.equal(await shareOrCopy(payload, { share: async () => { throw Object.assign(new Error('Cancelled'), { name: 'AbortError' }) }, clipboard: { writeText: async () => { copied = true } } }), 'cancelled')
  assert.equal(copied, false)
})

test('unsupported/failed native sharing falls back to clipboard, then selectable text', async () => {
  const payload = { title: 'FCM', text: 'Resultat' }
  let copied = ''
  const clipboard = { writeText: async text => { copied = text } }
  assert.equal(await shareOrCopy(payload, { clipboard }), 'copied')
  assert.equal(copied, payload.text)
  assert.equal(await shareOrCopy(payload, { share: async () => { throw new Error('NotAllowed') }, clipboard }), 'copied')
  assert.equal(await shareOrCopy(payload, {}), 'manual')
  assert.equal(await shareOrCopy(payload, { clipboard: { writeText: async () => { throw new Error('Denied') } } }), 'manual')
})

test('shared results include the correct mode and record, and mark isolated fixture results', () => {
  const text = resultShareText({ clubName: 'FCM', modeTitle: 'Flest mål', score: 4, highScore: 7 })
  assert.match(text, /4 rigtige i træk/)
  assert.match(text, /Flest mål/)
  assert.match(text, /rekord er 7/)
  assert.doesNotMatch(text, /testdata/)
  assert.match(resultShareText({ clubName: 'FCM', modeTitle: 'Flest mål', score: 1, highScore: 1, testData: true }), /Fiktive testdata/)
})

test('feedback reveals the correct direction and accepts ties without changing engine rules', () => {
  const initial = createGame({ players: [{ id: 'a', name: 'Fixture A', stats: { goals: 12 } }, { id: 'b', name: 'Fixture B', stats: { goals: 8 } }], statisticKey: 'goals' }, () => .99)
  const wrong = gameReducer(initial, { type: 'guess', direction: 'higher', questionId: 1 })
  assert.match(roundFeedback(wrong, 'mål').detail, /LOWER. 8 mål mod 12/)
  assert.equal(roundFeedback(wrong, 'mål').kind, 'wrong')
  const tied = { ...wrong, correct: true, score: 1, deck: [initial.deck[0], { ...initial.deck[1], stats: { goals: 12 } }] }
  assert.match(roundFeedback(tied, 'mål').detail, /Begge svar tæller/)
  assert.equal(roundFeedback(tied, 'mål').kind, 'correct')
})

test('results use different messages for low/high scores and completion', () => {
  assert.notEqual(resultMessage(0, false).title, resultMessage(4, false).title)
  assert.notEqual(resultMessage(2, false).detail, resultMessage(8, false).detail)
  assert.equal(resultMessage(9, true).title, 'FULD PLADE!')
})


test('restricted API property access still offers manual copying', async () => {
  const platform = {}
  Object.defineProperty(platform, 'share', { get() { throw new Error('Restricted') } })
  Object.defineProperty(platform, 'clipboard', { get() { throw new Error('Restricted') } })
  assert.equal(await shareOrCopy({ title: 'FCM', text: 'Resultat' }, platform), 'manual')
})
