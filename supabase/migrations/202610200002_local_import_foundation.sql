-- OPTIONAL LATER DRAFT, not required for signup/login. Not executed.
-- Prepare an import ledger, not score ingestion or public leaderboard tables.
begin;
create schema account_private;
revoke all on schema account_private from public, anon, authenticated;
grant usage on schema account_private to service_role;

create table account_private.local_import_events (
  source_kind text not null check (source_kind in ('lineup_result', 'higher_lower_session', 'higher_lower_legacy_record')),
  source_id text not null check (char_length(source_id) between 1 and 200),
  account_id uuid not null references auth.users(id) on delete cascade,
  payload_digest bytea not null check (octet_length(payload_digest) = 32),
  trust_level text not null default 'local_unverified' check (trust_level = 'local_unverified'),
  imported_at timestamptz not null default now(),
  primary key (source_kind, source_id)
);
alter table account_private.local_import_events enable row level security;
revoke all on account_private.local_import_events from public, anon, authenticated;
grant select, insert, update, delete on account_private.local_import_events to service_role;
-- No browser policies or RPCs. A reviewed transactional import service, result
-- tables and snapshot revisions must be added before this ledger can be used.
commit;
