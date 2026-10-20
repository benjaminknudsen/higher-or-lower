import test from 'node:test'
import assert from 'node:assert/strict'
import { canonicalUsername } from '../lib/accountPolicy.js'

test('public usernames are case-insensitive with consistent trimming', () => {
  assert.equal(canonicalUsername('Benjamin'), 'benjamin')
  assert.equal(canonicalUsername('  BENJAMIN  '), 'benjamin')
  assert.equal(canonicalUsername('Player_01'), 'player_01')
})
test('public username policy rejects ambiguous Unicode, injected syntax and embedded whitespace', () => {
  for (const input of ['Bеnjamin', 'Ｂenjamin', 'ben jamin', 'ben\tjamin', 'ben\njamin', 'søren', 'ben@example.org', 'ben-jamin', "ben';--", 'ben\u0000jamin', 'ben\u200bjamin']) {
    assert.equal(canonicalUsername(input), null, JSON.stringify(input))
  }
})
test('public username boundaries are enforced independently of display names', () => {
  assert.equal(canonicalUsername('ab'), null)
  assert.equal(canonicalUsername('abc'), 'abc')
  assert.equal(canonicalUsername('A'.repeat(24)), 'a'.repeat(24))
  assert.equal(canonicalUsername('a'.repeat(25)), null)
  for (const input of [null, undefined, 123, {}, [], '']) assert.equal(canonicalUsername(input), null)
})
