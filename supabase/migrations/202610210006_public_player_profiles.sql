-- Public player profiles expose only public profile fields, aggregate stats,
-- and each player's three highest scores for public leaderboard game types.
-- Requires migrations 001 and 003. Review and apply manually as postgres.
begin;

do $$
begin
  if current_user <> 'postgres' then
    raise exception 'Run this migration in SQL Editor using the postgres role';
  end if;
  if pg_catalog.to_regclass('public.profiles') is null
     or pg_catalog.to_regclass('public.game_stats') is null
     or pg_catalog.to_regclass('public.game_results') is null then
    raise exception 'Apply migrations 001 and 003 before applying the public profile migration';
  end if;
end;
$$;

create function public.get_public_player_profile(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  response jsonb;
begin
  if p_user_id is null then
    raise exception 'A player ID is required' using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    return null;
  end if;

  select pg_catalog.jsonb_build_object(
    'profile', pg_catalog.jsonb_build_object(
      'id', p.id,
      'username', p.username,
      'avatar_path', p.avatar_path
    ),
    'stats', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'game_type', s.game_type,
        'games_played', s.games_played,
        'best_score', s.best_score,
        'total_answers', s.total_answers,
        'total_correct', s.total_correct,
        'perfect_games', s.perfect_games
      ) order by s.game_type)
      from public.game_stats s
      where s.user_id = p_user_id and s.game_type in ('appearances', 'lineup')
    ), '[]'::jsonb),
    'attempts', pg_catalog.jsonb_build_object(
      'appearances', coalesce((
        select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
          'score', ranked.score, 'created_at', ranked.created_at
        ) order by ranked.score desc, ranked.created_at asc, ranked.result_id asc)
        from (
          select r.score, r.created_at, r.result_id,
            pg_catalog.row_number() over (
              order by r.score desc, r.created_at asc, r.result_id asc
            ) as attempt_number
          from public.game_results r
          where r.user_id = p_user_id and r.game_type = 'appearances'
        ) ranked
        where ranked.attempt_number <= 3
      ), '[]'::jsonb),
      'lineup', coalesce((
        select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
          'score', ranked.score, 'created_at', ranked.created_at
        ) order by ranked.score desc, ranked.created_at asc, ranked.result_id asc)
        from (
          select r.score, r.created_at, r.result_id,
            pg_catalog.row_number() over (
              order by r.score desc, r.created_at asc, r.result_id asc
            ) as attempt_number
          from public.game_results r
          where r.user_id = p_user_id and r.game_type = 'lineup'
        ) ranked
        where ranked.attempt_number <= 3
      ), '[]'::jsonb)
    ),
    'public_profile_version', 1
  ) into response
  from public.profiles p
  where p.id = p_user_id;

  return response;
end;
$$;

alter function public.get_public_player_profile(uuid) owner to postgres;
revoke all on function public.get_public_player_profile(uuid) from public;
grant execute on function public.get_public_player_profile(uuid) to anon, authenticated;

comment on function public.get_public_player_profile(uuid) is
  'Returns only public profile fields, public aggregate stats, and top-three public game scores; never exposes Auth or private result columns.';

commit;
