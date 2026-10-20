# Online spilplatform – Supabase opsætning

Migration 003 og 004 er allerede kørt i Supabase. Migration 005 ændrer leaderboardet
fra én placering pr. spiller til individuelle forsøgsplaceringer. Der er ikke
foretaget deployment. Når en påkrævet RPC ikke er aktiveret, vises en konkret fejl;
appen falder ikke lydløst tilbage til gæstedata eller opdigtede leaderboardspillere.

## Migration og manuel aktivering

Følg denne rækkefølge i det eksisterende Supabase-projekt:

1. Kontrollér, at migration 003 og 004 allerede er anvendt.
2. Gennemgå hele [`202610200005_attempt_leaderboard.sql`](../supabase/migrations/202610200005_attempt_leaderboard.sql).
   Den bruger eksisterende `game_results`; ingen resultater kopieres eller migreres.
3. Åbn Supabase **SQL Editor**, vælg `postgres`, indsæt hele migration 005, og
   kør den én gang som én transaktion. Kør ikke migration 003 eller 004 igen.
4. Database → Functions: kontrollér, at `get_game_leaderboard` er opdateret.
   Migration 005 genbruger samme RPC-signatur og bevarer `get_my_top_three_results`
   fra migration 004 uændret.
5. Afprøv som gæst og indlogget bruger for begge spil. Bekræft, at profiler fortsat
   viser brugerens egne tre forsøg med dato, mens leaderboardet rangerer individuelle
   forsøg og viser brugerens op til tre placeringer. Ingen Edge Function eller
   deployment kræves.

## Datamodel

Alle brugere bruger `auth.users.id` som stabil ejeridentitet. E-mail forbliver kun i
Auth og indgår ikke i de offentlige svar.

Migration 004 henter hvert brugers top tre fra de eksisterende
`game_results`-rækker til profilsiden. Migration 005 viser disse individuelle forsøg
som separate rækker i én samlet rangliste. Begge bruger sorteringen score faldende,
tidspunkt stigende og `result_id` stigende. Ved identiske `result_id` på tværs af
brugere bruges bruger-ID som yderligere deterministisk tie-breaker. Leaderboardets
placeringer er fortløbende, og `get_game_leaderboard` returnerer kun de tre bedste
forsøg pr. spiller; den private profil-RPC fra migration 004 er uændret og
returnerer kun brugerens egne score, dato og ID.
Gæster bruger lokal browserlagring; eksisterende lineup-resultater i den lokale
spilhistorik indgår, og nye gæsteforsøg gemmes separat fra kontoresultater.

| Objekt | Formål og adgang |
| --- | --- |
| `public.profiles` | Eksisterende tabel: offentlig username og `avatar_path`. Foto-path er Auth-ID-mappe plus unikt filnavn. |
| `public.game_stats` | Offentlige aggregater pr. `(user_id, game_type)`: gennemførte spil, bedste score, antal svar/korrekte og perfekte lineup-runder. |
| `public.game_results` | Resultatkvitteringer med unik `(user_id, game_type, result_id)`. Lineup-kvitteringer gemmer eksisterende point, korrekte spillere, hint og fejl. RLS giver kun ejeren SELECT. Ingen direkte browserwrites. |
| `public.player_achievements` | Offentlig medaljeprogression for `Flest kampe`. Ingen direkte browserwrites; RPC afleder værdier fra kontoens bedste indsendte streak. |
| `submit_game_result` | Authenticated-only RPC. Kræver `p_user_id = auth.uid()`, afviser anonyme Auth-claims, validerer spilgrænser og idempotens, serialiserer hvert kontos writes og begrænser til 30 nye resultater pr. minut. Statistik/medaljer opdateres atomisk. |
| `get_game_leaderboard` | Pagineret public RPC. Returnerer spillerens tre bedste individuelle forsøg pr. spiltype, globalt rangeret med fortløbende placeringer og kun public username/avatar path. `own_entries` indeholder højst tre placeringer for den indloggede kalders konto. |
| `storage.buckets.fcm-avatars` | Public læsning er nødvendig for offentlige avatarer. Upload/sletning kræver authenticated ejer og præcis sti `<auth.uid()>/<uuid>.webp|jpg`; kun WebP/JPEG og maks. 2 MiB. Objekt-update er ikke tilladt; klienten uploader nye unikke stier. |

