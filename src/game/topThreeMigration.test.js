import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(new URL('../../supabase/migrations/202610200004_top_three_results.sql', import.meta.url), 'utf8')

test('top-three migration ranks existing results without changing account-level leaderboard rank', () => {
  assert.match(migration, /row_number\(\) over \(\s*partition by r\.user_id\s*order by r\.score desc, r\.created_at asc, r\.result_id asc/s)
  assert.match(migration, /page_users as \([\s\S]*?requested_users as \([\s\S]*?join requested_users on requested_users\.user_id = r\.user_id/)
  assert.match(migration, /attempt_number <= 3/)
  assert.match(migration, /rank\(\) over \(order by s\.best_score desc\)/)
  assert.match(migration, /'top_scores', page_rows\.top_scores/)
})

test('separate personal history RPC returns only the authenticated caller top three with dates', () => {
  assert.match(migration, /create function public\.get_my_top_three_results\(p_game_type text\)/)
  assert.match(migration, /r\.user_id = auth\.uid\(\) and r\.game_type = p_game_type/)
  assert.match(migration, /'created_at', created_at/)
  assert.match(migration, /order by r\.score desc, r\.created_at asc, r\.result_id asc\s*limit 3/)
  assert.match(migration, /'top_three_version', 1/)
  assert.match(migration, /revoke all on function public\.get_my_top_three_results\(text\) from public, anon, authenticated/)
  assert.match(migration, /grant execute on function public\.get_my_top_three_results\(text\) to authenticated/)
})

test('leaderboard RPC remains public and the top-three index covers its result ordering', () => {
  assert.match(migration, /create index game_results_top_three_idx\s*on public\.game_results \(game_type, user_id, score desc, created_at asc, result_id asc\)/)
  assert.match(migration, /grant execute on function public\.get_game_leaderboard\(text, integer, integer\) to anon, authenticated/)
  assert.match(migration, /security definer\s*set search_path = ''/)
})
