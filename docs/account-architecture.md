# Kontosystem – Supabase Auth

Se `supabase.md` for nuværende implementering og lokal afprøvning.
Ejeren har anvendt den første migration. Der køres ingen nye migrations i denne fase.

## Identitet og offentlighed

Supabase Auth ejer e-mail/password og sessioner. `auth.users.id` er identiteten.
`public.profiles` indeholder kun ID, canonical UNIQUE username, nullable avatar_path
og tidsstempler. Signup-triggeret kopierer kun username fra metadata og identiteten
fra NEW.id; metadata giver aldrig roller. Profiler er offentligt læsbare, så også
ubekræftede usernames, ID'er og tidspunkter kan listes/scrapes. E-mail kopieres ikke.

Username er 3–24 lowercase ASCII-bogstaver, tal eller underscore. Formular/service
normaliserer; DB CHECK og UNIQUE beskytter også direkte requests og samtidige
registreringer. Et offentligt preflight-opslag er kun UX. Generiske Auth-triggerfejl
kan ikke sikkert skelnes fra tekniske fejl, så der vises ingen falsk præcis årsag.

RLS tillader kun ejerens UPDATE med auth.uid() i USING/WITH CHECK. Kolonnegrants
begrænser til username/avatar_path. Ingen browser-INSERT/DELETE eller ændring af ID/
timestamps. SECURITY DEFINER-triggerens sikre search_path/ejerskab er beskrevet i
`account-migration-review.md`. Eksisterende Auth-brugere uden profil kræver særskilt
backfill; UI viser profilfejl/retry frem for et opdigtet kontonavn.

## Session og callback

Den centrale SDK-klient bruger persistSession/autoRefreshToken og PKCE. Runtime-
store subscribes til Auth med en kort callback og lægger profilhentning i en microtask,
så nye Auth-kald ikke await'es inde i SDK-listeneren. Ældre profilresponses kan ikke
genoprette en identitet efter logout/kontoskift. Listeners ryddes ved unmount.

Callback controller udveksler code eksplicit og fjerner Auth-parametre fra URL'en.
`/higher-or-lower/`, andre queryparametre og appens almindelige hash-ruter bevares.
PASSWORD_RECOVERY åbner resetformular; URL-tekst alene giver ingen rettigheder.
PKCE kan fejle på tværs af PWA/Safari/browserenheder; anmod om nyt link i den aktive
browser. Success/null-session ved signup er korrekt ved krav om e-mailbekræftelse.

Default logout er lokalt; service understøtter også eksplicit global logout, men UI
viser kun normal logout nu. JWT'er kan leve til udløb, så følsomme fremtidige server-
operationer skal validere sessioner server-side. Ingen service credentials i frontend.

## Lokal gæst og online statistik

Gæster spiller uden Auth-anonym konto. Ingen data slettes, importeres eller vises som
kontosynkroniseret. Gæstens profil, resultater og statistik forbliver lokale. Indloggede
brugere læser cloud-statistik efter Auth-ID; deres spilresultater skrives ikke ind i
gæstens lokale statistiktællere. Ved auth-indlæsning skjules gæsteprofilen, indtil
identiteten er afklaret. Kontoskift nulstiller spiltilstandens ejerskab. Kontoens public
username er autoritativt; gæstens navn skrives ikke over.

Den valgfrie `202610200002_local_import_foundation.sql` er fortsat et ikke-anvendt
udkast og er ikke nødvendig. `202610200003_online_platform.sql` opretter cloud-
statistik, idempotente resultater, medaljeprogression, leaderboard-RPC og Storage-
bucket/policies. Den kører ikke automatisk. Resultater begrænses og aggregeres i
Postgres, men scoreværdier er stadig klientrapporterede, ikke serververificerede.
Gæstetallene importeres ikke automatisk og forbliver adskilt ved konto-/enhedsskift.

Profilbilleder gemmes i public bucket `fcm-avatars` under brugerens Auth-ID og
unikke objektnavn; `profiles.avatar_path` er autoritativ. Gæster bruger stadig
IndexedDB. Begge temaer bruger samme UI og CSS-variabler. Ingen ændring af Vite-base,
Pages eller PWA-cachekonfiguration.

## Online datamodel

- `game_stats`: offentlig, aggregeret statistik pr. Auth-ID og spiltype; ingen
  direkte browserwrites.
- `game_results`: privat for ejeren, idempotent unik nøgle pr. bruger/spil/resultat.
- `player_achievements`: offentlig medaljeprogression, ændres kun af result-RPC'en.
- `submit_game_result`: owner-kontrolleret RPC, bounds, idempotens, rate guard,
  atomisk statistikopdatering og serverberegnet `Flest kampe` medaljeprogression.
- `get_game_leaderboard`: pagineret, deterministisk rangering med delt placering ved
  samme score og separat egen placering.

RLS tillader offentlig læsning af leaderboard/statistik/medaljer, ejers egen
resultathistorik og ingen direkte browserwrites til statistik/medaljer/resultater.
Profilmail gemmes ikke i de offentlige tabeller. Billeder er offentlige, men upload,
ændring og sletning kræver ejerens mappe. En browserklient kan stadig fabricere
lovlige resultater; se `online-platform.md`.

Kilder: [Auth-profiler](https://supabase.com/docs/guides/auth/managing-user-data),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[password-reset](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail).
