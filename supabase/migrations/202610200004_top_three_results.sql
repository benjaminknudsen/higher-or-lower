-- Top-three attempts for public leaderboard entries and private own-profile history.
-- Requires 202610200003_online_platform.sql. Review and apply manually as postgres.
begin;

do $$
begin
  if current_user <> 'postgres' then
    raise exception 'Run this migration in SQL Editor using the postgres role';
  end if;
  if pg_catalog.to_regclass('public.game_results') is null
     or pg_catalog.to_regclass('public.game_stats') is null
     or pg_catalog.to_regclass('public.profiles') is null
     or pg_catalog.to_regprocedure('public.get_game_leaderboard(text,integer,integer)') is null then
    raise exception 'Apply migration 003 before applying the top-three migration';
  end if;
end;
$$;

create index game_results_top_three_idx
  on public.game_results (game_type, user_id, score desc, created_at asc, result_id asc);

create or replace function public.get_game_leaderboard(p_game_type text, p_limit integer default 25, p_offset integer default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  response jsonb;
begin
  if p_game_type is null or p_game_type not in ('appearances', 'goals', 'lineup')
     or p_limit not between 1 and 50 or p_offset not between 0 and 5000 then
    raise exception 'Invalid leaderboard request' using errcode = '22023';
  end if;

  with ranked as (
    select s.user_id, p.username, p.avatar_path, s.best_score,
      pg_catalog.rank() over (order by s.best_score desc) as player_rank
    from public.game_stats s
    join public.profiles p on p.id = s.user_id
    where s.game_type = p_game_type and s.games_played > 0
  ),
  page_users as (
    select ranked.user_id
    from ranked
    order by ranked.best_score desc, ranked.username collate "C", ranked.user_id
    limit p_limit offset p_offset
  ),
  requested_users as (
    select user_id from page_users
    union
    select user_id from ranked where user_id = auth.uid()
  ),
  ranked_results as (
    select r.user_id, r.score,
      pg_catalog.row_number() over (
        partition by r.user_id
        order by r.score desc, r.created_at asc, r.result_id asc
      ) as attempt_number
    from public.game_results r
    join requested_users on requested_users.user_id = r.user_id
    where r.game_type = p_game_type
  ),
  top_scores as (
    select user_id,
      pg_catalog.jsonb_agg(score order by attempt_number) as scores
    from ranked_results
    where attempt_number <= 3
    group by user_id
  ),
  page_rows as (
    select ranked.*, coalesce(top_scores.scores, '[]'::jsonb) as top_scores
    from ranked
    left join top_scores using (user_id)
    join page_users using (user_id)
    order by ranked.best_score desc, ranked.username collate "C", ranked.user_id
    limit p_limit offset p_offset
  ),
  page_result as (
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'user_id', page_rows.user_id, 'username', page_rows.username,
      'avatar_path', page_rows.avatar_path, 'score', page_rows.best_score,
      'rank', page_rows.player_rank, 'top_scores', page_rows.top_scores
    ) order by page_rows.best_score desc, page_rows.username collate "C", page_rows.user_id), '[]'::jsonb) as entries
    from page_rows
  ),
  own_result as (
    select pg_catalog.jsonb_build_object(
      'user_id', ranked.user_id, 'username', ranked.username,
      'avatar_path', ranked.avatar_path, 'score', ranked.best_score,
      'rank', ranked.player_rank, 'top_scores', coalesce(top_scores.scores, '[]'::jsonb)
    ) as own_entry
    from ranked
    left join top_scores using (user_id)
    where ranked.user_id = auth.uid()
  ),
  total_result as (
    select pg_catalog.count(*) as total from ranked
  )
  select pg_catalog.jsonb_build_object(
    'entries', page_result.entries,
    'own_entry', (select own_entry from own_result),
    'total', total_result.total,
    'top_three_version', 1
  ) into response
  from page_result cross join total_result;

  return response;
end;
$$;
alter function public.get_game_leaderboard(text, integer, integer) owner to postgres;
revoke all on function public.get_game_leaderboard(text, integer, integer) from public;
grant execute on function public.get_game_leaderboard(text, integer, integer) to anon, authenticated;

create function public.get_my_top_three_results(p_game_type text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  attempts jsonb;
begin
  if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous', 'false') = 'true' then
    raise exception 'Authenticated account required' using errcode = '42501';
  end if;
  if p_game_type is null or p_game_type not in ('appearances', 'goals', 'lineup') then
    raise exception 'Invalid game type' using errcode = '22023';
  end if;

  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'result_id', result_id, 'score', score, 'created_at', created_at
    ) order by score desc, created_at asc, result_id asc), '[]'::jsonb)
    into attempts
    from (
      select r.result_id, r.score, r.created_at
      from public.game_results r
      where r.user_id = auth.uid() and r.game_type = p_game_type
      order by r.score desc, r.created_at asc, r.result_id asc
      limit 3
    ) top_results;

  return pg_catalog.jsonb_build_object('attempts', attempts, 'top_three_version', 1);
end;
$$;
alter function public.get_my_top_three_results(text) owner to postgres;
revoke all on function public.get_my_top_three_results(text) from public, anon, authenticated;
grant execute on function public.get_my_top_three_results(text) to authenticated;

comment on function public.get_game_leaderboard(text, integer, integer) is
  'Paginated public leaderboard with one rank per player and that player’s top three scores.';
comment on function public.get_my_top_three_results(text) is
  'Returns only the authenticated caller’s top three game_results with score and submission date.';

commit;
