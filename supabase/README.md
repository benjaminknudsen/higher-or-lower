# Supabase Auth og online platform

Ingen SQL er kørt af denne implementering, og ingen funktioner er deployet.
Ejeren har allerede anvendt migration 003.

- `migrations/202610200001_account_foundation.sql` er allerede anvendt af ejeren.
  Kør den ikke igen.
- `migrations/202610200002_local_import_foundation.sql` er et valgfrit, ubrugt
  importudkast; det skal ikke køres for denne løsning.
- `migrations/202610200003_online_platform.sql` er allerede anvendt i Supabase.
- `migrations/202610200004_top_three_results.sql` er allerede anvendt; den leverer
  profilsidens private Top 3-historik.
- `migrations/202610200005_attempt_leaderboard.sql` ændrer det offentlige
  leaderboard til individuelle forsøg. Gennemgå og kør den manuelt; kør ikke 003
  eller 004 igen.
- `functions/` kræver ingen deploy for denne fase; der anvendes database-RPC'er.

Se `docs/online-platform.md` for manuelle Supabase-trin og sikkerhedsbegrænsninger.
Ingen CLI-projektkobling/deploy er foretaget.

Frontend kræver kun eksisterende Supabase URL og publishable key. Ingen service-role
key må indgå i frontend.
