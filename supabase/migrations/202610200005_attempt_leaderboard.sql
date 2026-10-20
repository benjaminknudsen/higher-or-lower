-- Rank individual attempts, retaining each registered player's best three.
-- Requires migrations 003 and 004. Review and apply manually as postgres.
begin;

do $$
begin
  if current_user <> 'postgres' then
    raise exception 'Run this migration in SQL Editor using the postgres role';
  end if;
  if pg_catalog.to_regclass('public.game_results') is null
     or pg_catalog.to_regclass('public.profiles') is null
     or pg_catalog.to_regprocedure('public.get_game_leaderboard(text,integer,integer)') is null
     or pg_catalog.to_regprocedure('public.get_my_top_three_results(text)') is null then
    raise exception 'Apply migrations 003 and 004 before applying the attempt leaderboard migration';
  end if;
end;
$$;

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

  with player_attempts as (
    select r.user_id, r.result_id, r.score, r.created_at,
      p.username, p.avatar_path,
      pg_catalog.row_number() over (
        partition by r.user_id
        order by r.score desc, r.created_at asc, r.result_id asc
      ) as attempt_number
    from public.game_results r
    join public.profiles p on p.id = r.user_id
    where r.game_type = p_game_type
  ),
  top_attempts as (
    select * from player_attempts where attempt_number <= 3
  ),
  globally_ranked as (
    select top_attempts.*,
      pg_catalog.row_number() over (
        order by score desc, created_at asc, result_id asc, user_id asc
      ) as leaderboard_rank
    from top_attempts
  ),
  page_rows as (
    select *
    from globally_ranked
    order by leaderboard_rank
    limit p_limit offset p_offset
  ),
  page_result as (
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'user_id', page_rows.user_id,
      'result_id', page_rows.result_id,
      'username', page_rows.username,
      'avatar_path', page_rows.avatar_path,
      'score', page_rows.score,
      'created_at', page_rows.created_at,
      'rank', page_rows.leaderboard_rank
    ) order by page_rows.leaderboard_rank), '[]'::jsonb) as entries
    from page_rows
  ),
  own_result as (
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'user_id', globally_ranked.user_id,
      'result_id', globally_ranked.result_id,
      'username', globally_ranked.username,
      'avatar_path', globally_ranked.avatar_path,
      'score', globally_ranked.score,
      'created_at', globally_ranked.created_at,
      'rank', globally_ranked.leaderboard_rank
    ) order by globally_ranked.leaderboard_rank), '[]'::jsonb) as own_entries
    from globally_ranked
    where globally_ranked.user_id = auth.uid()
  ),
  total_result as (
    select pg_catalog.count(*) as total from globally_ranked
  )
  select pg_catalog.jsonb_build_object(
    'entries', page_result.entries,
    'own_entries', own_result.own_entries,
    'total', total_result.total,
    'attempt_leaderboard_version', 1
  ) into response
  from page_result cross join own_result cross join total_result;

  return response;
end;
$$;

alter function public.get_game_leaderboard(text, integer, integer) owner to postgres;
revoke all on function public.get_game_leaderboard(text, integer, integer) from public;
grant execute on function public.get_game_leaderboard(text, integer, integer) to anon, authenticated;

comment on function public.get_game_leaderboard(text, integer, integer) is
  'Paginated leaderboard of each registered player’s top three individual game results, globally ranked by score, submission time, result ID, then user ID.';

commit;
