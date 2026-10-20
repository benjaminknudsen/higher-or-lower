# Profil, statistik og online leaderboard

## Sider og navigation

- `#profil`: profilnavn, avatar, `HighScoreMedal`, statistik og rekorder pr. spiltype.
- `#leaderboard`: fælles Supabase-rangliste med spilfiltre, podium, paginering og egen placering.
- `#forside`: eksisterende forside. Navigation, safe areas og gameplayflader er bevaret.

Profil- og leaderboardvisninger bruger eksisterende tema-variabler i Neon og FCM.
Leaderboardet viser kun registrerede spillere med online-resultater; ingen
eksempelprofiler eller lokal gæst indsprøjtes i produktionsranglisten.

## Gæste- og kontodata

Gæster beholder lokale profilnavne, rekorder/statistik og lineup-resultater. De kan
læse det offentlige leaderboard, men resultater fra gæstespil indsendes aldrig.
Indloggede brugere får kontostatistik fra Supabase, og kontospil tæller ikke ind i
gæstens lokale statistikker. Auth-indlæsning skjuler gæstedata, til identiteten er
kendt; logout og kontoskift skifter til den rette profil.

Gamle lokale gæsterekorder importeres ikke. Offline-køen indeholder kun nye,
afsluttede kontospil og er adskilt efter Auth-ID. Resultat-ID gør RPC-indsendelse
idempotent; en synkroniseringsfejl vises og kan forsøges igen.

## Online model

`src/services/onlinePlatform.js` afgrænser læsning af kontostatistik og pagineret
leaderboard-RPC. `src/services/onlineGameResults.js` køer og indsender afsluttede
spil. `src/services/cloudProfilePhoto.js` håndterer Storage-fotos. React-hooks
vælger ejerbundne online- eller gæstedata, og Supabase RLS/RPC håndhæver rettigheder
uden browser-writeadgang til statistik eller medaljer.

`game_stats` holder aggregater pr. Auth-ID/spiltype. `game_results` er private
idempotente kvitteringer; `player_achievements` indeholder offentlig
`Flest kampe`-medaljeprogression. `submit_game_result` validerer scoregrænser,
bruger-ID og dubletter, og opdaterer statistik/medaljer atomisk. `get_game_leaderboard`
returnerer offentlig username, avatar path, score og rang med stabil tie-break og
serverpagination.

Leaderboardet sorterer efter bedste enkeltresultat for spiltypen. Lige scores deler
placering (1, 1, 3); visningsrækkefølgen for lige score er stabil via username og
Auth-ID. Profilen viser bedste score og de eksisterende medaljegrænser/grafikker.

Supabase-opsætning, migrationrækkefølge og manuelle aktiveringstrin står i
[online-platform.md](online-platform.md). Migrations er ikke kørt automatisk.

## Sikkerheds- og statistiknoter

RLS tillader public læsning af aggregater og medaljer, ejers egen resultathistorik,
og ingen direkte browserwrites til resultat-/statistik-/medaljetabeller. Public
profilfelter indeholder ikke e-mail. Storage-fotoer er offentligt læsbare, men
write/update/delete begrænses til brugerens Auth-ID-mappe.

Resultaterne er **klientrapporterede, ikke verificerede**. En bruger kan manipulere
browserklienten eller selv kalde RPC med lovlige, men fabrikerede værdier. Score-
grænser, idempotens og rate guard begrænser simple fejl/abuse, men beviser ikke at et
spil blev gennemført. Se sikkerhedsbegrænsningerne i `online-platform.md`.

## Kontroller

Tests dækker guest/cloud dataadskillelse, konto-ID-bundne forespørgsler,
resultatkø/idempotens/offlinegenforsøg, Storage upload/udskift/fjern, leaderboard-
mapping, paginationparametre og ties. Browserens faktiske IndexedDB/Storage og
staging-RLS/RPC-integration skal stadig testes efter manuel migration; dette arbejde
har hverken ændret Supabase-projektet eller deployet appen.
