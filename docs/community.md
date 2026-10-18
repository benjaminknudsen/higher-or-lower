# Profil, statistik og demo-leaderboard

## Sider og navigation

Appens standardstart er nu velkomstskærmen; PLAY fører til den eksisterende spilmenu på `#forside`. Se [welcome.md](welcome.md). Bundnavigationen er skjult på velkomsten.

- `#profil`: `ProfilePage` med redigerbart navn, standardavatar, eksisterende `HighScoreMedal`, statistik og rekorder pr. spiltype.
- `#leaderboard`: `LeaderboardPage` med fire filtre, podium, rangliste og egen placering. Kun Flest kampe er aktiv.
- `#forside`: eksisterende forside. `#rekord` og den eksisterende selvstændige rekordvisning bevares; den markeres som et underområde af Profil i navigationen.
- `BottomNavigation` er fast, tager højde for safe areas og vises aldrig i gameplay eller Game Over. Hash-navigation kræver hverken router-dependency, server-rewrites eller sidegenindlæsning.

Forsiden reserverer plads til navigationen inden for sin viewport. Meget små skærme må scrolle lodret for at holde indhold tilgængeligt. Profil og leaderboard scroller naturligt, med bundpadding der holder det sidste indhold over navigationen. Baggrunden matcher den eksisterende `--game-dark`; spilkortenes styles og svarknapper er ikke ændret.

## Lokal datalagring

`src/services/localAccount.js` er den eneste nye adgang til localStorage. `useLocalAccount` stiller data til rådighed for UI og lytter til ændringer, både i samme vindue og fra andre faner.

Profilnøglen er `fcm-higher-or-lower:profile:v1`, med modellen `{version: 1, name}`. Standardnavnet er FCM-fan. Navne trimmes, normaliseres og begrænses til 24 tegn. De vises som almindelig React-tekst.

Hvert faktisk spil får en UUID ved første accepterede svar. Statistik gemmes under `fcm-higher-or-lower:game-stats:v1:<sessionId>` med `{version, clubId, modeId, lastQuestion, answers, correct}`. Separate nøgler holder to åbne spil adskilt. Samme eller et ældre spørgsmål kan ikke tælles igen. Der gemmes ingen spillerkort, spillerstatistikker eller demo-spil i denne statistik.

- **Spillede runder**: antal spil med mindst ét afgivet svar. Det tæller også et spil, som man forlader før Game Over, fordi svarene faktisk er afgivet. En genstart uden et svar tæller ikke.
- **Korrekte svar**: summen af faktisk korrekte svar fra disse spil.
- **Træfsikkerhed**: korrekte svar divideret med alle afgivne svar, afrundet til hele procent. 0 svar giver 0 %.
- Statistikken inkluderer kun fremtidige spil. Eksisterende highscore omregnes aldrig til gættet historik.

`GameSession` tilføjer kun en registrering efter motoren accepterer et svar. Regler, timing, animationer og scoreberegning er bevaret. Lige kamptal følger fortsat motorens eksisterende korrekt-logik. Gentagne tryk er idempotente i statistiklaget, også hvis de kommer før React har opdateret knapperne.

Den eksisterende `useHighScore`/`highScore.js` genbruges uændret, med de samme lagringsnøgler og medaljefarver. Ufuldstændige eller ødelagte nye statistikposter ignoreres. Ved blokeret/fuld localStorage fungerer profil/statistik i hukommelsen, og profilen forklarer begrænsningen. Ingen eksisterende nøgler ryddes eller migreres.

## Demo og kommende Supabase

Fiktive eksempelprofiler og eksempelrekorder ligger udelukkende i `src/data/leaderboardDemo.js`. De har intet med de 150 verificerede FCM-spilleres data at gøre. Siden viser tydeligt, at det er en demo, og at kun den lokale brugers navn og rekord er fra denne enhed. Ingen data sendes online.

`src/services/leaderboard.js` eksporterer en asynkron repository-grænse:

```js
list({ modeId, profileName, highScore })
// => { source: 'demo', entries: [{id, name, score, isSelf, rank}] }
```

Ranglisten sorteres efter score faldende og derefter stabilt ID stigende. Samme score giver delt placering, fx 1, 1, 3. Den lokale spiller tilføjes én gang som `local:self`. Der vises ingen rekorder for låste spiltilstande.

En senere Supabase-adapter kan erstatte `leaderboardRepository.list` og levere samme visningsmodel med en anden `source`. Demo-mærkningen styres allerede af datakilden. Backend skal på det tidspunkt identificere den autentificerede bruger og levere serverberegnede placeringer; en global rangliste skal ikke baseres på et lokalt klientsorteret udsnit. Profil-/statistiklaget kan udskiftes bag `useLocalAccount`, mens siden fortsat modtager samme profil-/statistikmodel. Ingen Supabase-pakke, login eller database er oprettet nu.

## Validering

- 81 tests, lint og produktionsbuild inklusive PWA-kontrol består.
- Nye tests dækker tomme/eksisterende data, normalisering, bevaret highscore, vedvarende statistik, dobbelte svar, to spilinstanser, ugyldige poster og lagerfejl. Ranglistetests dækker sortering, delte placeringer, egen placering og demokilde.
- WebKit: 320×568, 375×667, 390×844, 430×932 og 1440×900 med simuleret standalone og 47/34 px safe areas. Navigation, formular, persistens, gamle rekorder, nye rekorder, Game Over/genstart og manglende bundnavigation under gameplay er afprøvet. Ingen vandret scrolling; forsiden passer uden scrolling ved 390×844. Sidste indhold på de nye sider kan scrolles fri af navigationen.
- Chromium/PWA: profil, statistik og demo-rangliste virker også efter offline-genindlæsning. Eksisterende offline-gameplay samt worker-opdatering på forsiden virker stadig. Data og rekord bevares.
- Spillerfil, spilmotor, highscore-lagring, medaljefarver, PWA-konfiguration, package dependencies og deployment-workflow er uændrede. Nye assets følger automatisk med i det eksisterende precache/build.

Fysisk iPhone-installation kan ikke afprøves her; efter deployment bør profilnavn, en spilrunde og navigation afprøves på telefonen. Der er ikke pushet eller deployet fra denne opgave.
