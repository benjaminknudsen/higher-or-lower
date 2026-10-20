-- Online results, public leaderboard, achievements, and avatar storage.
-- Requires 202610200001_account_foundation.sql, already applied to this project.
-- Not executed. Review and apply manually in Supabase SQL Editor as postgres.
begin;

do $$
begin
  if current_user <> 'postgres' then
    raise exception 'Run this migration in SQL Editor using the postgres role';
  end if;
  if pg_catalog.to_regclass('public.profiles') is null
     or not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'profiles'
         and column_name = 'avatar_path' and data_type = 'text'
     )
     or pg_catalog.to_regclass('storage.buckets') is null
     or pg_catalog.to_regclass('storage.objects') is null then
    raise exception 'Apply the account foundation migration and enable standard Supabase Storage first';
  end if;
  if exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname in ('fcm_avatars_public_read', 'fcm_avatars_owner_insert',
                         'fcm_avatars_owner_update', 'fcm_avatars_owner_delete')
  ) then
    raise exception 'One or more FCM avatar Storage policies already exist; review them before applying';
  end if;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fcm-avatars', 'fcm-avatars', true, 2097152, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

do $$
declare
  avatar_bucket storage.buckets%rowtype;
begin
  select * into avatar_bucket from storage.buckets where id = 'fcm-avatars';
  if not found or not avatar_bucket.public
     or avatar_bucket.name is distinct from 'fcm-avatars'
     or avatar_bucket.file_size_limit is distinct from 2097152
     or avatar_bucket.allowed_mime_types is distinct from array['image/webp', 'image/jpeg'] then
    raise exception 'Existing fcm-avatars bucket settings are incompatible; review manually';
  end if;
end;
$$;

create policy fcm_avatars_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'fcm-avatars');

create policy fcm_avatars_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fcm-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](webp|jpg)$')
    and metadata->>'mimetype' in ('image/webp', 'image/jpeg')
    and (select auth.jwt()->>'is_anonymous') is distinct from 'true'
  );

create policy fcm_avatars_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fcm-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](webp|jpg)$')
    and (select auth.jwt()->>'is_anonymous') is distinct from 'true'
  );

create table public.game_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_type text not null check (game_type in ('appearances', 'goals', 'lineup')),
  games_played integer not null default 0 check (games_played >= 0),
  best_score integer not null default 0 check (best_score >= 0),
  total_answers integer not null default 0 check (total_answers >= 0),
  total_correct integer not null default 0 check (total_correct >= 0),
  perfect_games integer not null default 0 check (perfect_games >= 0),
  updated_at timestamptz not null default pg_catalog.now(),
  primary key (user_id, game_type),
  constraint game_stats_perfect_lte_games check (perfect_games <= games_played)
);

create table public.game_results (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_type text not null check (game_type in ('appearances', 'goals', 'lineup')),
  result_id uuid not null,
  score integer not null check (score >= 0),
  answers integer not null check (answers >= 0),
  correct integer not null check (correct >= 0 and correct <= answers),
  hints integer,
  errors integer,
  is_perfect boolean not null default false,
  duration_ms integer not null check (duration_ms >= 0),
  created_at timestamptz not null default pg_catalog.now(),
  primary key (user_id, game_type, result_id),
  constraint game_results_type_bounds check (
    (game_type in ('appearances', 'goals') and score <= 160 and answers between 1 and 160 and score <= answers and answers <= score + 1 and correct = score and hints is null and errors is null and not is_perfect and duration_ms = 0)
    or
    (game_type = 'lineup' and score <= 110 and score % 5 = 0 and answers = 11 and correct <= 11
      and hints is not null and hints between 0 and 11 and errors is not null and errors between 0 and 3
      and hints * 5 <= correct * 10 and score = greatest(0, correct * 10 - hints * 5)
      and correct + errors <= 13 and (correct < 11 or errors < 3)
      and is_perfect = (correct = 11) and duration_ms <= 180000)
  )
);

create index game_stats_leaderboard_idx
  on public.game_stats (game_type, best_score desc, user_id)
  where games_played > 0;
