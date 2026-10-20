# Supabase i FCM Games

Kontosystemet bruger Supabase Auth med e-mail/password. Signup sender det canonical
offentlige username som `options.data.username`. E-mail vises aldrig på profilen
eller leaderboardet. Online foto/statistik/leaderboardfunktioner kræver desuden den
manuelt anvendte migration i `online-platform.md`. Kun URL/publishable key bruges i frontend.
`.env` forbliver ignoreret, og der er ingen nye miljøvariabler.

Ejeren har bekræftet, at `202610200001_account_foundation.sql` allerede er kørt,
og at `public.profiles`, Email Auth og URL Configuration er konfigureret.
Denne implementering kører ingen SQL og deployer ikke noget.

## Implementeret frontend

- `src/lib/supabase.js`: én central klient, nu med `enableAuth: true`.
- `src/lib/supabaseSetup.js`: PKCE, session-persistens og automatisk tokenfornyelse;
  `detectSessionInUrl` forbliver false, fordi callbacks behandles eksplicit.
- `src/lib/authService.js`: signup, login, logout, password-reset og sikkert fejloutput.
- `src/lib/authAccount.js`: sessions-/profilstore, public-profile fetch, callback,
  sessionevents og race-beskyttelse ved kontoskift/logout.
- `src/services/authAccount.js` / `src/hooks/useAuthAccount.js`: runtime og React-hook.
- `src/components/auth/AuthRoot.jsx` / `Auth.css`: fire dialogformularer, begge temaer.
- `src/services/onlinePlatform.js`: statsforespørgsler og paginerede leaderboardresultater.
- `src/services/onlineGameResults.js`: idempotent resultatsynkronisering med konto-opdelt offlinekø.
- `src/services/cloudProfilePhoto.js`: komprimeret Storage upload/udskiftning/fjernelse.
- Profilkortet viser serverens username, online rekord/medalje og Storage-avatar ved login.
  Gæster bruger fortsat lokalt navn, lokal statistik og IndexedDB-foto.

## Lokal afprøvning

1. Kør `npm install` hvis nødvendigt og derefter `npm run dev`.
2. Åbn den adresse Vite viser med `/higher-or-lower/#profil` (normalt
   `http://localhost:5173/higher-or-lower/#profil`).
3. Vælg Opret konto: username 3–24 ASCII-bogstaver/tal/underscore, rigtig e-mail og
   password, som opfylder Supabases konfigurerede krav. Username gemmes lowercase. Offentligt opslag giver feedback
   om optaget navn; databasens UNIQUE er stadig autoritativ ved samtidighed.
4. Med Confirm email ON: tjek indbakken og åbn linket i samme browser. Med OFF
   vises kontoen direkte, når Supabase returnerer en session. Eksisterende e-mails
   kan være skjult af Supabase: UI må ikke love en ny konto eller afsløre eksistens.
5. Log ind, genindlæs, kontrollér serverens username, redigér det, og log ud.
6. Vælg Glemt adgangskode og åbn reset-mailen i samme browser. PASSWORD_RECOVERY
   åbner formularen til nyt password. Efter succes logges den lokale session ud,
   og brugeren kan logge ind med det nye password.
7. Kontrollér gæstespil og gentag i begge temaer samt på fysisk iPhone/PWA.

## Supabase-konfiguration

- Redirect allowlist skal rumme den præcise localhost-adresse (inkl. port og
  `/higher-or-lower/`) samt den eksisterende offentlige Pages-base. Service bygger
  callback fra `import.meta.env.BASE_URL` og den aktuelle origin.
- Verificér SMTP/levering, minimum passwordlængde og Auth-rate limits. Ingen SMTP-
  credential eller adminnøgle må komme i Vite. CAPTCHA-widget er ikke implementeret;
  hvis CAPTCHA kræves i Supabase, skal widget/tokenhåndtering tilføjes før signup virker.
- Onlineplatformen bruger allerede anvendte migrationer 003 og 004.
  Individuelle leaderboardforsøg kræver desuden manuel migration
  `202610200005_attempt_leaderboard.sql`; kør kun denne nye migration. Se
  `docs/online-platform.md`. Kør ikke `202610200002_local_import_foundation.sql`.

## Data og begrænsninger

