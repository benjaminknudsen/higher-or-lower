-- Reviewed first-install migration for Supabase Auth email/password accounts.
-- SQL Editor: run as the postgres role; execute this entire file, not fragments.
-- Not executed. Replaces the previous, unapplied architecture draft.
-- Run only after approval and staging review. No existing Auth users are backfilled.
begin;

-- Fail before creating anything. Do not overwrite a different profiles table,
-- trigger or function, and do not use IF NOT EXISTS to hide schema mismatches.
do $$
begin
  if current_user <> 'postgres' then
    raise exception 'Run this migration in SQL Editor using the postgres role';
  end if;
  if pg_catalog.to_regclass('auth.users') is null
     or not exists (select 1 from pg_catalog.pg_roles where rolname = 'supabase_auth_admin') then
    raise exception 'This migration requires a standard Supabase Auth database';
  end if;
  if pg_catalog.to_regclass('public.profiles') is not null
     or pg_catalog.to_regprocedure('public.set_profile_timestamps()') is not null
     or pg_catalog.to_regprocedure('public.create_profile_for_auth_user()') is not null
     or exists (
       select 1 from pg_catalog.pg_trigger
       where tgrelid = 'auth.users'::pg_catalog.regclass
         and tgname = 'on_auth_user_created_profile'
     ) then
    raise exception 'Conflicting profile objects already exist; review them before applying this first-install migration';
  end if;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text collate "C" not null,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$'),
  constraint profiles_username_unique unique (username),
  -- Future Storage objects must be in the owner's folder, not arbitrary external
  -- URLs, signed URLs, emails or user-supplied file names. Bucket comes later.
  constraint profiles_avatar_owner_path check (
    avatar_path is null or avatar_path ~ (
      '^' || id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](webp|jpg|png)$'
    )
  )
);

alter table public.profiles owner to postgres;
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
-- Every column in this table is deliberately public. Never add private contact
-- details, tokens, recovery data or sensitive counters to this public surface.
grant select on public.profiles to anon, authenticated;
grant update (username, avatar_path) on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

create policy profiles_public_read on public.profiles
  for select to anon, authenticated using (true);
create policy profiles_owner_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false')
  with check (id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false');
-- No browser INSERT/DELETE policies or grants. Creation happens only in the
-- Auth trigger; deletion is a later server-verified account-deletion operation.

create function public.set_profile_timestamps()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;
alter function public.set_profile_timestamps() owner to postgres;
revoke all on function public.set_profile_timestamps() from public, anon, authenticated;
create trigger profiles_set_timestamps before update on public.profiles
  for each row execute function public.set_profile_timestamps();

-- Metadata supplies ONLY a proposed public username, never identity/permissions.
-- The identity is NEW.id from Auth, and database constraints resolve signup races.
create function public.create_profile_for_auth_user()
returns trigger language plpgsql security definer
set search_path = ''
as $$
declare
  proposed_username text;
begin
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;
  if pg_catalog.jsonb_typeof(new.raw_user_meta_data -> 'username') is distinct from 'string' then
    raise exception 'A public username is required' using errcode = '23514';
  end if;
  proposed_username := pg_catalog.btrim(new.raw_user_meta_data ->> 'username');
  -- Validate ASCII before lowercasing to match the shared JavaScript policy.
  if proposed_username collate "C" !~ '^[A-Za-z0-9_]{3,24}$' then
    raise exception 'Invalid public username' using errcode = '23514';
  end if;
  -- Do not catch unique_violation or use ON CONFLICT DO NOTHING: a losing
  -- concurrent signup must roll back its Auth insert, not create a profileless user.
  insert into public.profiles (id, username)
    values (new.id, pg_catalog.lower(proposed_username collate "C"));
  return new;
end;
$$;
alter function public.create_profile_for_auth_user() owner to postgres;
revoke all on function public.create_profile_for_auth_user() from public, anon, authenticated;
-- Auth's internal role may execute this trigger as its postgres owner. Never
-- grant table INSERT to Auth/browser roles merely to work around RLS errors.
grant execute on function public.create_profile_for_auth_user() to supabase_auth_admin;
create trigger on_auth_user_created_profile after insert on auth.users
  for each row execute function public.create_profile_for_auth_user();

comment on table public.profiles is 'Public fields only. Email/password remain exclusively in Supabase Auth.';
comment on column public.profiles.username is 'Canonical public username: 3-24 lowercase ASCII letters, digits or underscore; UNIQUE.';
comment on column public.profiles.avatar_path is 'Nullable future Storage object path. No bucket or upload functionality created yet.';
commit;