create index game_results_user_created_idx on public.game_results (user_id, created_at desc);

create table public.player_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null check (achievement_id in ('beginner', 'talent', 'sharpshooter', 'elite', 'legend', 'ultimate')),
  progress integer not null check (progress >= 0),
  unlocked_at timestamptz,
  updated_at timestamptz not null default pg_catalog.now(),
  primary key (user_id, achievement_id)
);

alter table public.game_stats owner to postgres;
alter table public.game_results owner to postgres;
alter table public.player_achievements owner to postgres;
alter table public.game_stats enable row level security;
alter table public.game_results enable row level security;
alter table public.player_achievements enable row level security;

revoke all on public.game_stats, public.game_results, public.player_achievements from public, anon, authenticated;
grant select on public.game_stats, public.player_achievements to anon, authenticated;
grant select on public.game_results to authenticated;

create policy game_stats_public_read on public.game_stats
  for select to anon, authenticated using (true);
create policy game_results_owner_read on public.game_results
  for select to authenticated using (user_id = (select auth.uid()));
create policy player_achievements_public_read on public.player_achievements
  for select to anon, authenticated using (true);

create function public.submit_game_result(
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
           or p_duration_ms > 180000)) then
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
alter function public.submit_game_result(uuid, text, uuid, integer, integer, integer, integer, integer, boolean, integer) owner to postgres;
revoke all on function public.submit_game_result(uuid, text, uuid, integer, integer, integer, integer, integer, boolean, integer) from public, anon, authenticated;
grant execute on function public.submit_game_result(uuid, text, uuid, integer, integer, integer, integer, integer, boolean, integer) to authenticated;

create function public.get_game_leaderboard(p_game_type text, p_limit integer default 25, p_offset integer default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  page jsonb;
  own_row jsonb;
  total_count bigint;
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
  )
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'user_id', page_rows.user_id, 'username', page_rows.username,
      'avatar_path', page_rows.avatar_path, 'score', page_rows.best_score,
      'rank', page_rows.player_rank
    ) order by page_rows.best_score desc, page_rows.username collate "C", page_rows.user_id), '[]'::jsonb)
    into page
    from (
      select * from ranked
      order by best_score desc, username collate "C", user_id
      limit p_limit offset p_offset
    ) page_rows;

  with ranked as (
    select s.user_id, p.username, p.avatar_path, s.best_score,
      pg_catalog.rank() over (order by s.best_score desc) as player_rank
    from public.game_stats s
    join public.profiles p on p.id = s.user_id
    where s.game_type = p_game_type and s.games_played > 0
  )
  select pg_catalog.jsonb_build_object(
      'user_id', user_id, 'username', username, 'avatar_path', avatar_path,
      'score', best_score, 'rank', player_rank
    ) into own_row
    from ranked where user_id = auth.uid();

  select pg_catalog.count(*) into total_count
    from public.game_stats s
    join public.profiles p on p.id = s.user_id
    where s.game_type = p_game_type and s.games_played > 0;

  return pg_catalog.jsonb_build_object(
    'entries', page,
    'own_entry', own_row,
    'total', total_count
  );
end;
$$;
alter function public.get_game_leaderboard(text, integer, integer) owner to postgres;
revoke all on function public.get_game_leaderboard(text, integer, integer) from public;
grant execute on function public.get_game_leaderboard(text, integer, integer) to anon, authenticated;

comment on table public.game_stats is 'Public aggregate game results, submitted through the owner-checked RPC.';
comment on table public.game_results is 'Private idempotent client-reported result receipts; not cryptographically verified. For untimed streak games duration_ms is zero because elapsed time is not tracked.';
comment on table public.player_achievements is 'Public medal progression derived server-side from registered Flest kampe results.';
comment on function public.submit_game_result(uuid, text, uuid, integer, integer, integer, integer, integer, boolean, integer) is 'Owner-checked, bounded, idempotent result submission with serialized per-user rate limiting. Client-reported scores are not cheat-proof.';
comment on function public.get_game_leaderboard(text, integer, integer) is 'Paginated public leaderboard with stable tie ordering and authenticated player rank.';
commit;