Gæster beholder lokale rekorder/statistik og kan se det fælles leaderboard, men
resultater sendes ikke online. Indloggede brugere læser kontostatistik i stedet for
gæstedata. Kontoresultater køes lokalt ved netværksfejl under den oprindelige Auth-ID
og synkroniseres senere idempotent; gamle gæsteresultater importeres ikke. Profilfoto
er lokalt for gæster og Supabase Storage for indloggede konti. Resultat-/leaderboard-
visning kræver den nye migration; uden den vises fejl i stedet for demo- eller gæstedata.
Gæsteres top tre lagres separat lokalt; eksisterende lokale lineup-runder med dato
indgår, og gæsteforsøg blandes ikke med kontohistorikken.

Leaderboardet indeholder kun registrerede konti med indsendte spilresultater. Det
viser offentlig username, score, delt rang ved ties og avatarsti/billede, med
server-side pagination. Kontoens bedste resultat og statistik er synkroniseret på
tværs af enheder efter migration. Medalsystemets eksisterende tærskler/genbrugte
grafik bevares; server-RPC skriver medaljeprogression.

PKCE kræver samme browsers gemte verifier; et link fra installeret PWA kan åbne i
Safari med anden lagring og fejle. UI tilbyder at anmode om nyt link fra den browser.
Udløbne/brugte links og gamle implicit-tokenlinks giver en sikker fejl. URL-code og
Auth-fejlparametre fjernes, mens almindelig hash-routing bevares. Recovery-UI kan
huskes i sessionStorage med et bruger-ID (ingen credentials); det giver ingen ekstra
rettigheder uden en faktisk Supabase-session.

Frontend bruger Supabases egne auth-storagefelter. Passwords lagres aldrig manuelt.
Gamle spil-/profil-/foto-/tema-nøgler ændres ikke. Serverfejl ved profilhentning
viser retry frem for at falde tilbage til gæstens navn. Auth-fejl blokerer ikke spil.

## Kontroller

`npm test`, `npm run lint`, `npm run build` (inkl. data- og PWA-kontrol).
`npm run supabase:check` er fortsat en read-only kontrol af API-kontakt, ikke en test
som opretter brugere eller verificerer hele loginflowet.

Tests mocker SDK'et og dækker gæst/session, signup med/uden bekræftelse, logout,
profiler, races, callback/base/hash, recovery, online statistikforespørgsler,
resultatkø/idempotens, Storage-fotos og leaderboard-pagination/rangering. SSR
kontrollerer rendering af alle fire formularer. Ingen rigtig database/storage er
ændret eller testet mod projektet; se den manuelle staging-guide.


## Formularer og lokal billedredigering

Signup viser “Vælg dit brugernavn – det bliver vist på leaderboardet.” Teknisk
username-feedback vises kun ved ugyldigt input. Signup og recovery har ingen
permanent passwordlængdetekst; alle passwordfelter har Vis/Skjul.

Frontend krævede tidligere 12–128 tegn uden bekræftelse af projektets politik.
Et read-only opslag til projektets `/auth/v1/settings` svarede HTTP 200, men
indeholder ingen passwordkonfiguration. Der er ingen Management API-adgang i
implementeringsmiljøet til at bekræfte minimum/tegnkrav. Derfor sendes ikke-tomme
passwords til Supabase, som alene håndhæver den faktiske politik. SDK'ets
`weak_password`-reasons oversættes sikkert, herunder “Adgangskoden er for kort.
Vælg en længere adgangskode.” Ingen projektindstillinger er ændret, og der er ikke
oprettet konti eller sendt testpasswords til Supabase for at gætte kravene.

“Rediger profil”-dialogen håndterer kontonavne via `public.profiles` og gæstenavne
lokalt. Gæstebilleder gemmes i IndexedDB under `guest`; gamle account-local photo keys
er ikke fallback. Kontoens foto bruger bucket `fcm-avatars` og unique UUID-objektsti
med `avatar_path` som autoritativ reference. Cache brydes ved hver ny unik billedsti.
Andre spilleres billeder hentes fra den offentlige bucket.

Onlineplatformens migration, tabeller, RPC'er, policies og manuelle aktivering er
beskrevet i [online-platform.md](./online-platform.md). Ingen migrations, Auth-
indstillinger eller deployments er ændret automatisk.
