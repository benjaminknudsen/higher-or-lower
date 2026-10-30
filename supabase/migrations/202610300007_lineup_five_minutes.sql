-- Extend lineup rounds to five minutes. Existing results and scoring rules are preserved.
begin;

alter table public.game_results drop constraint game_results_type_bounds;
alter table public.game_results add
  constraint game_results_type_bounds check (
    (game_type in ('appearances', 'goals') and score <= 160 and answers between 1 and 160 and score <= answers and answers <= score + 1 and correct = score and hints is null and errors is null and not is_perfect and duration_ms = 0)
    or
    (game_type = 'lineup' and score <= 110 and score % 5 = 0 and answers = 11 and correct <= 11
      and hints is not null and hints between 0 and 11 and errors is not null and errors between 0 and 3
      and hints * 5 <= correct * 10 and score = greatest(0, correct * 10 - hints * 5)
      and correct + errors <= 13 and (correct < 11 or errors < 3)
      and is_perfect = (correct = 11) and duration_ms <= 300000)
  );

create or replace function public.submit_game_result(
  p_user_id uuid,
  p_game_type text,
  p_result_id uuid,
  p_score integer,
  p_answers integer,
  p_correct integer,
  p_hints integer,
  p_errors integer,
  p_is_perfect boolean,
  p_duration_ms integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_best integer;
  tier record;
  existing_result public.game_results%rowtype;
  recent_results bigint;
begin
  if auth.uid() is null or auth.uid() <> p_user_id
     or coalesce(auth.jwt()->>'is_anonymous', 'false') = 'true' then
    raise exception 'Authenticated owner required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Public profile required before submitting results' using errcode = '23503';
  end if;
  if p_game_type is null or p_game_type not in ('appearances', 'goals', 'lineup')
     or p_result_id is null or p_score is null or p_answers is null
     or p_correct is null or p_is_perfect is null or p_duration_ms is null
     or p_score < 0 or p_answers < 0 or p_correct < 0
     or p_correct > p_answers or p_duration_ms < 0 then
    raise exception 'Invalid game result' using errcode = '22023';
  end if;
  if (p_game_type in ('appearances', 'goals')
      and (p_score > 160 or p_answers not between 1 and 160
           or p_score > p_answers or p_answers > p_score + 1
           or p_correct <> p_score or p_hints is not null or p_errors is not null
           or p_is_perfect or p_duration_ms <> 0))
     or (p_game_type = 'lineup'
      and (p_score > 110 or p_score % 5 <> 0 or p_answers <> 11 or p_correct > 11
           or p_hints is null or p_hints not between 0 and 11
           or p_errors is null or p_errors not between 0 and 3
           or p_hints * 5 > p_correct * 10
           or p_score <> greatest(0, p_correct * 10 - p_hints * 5)
           or p_correct + p_errors > 13 or (p_correct = 11 and p_errors = 3)
           or p_is_perfect <> (p_correct = 11)
           or p_duration_ms > 300000)) then
    raise exception 'Result is outside game rules' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));

  select * into existing_result from public.game_results
    where user_id = p_user_id and game_type = p_game_type and result_id = p_result_id;
  if found then
    if existing_result.score is distinct from p_score
       or existing_result.answers is distinct from p_answers
       or existing_result.correct is distinct from p_correct
       or existing_result.hints is distinct from p_hints
       or existing_result.errors is distinct from p_errors
       or existing_result.is_perfect is distinct from p_is_perfect
       or existing_result.duration_ms is distinct from p_duration_ms then
      raise exception 'Result ID already used with different data' using errcode = '23505';
    end if;
    select best_score into new_best from public.game_stats
      where user_id = p_user_id and game_type = p_game_type;
    return pg_catalog.jsonb_build_object('accepted', true, 'duplicate', true, 'best_score', coalesce(new_best, 0));
  end if;

  select pg_catalog.count(*) into recent_results
    from public.game_results
    where user_id = p_user_id
      and created_at > pg_catalog.clock_timestamp() - interval '1 minute';
  if recent_results >= 30 then
    raise exception 'Result submission rate exceeded' using errcode = 'P0001';
  end if;

  insert into public.game_results
    (user_id, game_type, result_id, score, answers, correct, hints, errors, is_perfect, duration_ms)
  values
    (p_user_id, p_game_type, p_result_id, p_score, p_answers, p_correct, p_hints, p_errors, p_is_perfect, p_duration_ms);

  insert into public.game_stats
    (user_id, game_type, games_played, best_score, total_answers, total_correct, perfect_games)
  values
    (p_user_id, p_game_type, 1, p_score, p_answers, p_correct, case when p_is_perfect then 1 else 0 end)
  on conflict (user_id, game_type) do update set
    games_played = public.game_stats.games_played + 1,
    best_score = greatest(public.game_stats.best_score, excluded.best_score),
    total_answers = public.game_stats.total_answers + excluded.total_answers,
    total_correct = public.game_stats.total_correct + excluded.total_correct,
    perfect_games = public.game_stats.perfect_games + excluded.perfect_games,
    updated_at = pg_catalog.now()
  returning best_score into new_best;

  if p_game_type = 'appearances' then
    for tier in select * from (values
      ('beginner', 0), ('talent', 10), ('sharpshooter', 25),
      ('elite', 35), ('legend', 50), ('ultimate', 100)
    ) as medals(achievement_id, threshold)
    loop
      if new_best >= tier.threshold then
        insert into public.player_achievements
          (user_id, achievement_id, progress, unlocked_at)
        values (p_user_id, tier.achievement_id, new_best, pg_catalog.now())
        on conflict (user_id, achievement_id) do update set
          progress = greatest(public.player_achievements.progress, excluded.progress),
          unlocked_at = coalesce(public.player_achievements.unlocked_at, excluded.unlocked_at),
          updated_at = pg_catalog.now();
      else
        insert into public.player_achievements
          (user_id, achievement_id, progress, unlocked_at)
        values (p_user_id, tier.achievement_id, new_best, null)
        on conflict (user_id, achievement_id) do update set
          progress = greatest(public.player_achievements.progress, excluded.progress),
          updated_at = pg_catalog.now();
      end if;
    end loop;
  end if;

  return pg_catalog.jsonb_build_object('accepted', true, 'duplicate', false, 'best_score', new_best);
end;
$$;

commit;
