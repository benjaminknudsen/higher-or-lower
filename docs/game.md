# Spiloplevelse og verificerede data

## Produktion og udviklingspreview

Produktionsdatabasen er uændret og tom. Forsiden viser **Afventer data**; startknappen er deaktiveret. Et direkte spillink viser forklaringen. De øvrige tre tilstande er fortsat ikke implementeret. Definitioner og kildekrav findes i [player-data.md](player-data.md).

Det aktive spilforløb kan afprøves separat med `npm run dev:game` eller `/dev/game.html` på en kørende Vite-server. Denne udviklingsindgang:

- viser permanent **Testdata – Fiktive spillere og tal. Kun udviklingstest**;
- bruger den eksisterende testfil `src/data/fixtures/players.test.json`;
- bruger `dev-fcm`/`dev-goals` til rekorder, så rigtige rekorder ikke overskrives;
- mærker også delte resultater som fiktive testdata;
- er ikke importeret af App og er ikke med i produktionsbuildet.

## Spilforløb og feedback

Svarreglerne i `src/game/engine.js` er uændrede: bland én gang, træk uden gentagelser, giv ét point pr. rigtigt svar, og godkend begge retninger ved lige mange mål. Kun første svar på det aktuelle spørgsmåls-id accepteres. Sidste spiller bliver næste spørgsmåls reference. Alle spillere brugt afslutter med Fuld plade.

`GameScreen` filtrerer verificerede data og sender dem til den genanvendelige `GameSession`. Efter et svar låses begge knapper, og det skjulte tal afsløres. Grøn/rød feedback og kort tekst forklarer resultatet; forkerte svar viser den korrekte retning og begge tal.

Automatisk fortsættelse: 1.200 ms ved almindelige rigtige svar, 1.600 ms ved lige mange mål og forkerte svar. Der er ingen ekstra næste-knap. Forkert svar fører til Game Over; sidste rigtige svar til Fuld plade. Den samlede feedbackplads er fast, også for uafgjorte sammenligninger og rekordbeskeder.

Timeren lever i en effect med oprydning. Navigation eller genstart rydder den. Skjulte faner pauser afsløringen; ved tilbagekomst gives et helt læseinterval igen. Hver timer kan kun fortsætte ét spørgsmål, og reduceren ignorerer forældede spørgsmål.

Animationer af tal, score, nye kort, jubel og fejl er korte og bruger opacity/transform frem for ændret layout. `prefers-reduced-motion` deaktiverer dem, men bevarer læsetiden. På korte skærme fjernes gentagne overskriftsoplysninger, så svarknapperne får plads. Game Over kan scrolles lodret.

## Stime og personlig rekord

Stimen er antallet af rigtige svar i træk i det aktuelle spil. Da første forkerte svar afslutter spillet, svarer den til score.

Gæsters rekordnøgle: `fcm-higher-or-lower:highscore:v1:<clubId>:<modeId>`. Gæsterekord skrives ved det rigtige svar, så den er gemt, selv om gæsten forlader spillet før slutskærmen. Lavere scorer overskriver ikke højere rekorder. Indloggede brugere læser rekorden fra Supabase og kontospil synkroniseres ved afslutning gennem idempotent RPC; kontospil ændrer ikke gæstenøglen. Fælles leaderboardet bruger kun registrerede kontoresultater. Kontostatistik og medaljer kræver den upåførte migration beskrevet i `online-platform.md`.

Fejlbehæftede lagrede værdier ignoreres. Blokeret/fuld localStorage får ikke spillet til at fejle; rekorden kan stadig vises for denne tur, og resultatet forklarer, hvis den ikke kunne gemmes.

Slutskærmen indeholder humor afhængigt af score, antal rigtige svar, personlig rekord, særlig rekordbesked, **Prøv igen**, hjemknap og deling.

## Deling

Del-knappen forsøger Web Share API ved et brugertryk. Hvis API'en mangler eller fejler, forsøges Clipboard API. Hvis kopiering er blokeret, vises en markerbar resultattekst til manuel kopiering. En afbrudt native deling udløser ikke automatisk kopiering. Dobbelte delingstryk er låst; asynkrone resultater efter afmontering opdaterer ikke komponenten. Der sendes kun en kort resultattekst, ingen private URL'er eller spillerdata.

## Kontrol og manuel afprøvning

- `npm test`: spilregler, datakvalitet, rekorder, korrupte/blokerede lagre, timeroprydning, skjulte faner og delingsfallbacks.
- `npm run build` og `npm run lint`.
- Separat Chrome-kontrol med tydeligt mærkede fixtures ved 320 × 568, 375 × 667, 390 × 844 og desktop: touch, svarlås, automatisk fortsættelse, alle spillere brugt, genstart, Game Over, rekord efter genindlæsning og deling med simulerede platform-API'er.
- Kontrol af reduceret bevægelse og fast feedbackhøjde ved identiske tal. Produktionsspillet forbliver utilgængeligt uden verificerede data.

Test manuelt på en fysisk iPhone og Android: knaptryk, tempoet i feedback, baggrund/tilbagekomst, native delingsark, annullering, udklipsholdertilladelse og rekord efter genindlæsning. Brug udviklingspreviewen indtil verificerede produktionsdata foreligger. Capacitor-specifik adfærd kan først kontrolleres, når appskallen er tilføjet.
