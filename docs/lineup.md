# Gæt startopstillingen

Ny, separat spiltype på `#spil/lineup`. Intro, kamp, bane, hintdialog og resultat vises af `src/components/lineup/LineupGame.jsx`. `LineupStatistics.jsx` viser lokale profil- og rekordtal. Ingen ændringer i Higher or Lower-motoren, spillerfilen, highscore-nøglerne eller deploymentopsætningen.

## Verificerede data

Ni verificerede kampe er inkluderet, hvoraf syv er aktive. De tre oprindelige poster er bevaret uændret:

- Celtic FC 1–1 FC Midtjylland, 20. juli 2021, 4-3-3 (`active: false`).
- FC Midtjylland 2–1 Celtic FC, 28. juli 2021, 3-4-3, efter forlænget spilletid (`active: false`).
- Viborg FF 1–2 FC Midtjylland, 19. oktober 2026, 3-4-1-2 (`active: true`).

Celtic-kampenes startere, formation, dato og resultat er dokumenteret i FCM's egne referater:

- https://www.fcm.dk/kampe/celtic-fc-fc-midtjylland-20-07-2021/
- https://www.fcm.dk/kampe/fc-midtjylland-celtic-fc-28-07-2021/

Kampenes konkrete trøjenumre er kontrolleret mod Sky Sports' holdopstillinger:

- https://www.skysports.com/football/celtic-vs-fc-midtjylland/teams/446724
- https://www.skysports.com/football/fc-midtjylland-vs-celtic/teams/446732

Banen viser skematiske pladser inden for den dokumenterede formation, ikke målte koordinater. Historiske mononymer som Evander, Paulinho, Charles og Juninho bruges som i FCM's referater. Ingen eksempelkampe eller opdigtede opstillinger indgår.

### Viborg-kampens dokumentation

