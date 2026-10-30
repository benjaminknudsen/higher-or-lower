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


test('five-minute migration changes only lineup duration bounds and preserves submission checks',()=>{
  const update=readFileSync(new URL('../../supabase/migrations/202610300007_lineup_five_minutes.sql',import.meta.url),'utf8')
  const originalFunction=migration.match(/create function public\.submit_game_result\([\s\S]*?\n\$\$;/)[0]
  assert.ok(update.includes(originalFunction.replace('create function','create or replace function').replace('180000','300000')))
  assert.match(update,/duration_ms <= 300000/)
  assert.doesNotMatch(update,/delete from|drop table|truncate/i)
})


test('expanded appearances migration preserves all submission checks except its comparison limit',()=>{
 const previous=readFileSync(new URL('../../supabase/migrations/202610300007_lineup_five_minutes.sql',import.meta.url),'utf8')
 const update=readFileSync(new URL('../../supabase/migrations/202610300008_appearances_162_players.sql',import.meta.url),'utf8')
 const originalFunction=previous.match(/create or replace function public\.submit_game_result\([\s\S]*?\n\$\$;/)[0]
 assert.ok(update.includes(originalFunction.replace('p_score > 160 or p_answers not between 1 and 160',"p_score > case when p_game_type = 'appearances' then 161 else 160 end or p_answers not between 1 and case when p_game_type = 'appearances' then 161 else 160 end")))
 assert.match(update,/game_type = 'appearances' then 161 else 160 end/)
 assert.doesNotMatch(update,/delete from|drop table|truncate/i)
})