`Flest kampe` gemmer kontospil ved afslutning eller når et spil forlades efter
første svar; det delvise streak-resultat tæller som ét spil. Scoren og medaljerne
bruger de eksisterende streak-grænser: Beginner 0,
Talent 10, Skarpskytte 25, Elite 35, Legende 50, Ultimate 100. `Gæt
startopstillingen` registrerer gennemførte runder, point, korrekt gættede spillere,
anvendte hints, fejl og perfekte runder; hint koster 5 point, så point skal være
et multiplum af 5.
En perfekt runde betyder, at alle 11 spillere blev gættet, også hvis hints sænkede
pointtallet. Spillets eksisterende 3-minutters tidsgrænse anvendes på serverens
resultatgrænse. Profilen viser runder, gennemsnitlig korrekt-andel, perfekte
opstillinger og samlet korrekt gættede spillere. Leaderboardet rangerer spillerens
tre bedste individuelle forsøg pr. spiltype. De eksisterende gæste-highscores/statistikker importeres
ikke automatisk og bliver ikke kontoens udgangspunkt.

## Klientadfærd

- Gæst: fortsætter med lokale highscore-/statistiknøgler, lokal lineup-historik og
  gæstebilledet i IndexedDB. Resultater sendes ikke til RPC.
- Indlogget konto: lokale gæstetal vises ikke eller opdateres af kontospil. Statistik
  hentes med konto-ID, bedste resultat kommer fra online aggregater, og resultatfoto
  kommer fra `profiles.avatar_path`/Storage.
- Auth-indlæsning: gæsteprofil og tidligere kontodata holdes skjult, indtil ejer er
  kendt. Skift mellem konti reinitialiserer spillets ejerbundne state.
- Resultater køes i localStorage under den oprindelige konto-ID ved netværksfejl.
  Genforsøg sker automatisk ved login, netværksgendannelse og kan startes fra
  resultatskærm/profil. Unik
  result-ID gør gentagne RPC-kald idempotente; ældre allerede-køede kontoresultater
  normaliseres til den udvidede RPC-payload, og gamle gæsteresultater køes ikke.
- Foto upload bruger den eksisterende Canvas/WebP/JPEG-komprimering. Nyt billede
  får en ny UUID-sti, så billedcache ikke viser gammel fil. Profilens sti opdateres
  først efter upload; gammel fil slettes derefter. Oprydningsfejl vises eksplicit.
- Leaderboardet har loading/error/empty states, 25-forsøgs sider og ingen
  eksempelspillere. En spiller kan forekomme op til tre gange, Hall of Fame viser
  de tre bedste individuelle forsøg, og gæster kan læse leaderboardet men ikke få
  personlige onlineplaceringer.
- Streak-resultater indeholder kun scorer og antal svar; spillet måler ikke
  varighed, så `duration_ms = 0` betyder "ikke målt". For et afbrudt streak-spil
  er antal svar lig med scoren eller scoren plus det sidste forkerte svar.
  Storage kontrollerer deklareret MIME-type og størrelse, men validerer ikke billedets
  bytes kryptografisk eller server-side; billedindholdet kommer fra klientens
  komprimering og kan ikke betragtes som betroet.

## Sikkerhedsgrænser

RLS beskytter tabeladgang, resultathistorik og Storage-ejerskab. Der gives ikke
`service_role` til browseren. Statistik- og achievementtabeller kan læses offentligt,
fordi de leverer leaderboardet; kun username/avatar path og aggregerede spilresultater
er inkluderet, aldrig email.

**Scorer er klientrapporterede, ikke verificerede.** En bruger kan ændre JavaScript,
kalde RPC direkte med sit eget JWT, manipulere localStorage/køen eller automatisere
lovlige pointværdier. RPC håndhæver spillets point-/svargrænser, lineup-pointtrin,
ejerskab og idempotens. Den serialiserer desuden hver kontos resultatskrivninger
omkring en grænse på 30 nye resultater pr. minut, så samtidige RPC-kald ikke kan
omgå tællingen. Det standser ikke målrettet snyd, flere konti eller kompromitterede
klienter. Det beviser ikke, at spillet reelt blev spillet eller at en lineup-beregning
blev udført ærligt. Medaljer afledes server-side af accepterede resultater, men de
bliver derfor heller ikke stærkere end indsendte resultater.

Stærkere integritet kræver senere en serverstyret spilrunde: serverudstedt challenge/
seed, tidsbegrænset signeret runde-token, servervalidering af svar/resultat og mere
robust rate limiting (fx edge-/IP-/abuse-lag). Browserbaserede spil kan stadig
manipuleres, så selv dette er ikke absolut anti-cheat. E-mailbekræftelse og
CAPTCHA/rate limits for Auth er separate Supabase-indstillinger og ændres ikke her.

## Hvad kræver migrationen

Frontend uden migration: gæstespil og gæstelagring virker fortsat; indloggede
online-stats/leaderboard viser fejl, og Storage-upload fejler eksplicit. Efter
migration: konto-ID-bundne aggregater, resultatkø, medaljeprogression, fælles
leaderboard og avatar-sync på tværs af enheder kan bruges. Ingen eksisterende
profil-/Auth-data slettes. Konto-highscores starter på 0 ved første online-resultat;
lokale gæsterekorder importeres ikke.