- [FCM's startopstilling](https://www.fcm.dk/nyheder/start-11eren-til-mandagens-midtjyske-derby/): alle 11 startere og datoen 19. oktober 2026.
- [FCM's trup til netop kampen](https://www.fcm.dk/nyheder/truppen-mod-viborg-4/): alle starteres trøjenumre.
- [FCM's kampreferat](https://www.fcm.dk/kampe/viborg-ff-fc-midtjylland-19-10-2026/): 1–2-resultatet og indskiftningen af Cho i pausen.
- [OFStats' kampoversigt](https://ofstats.com/matches/view/viborg-ff-fc-midtjylland-2026-10-19): formationen 3-4-1-2 og de samme 11 startere.

Der var ingen screenshots vedhæftet, som kunne inspiceres. Officielle kilder korrigerer den indsendte liste: **Kjell Wätjen (29)**, **Friday Etim (90)** og **Stanley Iheanacho (18)** erstatter henholdsvis Kevin Wätjen, Franculino Djú og Cho Gue-sung. Andreas Maxsø (2) er bekræftet. Angrebet vises med Etim til venstre og Iheanacho til højre i det skematiske, opadrettede 3-4-1-2-layout.

## Tilføj flere kampe

Udvid kun arrayet i `src/data/lineupMatches.json`. Kopiér en eksisterende post og udfyld:

- Unikt `id`, `active: true` (eller `false` for en arkiveret kamp), `verified: true`, `verifiedAt` (kontroldato), `home`, `away`, `date` i ISO-format, `score: [hjemmemål, udemål]`, `competition`, `formation`, `sources` og eventuelt `resultNote`.
- Præcis 11 spillere med unikke `id`, `name`, `aliases: []`, `position`, `row`, `slot`.
- `row: 0, slot: 0, position: "GK"` er målmanden nederst. De følgende rækker går fra forsvar til angreb. Inden for hver række tælles `slot` fra 0 fra venstre mod højre set på skærmen.
- For `4-3-3` har rækkerne henholdsvis 1, 4, 3, 3 pladser. `4-4-2`, `3-5-2` og formationer med ekstra kæder som `4-2-3-1` bruger samme system.
- Tilføj kun `shirtNumber` sammen med en HTTPS-`numberSource`, når nummeret er kontrolleret i netop denne kamp. Brug `shirtNumber: null` uden verificeret nummer; hint er da utilgængeligt.
- Tilføj kun dokumenterede navnevariationer i `aliases`. Delte aliaser accepteres ikke som entydige gæt.

Kør `npm run lineup:check`, `npm test`, `npm run lint` og `npm run build`. Build afviser ugyldige poster; spillets udvælgelse filtrerer dem også fra. Validering kontrollerer struktur og felter, men erstatter ikke historisk kildekontrol.

## Gæstelagring og kontosynkronisering

For gæster indeholder `localStorage['fcm.lineup.v1']` `{ version: 1, played: [], round: null, results: [] }`. Indloggede brugere starter med kontoafgrænset spilstate i hukommelsen; deres resultater læses fra Supabase og lokale gæsteresultater importeres ikke.

- `active` i kampdatabasen styrer udvælgelsen uafhængigt af `verified`. Sæt blot flere verificerede kampe til `active: true` for at udvide puljen. Ældre poster uden `active` behandles som aktive for bagudkompatibilitet. Én aktiv kamp kan genvælges ubegrænset; ingen aktive kampe giver `null` uden loops.
- `archivedRounds`: ældre arkiverede snapshots bevares som historiske felter, men gendannes og vises ikke.
- `played`: valgte kamp-ID'er i den aktuelle cyklus. Nye kampe indgår automatisk. Cyklussen starter forfra, når alle er valgt, og undgår også samme kamp umiddelbart ved cyklusskift, hvis muligt.
- `round`: er altid `null` i localStorage. Den aktuelle kamp, deadline, gæt, hints, fejl og slutstatus findes kun i komponentens hukommelse. Genåbning viser altid introen. Ved appopstart ryddes tidligere gemte `round`-felter, uden at resultater eller øvrige data berøres.
- `results`: separate gæsteresultater med `modeId: "lineup"`, `matchId`, score, antal korrekte, fejl, hints, start/slut og varighed. Hvert runde-ID registreres højst én gang. Statistik afledes herfra. Gæsteresultater sendes ikke til en server. Kontoens afsluttede resultater sendes separat til den ejerkontrollerede Supabase-RPC.

Timeren beregnes fra `deadline`, mens runden er åben. Indsendelser, hintkøb og interval kontrollerer udløb. Navigation væk fra `#spil/lineup`, `visibilitychange` til skjult, `pagehide` og unmount kasserer den aktuelle runde; den tæller ikke som gennemført. Interval og listeners fjernes ved unmount. Genindlæsning eller proceslukning kan ikke gendanne en runde, da snapshots aldrig gemmes. Kun faktisk afsluttede runder registreres idempotent i `results`. Hints kræver mindst 5 optjente point. Alle 11 korrekte tæller som en perfekt opstilling, også med købte hints.

Den eksisterende PWA precacher spillets bundt, CSS og lokale kampdata. Første besøg kræver installation/indlæsning online. Den eksisterende opdateringsmekanisme udskyder opdateringer på `#spil/`-ruter; spillets lagring er uafhængig af service worker-cachen.

## Verifikation

Automatiske tests dækker kampvalidering, tilfældighed/cyklus, formationer, navneprikker, Unicode, aliaser/tvetydighed, gentagelser, dobbeltklik, tre fejl, alle slutbetingelser, præcis tidsfrist, hintpris, nulstilling ved genåbning, oprydning af gammel rundestatus og idempotent resultat/statistik.

Manuel kontrol på fysisk iPhone anbefales: 390 × 844 og 320 px bredde, standalone, safe areas, tastatur åbent/lukket, appskift, genåbning på introen efter appskift og genindlæsning, flytilstand efter første onlineindlæsning samt en ventende PWA-opdatering. Browserforbindelsen i implementeringsmiljøet fejlede, så disse kontroller er ikke udført her.

## Startopstillingsrangliste: samlede korrekte gæt

Profilens gæstestatistik bruger stadig `statistics(store).correct`: summen af `results[].correct` fra afsluttede runder. Rundens `guessed` indeholder kun brugerens egne gæt; automatisk afsløring og hints lægger ikke navne til. `recordResult` registrerer et runde-ID højst én gang.

Kontostatistik synkroniseres som afsluttede resultater med score/point, antal korrekte spillere, varighed og perfekt-status. Offlinefejl køes pr. konto og kan genforsøges. Kontoens lineup-leaderboard rangerer efter bedste enkeltresultat i point; lige point deler placering. Statistikken over samlede korrekte spillere vises separat på profilen. Data kræver migrationen beskrevet i `online-platform.md`; værdierne er klientrapporterede, ikke verificerede.


## Historiske tilføjelser · 20. oktober 2026

Den indsendte liste indeholder ti kampe. Seks er tilføjet til `src/data/lineupMatches.json` med `active: true`. Dato, resultat, alle 11 startere og formation er kontrolleret mod kampkilderne. Banens koordinater er skematiske inden for formationens kæder, ikke målte positioner.

| Kamp | Dato | Formation | Dokumentation |
| --- | --- | --- | --- |
| FCM 5–1 Lazio | 15.09.2022 | 4-3-3 | [FCM's referat med start-XI](https://www.fcm.dk/kampe/fc-midtjylland-s-s-lazio-15-09-2022/), [Lazios officielle referat](https://www.sslazio.it/it/news/match-report/uefa-europa-league-midtjylland-lazio-le-formazioni-ufficiali) |
| FCM 4–1 Slavia Prag | 30.09.2020 | 4-3-3 | [FCM's start-XI](https://www.fcm.dk/nyheder/ucl-de-startende-11-mod-slavia-prag/), [formation og numre](https://www.transfermarkt.com/fc-midtjylland_sk-slavia-prague/index/spielbericht/3450465) |
| Liverpool 2–0 FCM | 27.10.2020 | 4-2-3-1 | [UEFA-rapport](https://www.uefa.com/newsfiles/UCL/2021/2029404_HR.pdf), [DFB's formation](https://datencenter.dfb.de/datencenter/champions-league/2020-21/gruppe-d/fc-liverpool-fc-midtjylland-2320190), [Sky Sports' numre](https://www.skysports.com/football/liverpool-vs-fc-midtjylland/teams/438970) |
| FCM 1–1 Liverpool | 09.12.2020 | 4-2-3-1 | [UEFA's taktiske startopstilling](https://www.uefa.com/newsfiles/UCL/2021/2029460_LU.pdf), [Sky Sports' numre](https://www.skysports.com/football/midtjylland-vs-liverpool/teams/439040), [formationsoversigt](https://tribuna.com/en/match/liverpool-vs-midtjylland/) |
| Southampton 1–1 FCM | 20.08.2015 | 4-1-4-1 | [Sky Sports](https://www.skysports.com/football/southampton-vs-fc-midtjylland/teams/350805); formation som eksplicit angivet i bestillingen |
| FCM 1–0 Southampton | 27.08.2015 | 4-1-4-1 | [FotMob: faktisk startopstilling og numre](https://www.fotmob.com/en-GB/matches/midtjylland-vs-southampton/29tzug) |

Lazio-spillerne har `shirtNumber: null`: kilderne ovenfor dokumenterer ikke numrene sikkert. Deres nummerhint er derfor utilgængeligt; de øvrige fem nye kampe har kildehenvisninger på de konkrete trøjenumre. Ingen numre er overført fra en anden sæson eller kamp.

### Fire uafklarede kampe

Alle ti kampe er registreret med 11 unikke startere, men følgende fire ligger i **`src/data/lineupMatches.pending.json`** med `active: false`, `verified: false`, `formation: null` og ingen positionskoordinater eller nummerhints. Filen importeres ikke af appen og kan ikke indgå i tilfældig udvælgelse.

| Kamp | Dato | Uafklaret |
| --- | --- | --- |
| FCM 2–1 Manchester United | 18.02.2016 | Modstridende formationsangivelser; [Sky](https://www.skysports.com/football/fc-midtjylland-vs-manchester-united/teams/352791) bekræfter starterne. |
| FCM 1–0 AC Horsens | 21.05.2018 | [DanskFodbold](https://www.danskfodbold.com/kamp.php?ID=60864) bekræfter starterne, men ikke formationen og pladserne. |
| Manchester City 0–1 FCM | 14.08.2008 | [Sky](https://www.skysports.com/football/man-city-vs-midtjylland/teams/1770) og [Citys referat](https://www.mancity.com/news/first-team/match-report/2008/august/city-v-fc-midtjylland-14-aug-2008) dokumenterer kampen; ingen sikker startformation fundet. |
| Brøndby 1–1 FCM, straffe 3–4 | 17.05.2019 | [BrøndbyStats](https://www.brondbystats.dk/Match/Details/3261) dokumenterer starterne, men ikke præcis formation og pladser. 1–1 opbevares adskilt fra straffesparksresultatet. |

Når en uafklaret formation er dokumenteret, flyttes posten til hovedfilen, koordinater og kilder udfyldes, og `verified`/`active` sættes til `true`. Sæt ikke blot `active` på en ufuldstændig post. `lineup:check` kontrollerer begge filer, 11 unikke startere og dubletter på tværs; kun hovedfilens komplette kampe kan spilles.

Ingen eksisterende kampers aktiveringsstatus, lagringsnøgler, resultater eller statistik er ændret. Celtic-kampene er fortsat inaktive, Viborg fortsat aktiv. Ingen komponenter eller temaer er ændret. Testene dækker hele den udvidede kampcyklus, gentagelser, gamle historik-ID'er, alle nye spilleres fulde navne, perfekte runder og tilgængelige/utilgængelige hints.
