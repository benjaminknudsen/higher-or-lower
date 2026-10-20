# Gæt startopstillingen

Ny, separat spiltype på `#spil/lineup`. Intro, kamp, bane, hintdialog og resultat vises af `src/components/lineup/LineupGame.jsx`. `LineupStatistics.jsx` viser lokale profil- og rekordtal. Ingen ændringer i Higher or Lower-motoren, spillerfilen, highscore-nøglerne eller deploymentopsætningen.

## Verificerede data

Tre verificerede kampe er inkluderet. Kun Viborg-kampen er aktiv:

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

## Lokal lagring og fremtidig rangliste

`localStorage['fcm.lineup.v1']` indeholder `{ version: 1, played: [], round: null, results: [] }`.

- `active` i kampdatabasen styrer udvælgelsen uafhængigt af `verified`. Sæt blot flere verificerede kampe til `active: true` for at udvide puljen. Ældre poster uden `active` behandles som aktive for bagudkompatibilitet. Én aktiv kamp kan genvælges ubegrænset; ingen aktive kampe giver `null` uden loops.
- `archivedRounds` tilføjes ved udfasning af en gemt runde fra en eksplicit inaktiv kamp. Hele runden bevares, mens `round` nulstilles til introen. Arkivet gemmes sammen med næste spilhandling. Eksisterende resultater, statistik og lagringsnøglen bevares; en ufærdig runde giver ikke et kunstigt resultat.
- `played`: valgte kamp-ID'er i den aktuelle cyklus. Nye kampe indgår automatisk. Cyklussen starter forfra, når alle er valgt, og undgår også samme kamp umiddelbart ved cyklusskift, hvis muligt.
- `round`: ID, komplet kampkopi, start, absolut tidsfrist, gættede spiller-ID'er, hint-ID'er, fejl og slutstatus. Gemmes synkront ved hver handling. Kampkopien beskytter igangværende runder mod efterfølgende ændringer i JSON-filen. Afsluttede runder vises igen, indtil en ny startes.
- `results`: separate resultater med `modeId: "lineup"`, `matchId`, score, antal korrekte, fejl, hints, start/slut og varighed. Hvert runde-ID registreres højst én gang. Statistik afledes herfra. Ingen data sendes til en server eller vises som globale placeringer.

Timeren beregnes fra `deadline`; både indsendelser, hintkøb, interval, `pageshow` og synlighedsskift kontrollerer udløb. Forladte runder fortsætter i virkelig tid og gendannes, når spiltypen åbnes igen. Udløbne runder registreres ved genåbning af spiltypen. Hints kræver mindst 5 optjente point. Alle 11 korrekte tæller som en perfekt opstilling, også med købte hints.

Den eksisterende PWA precacher spillets bundt, CSS og lokale kampdata. Første besøg kræver installation/indlæsning online. Den eksisterende opdateringsmekanisme udskyder opdateringer på `#spil/`-ruter; spillets lagring er uafhængig af service worker-cachen.

## Verifikation

Automatiske tests dækker kampvalidering, tilfældighed/cyklus, formationer, navneprikker, Unicode, aliaser/tvetydighed, gentagelser, dobbeltklik, tre fejl, alle slutbetingelser, præcis tidsfrist, hintpris, gendannelse og idempotent resultat/statistik.

Manuel kontrol på fysisk iPhone anbefales: 390 × 844 og 320 px bredde, standalone, safe areas, tastatur åbent/lukket, appskift, genåbning efter tidsfrist, flytilstand efter første onlineindlæsning samt en ventende PWA-opdatering. Browserforbindelsen i implementeringsmiljøet fejlede, så disse kontroller er ikke udført her.
