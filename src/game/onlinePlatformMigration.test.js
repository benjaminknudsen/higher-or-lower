import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HIGH_SCORE_MEDAL_TIERS } from './highScoreMedal.js'

const migration = readFileSync(new URL('../../supabase/migrations/202610200003_online_platform.sql', import.meta.url), 'utf8')

test('SQL achievement IDs and thresholds exactly match the existing medal tiers', () => {
  const values = migration.match(/for tier in select \* from \(values([\s\S]*?)\) as medals\(achievement_id, threshold\)/)?.[1]
  assert.ok(values, 'SQL medal tier values must remain present')
  const actual = [...values.matchAll(/\('([^']+)',\s*(\d+)\)/g)].map(([, id, threshold]) => [id, Number(threshold)])
  const ids = ['beginner', 'talent', 'sharpshooter', 'elite', 'legend', 'ultimate']
  const expected = HIGH_SCORE_MEDAL_TIERS.map((tier, index) => [ids[index], tier.minScore])
  assert.deepEqual(actual, expected)
})

test('SQL result constraints reflect streak endings and lineup scoring rules', () => {
  assert.match(migration, /answers <= score \+ 1 and correct = score/)
  assert.match(migration, /duration_ms = 0/)
  assert.match(migration, /score % 5 = 0 and answers = 11/)
  assert.match(migration, /score = greatest\(0, correct \* 10 - hints \* 5\)/)
  assert.match(migration, /hints integer,[\s\S]*errors integer/)
  assert.match(migration, /is_perfect = \(correct = 11\)/)
  assert.match(migration, /duration_ms <= 180000/)
})

test('result rate limiting is serialized and direct table writes are revoked', () => {
  assert.match(migration, /pg_advisory_xact_lock\(pg_catalog\.hashtextextended\(p_user_id::text, 0\)\)/)
  assert.match(migration, /recent_results >= 30/)
  assert.match(migration, /created_at > pg_catalog\.clock_timestamp\(\) - interval '1 minute'/)
  assert.match(migration, /revoke all on public\.game_stats, public\.game_results, public\.player_achievements from public, anon, authenticated/)
})

test('avatar Storage policy grants only owner upload/delete and public reads', () => {
  assert.match(migration, /create policy fcm_avatars_public_read on storage\.objects/)
  assert.match(migration, /create policy fcm_avatars_owner_insert on storage\.objects/)
  assert.match(migration, /create policy fcm_avatars_owner_delete on storage\.objects/)
  assert.doesNotMatch(migration, /create policy fcm_avatars_owner_update on storage\.objects/)
  assert.match(migration, /image\/webp', 'image\/jpeg/)
})

test('RPCs are SECURITY DEFINER with an empty search path and restricted execute grants', () => {
  const functions = [...migration.matchAll(/create function public\.(submit_game_result|get_game_leaderboard)\([\s\S]*?\n\$\$;/g)]
  assert.equal(functions.length, 2)
  for (const [definition] of functions) {
    assert.match(definition, /security definer[\s\S]*set search_path = ''/)
  }
  assert.match(migration, /revoke all on function public\.submit_game_result\(uuid, text, uuid, integer, integer, integer, integer, integer, boolean, integer\) from public, anon, authenticated/)
  assert.match(migration, /grant execute on function public\.submit_game_result\(uuid, text, uuid, integer, integer, integer, integer, integer, boolean, integer\) to authenticated/)
  assert.match(migration, /grant execute on function public\.get_game_leaderboard\([\s\S]*?to anon, authenticated/)
})
