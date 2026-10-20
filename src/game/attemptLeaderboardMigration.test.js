import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(new URL('../../supabase/migrations/202610200005_attempt_leaderboard.sql', import.meta.url), 'utf8')

test('attempt leaderboard migration keeps RPC signature and ranks each player top-three globally', () => {
  assert.match(migration, /create or replace function public\.get_game_leaderboard\(p_game_type text, p_limit integer default 25, p_offset integer default 0\)/)
  assert.match(migration, /partition by r\.user_id\s+order by r\.score desc, r\.created_at asc, r\.result_id asc/)
  assert.match(migration, /where attempt_number <= 3/)
  assert.match(migration, /row_number\(\) over \(\s*order by score desc, created_at asc, result_id asc, user_id asc\s*\)/)
  assert.match(migration, /'rank', page_rows\.leaderboard_rank/)
  assert.match(migration, /'own_entries', own_result\.own_entries/)
  assert.match(migration, /'attempt_leaderboard_version', 1/)
})

test('attempt leaderboard remains paginated, public-read only, and does not change profile RPC', () => {
  assert.match(migration, /p_limit not between 1 and 50 or p_offset not between 0 and 5000/)
  assert.match(migration, /security definer\s+set search_path = ''/)
  assert.match(migration, /revoke all on function public\.get_game_leaderboard\(text, integer, integer\) from public/)
  assert.match(migration, /grant execute on function public\.get_game_leaderboard\(text, integer, integer\) to anon, authenticated/)
  assert.doesNotMatch(migration, /create(?: or replace)? function public\.get_my_top_three_results/)
})
