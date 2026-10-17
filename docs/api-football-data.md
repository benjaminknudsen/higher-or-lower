> HISTORIK: Importværktøjerne er fjernet. Brug den simple spillerfil og [den aktuelle vejledning](player-data.md). Kommandoer og status nedenfor beskriver en tidligere løsning.

> Tidligere primær løsning. Brug [Transfermarkt-vejledningen](transfermarkt-data.md) til den aktuelle opgave.

# FC Midtjylland-data med API-Football

## Faktisk status

Implementeret 17. oktober 2026 på den eksisterende branch. **0 spillere hentet, 0 verificerede spiltal.** Ingen rigtig API-nøgle er angivet eller brugt i arbejdet. HTTP-integrationens tests bruger eksplicit syntetiske svar i hukommelsen; de dokumenterer kodeadfærd, ikke faktisk datadækning. FCM's numeriske API-ID er derfor endnu ikke verificeret og står som `null` i produktionsdatabasen.

Design, spilforløb, highscore og testspil er bevaret. Produktionsspillet læser fortsat kun `src/data/players.json`, aldrig API'et. Den tomme database er nu markeret med API-Football som primær kilde. Tidligere Transfermarkt-undersøgelse er bevaret i [historik](player-data-transfermarkt-history.md) og `data/access-review.json`; anbefalingerne i den historiske tekst er erstattet af brugerens valg af API-Football. Ingen Transfermarkt-scraping implementeres.

## Officielle endpoints

Direkte API-Sports-adgang: `https://v3.football.api-sports.io`, autentificering i headeren `x-apisports-key`. RapidAPI-nøgler understøttes ikke af denne importer.

| Formål | Endpoint | Brug |
| --- | --- | --- |
| Konto og kvote | `/status` | Kontrolleres live før netværksimport; kontooplysninger gemmes ikke. |
| FCM-identitet | `/teams?search=Midtjylland` | Kræver entydigt navn Midtjylland/FC Midtjylland og Danmark. Hold-ID gættes ikke. |
| Turneringer, sæsoner og dækning | `/leagues?team={teamId}` | Gemmer sæsonmetadata og coverage-flags; sæsonlisten er kandidater, ikke bevist kontoadgang eller deltagelse. |
| Aktuel trup | `/players/squads?team={teamId}` | Dokumenteret til aktuel registreret trup; ingen sæsonparameter. Ikke anvendt som historisk kilde i importen. |
| Historiske spillere/statistikker | `/players?team={teamId}&season={startår}&page={side}` | Alle sider, alle returnerede statistikblokke; kun det verificerede hold-ID accepteres. |
| En bestemt spiller/sæson | `/players?id={playerId}&season={startår}` | Mulig manuel stikprøve i dashboardet; ikke nødvendigt med ekstra profilkald i importen. |

Felter i adapteren: `player.id`, `player.name`, `statistics[].team.id`, `league.id`, `league.season`, `games.appearences` (API'ets stavemåde), `goals.total`, `goals.assists`. End-to-end-verifikation af konkrete svar mangler en rigtig nøgle. Ukendte eller ugyldige numeriske felter bliver `null`, også hvor det kunne være fristende at antage 0.

Kilder: den [officielle v3-reference](https://www.api-football.com/documentation-v3), [officielle startguide](https://www.api-football.com/news/post/how-to-get-started-with-api-football-the-complete-beginners-guide) og [coverage-vejledning](https://www.api-football.com/news/post/how-to-optimize-api-sports-calls-and-quota-usage). Referencewebsiden gav ingen læsbar tekst i webværktøjet og HTTP 403 ved direkte hentning; der blev ikke forsøgt omgåelse. Den officielle guide og coverage-artiklen kunne læses.

## Gratisplan: hvad ved vi faktisk?

[Prissiden](https://www.api-football.com/pricing) angiver **100 kald/dag** og begrænsede sæsoner. Den offentliggør ingen entydig årstalsliste for vores konto/FCM. Derfor hævder vi hverken, at nuværende sæson er gratis, eller at et bestemt historisk interval er tilgængeligt. Det er **ikke kontrolleret uden nøgle**. Et betalt abonnement er heller ikke bevis for komplet FCM-historie.

`data:discover` undersøger sæsonerne fra metadata med `/players` side 1. Rapportens `seasonAccess` skelner mellem:

- `player_data_accessible`: et succesfuldt, ikke-tomt spillersvar med hentetidspunkt.
- `access_rejected`: API-fejl vedrørende sæson/adgang; ingen statistik importeret. Kontroller den præcise begrundelse og eventuelt tilladt interval i dashboardet.
- `empty_not_verified`: tomt svar; hverken bevis for 0 spillere eller for manglende deltagelse.

Afbrudte kørsler markeres `interrupted`; endnu uprøvede sæsoner kan findes som forskellen mellem `requestedSeasons` og `seasonAccess`. Metadataens `coverage.players` og `coverage.fixtures.statistics_players` gemmes til kontrol, men er ikke garanti for komplette assists eller alle kampe.

## Tilføj din nøgle og kør

Kræver Node **22.6+** (projektet er kontrolleret med Node 24). Opret selv en konto på [API-Footballs dashboard](https://dashboard.api-football.com/register), og find din direkte API-Sports-nøgle under Account → My Access.

1. Kopiér `.env.example` til `.env` i projektroden, hvis du ikke allerede har en `.env`.
2. Sæt `API_FOOTBALL_KEY=` efterfulgt af din rigtige nøgle i `.env`. Brug **ikke** et `VITE_`-navn. Send eller commit ikke filen.
3. Kør nedenstående. Nøglen bliver kun læst af Node-scriptet og sendt i HTTP-headeren.

```sh
npm run data:api:discover
npm run data:api:import
```

Begræns eventuelt kørslen til år fra rapporten, eksempelvis syntaksen `--seasons=2022,2023` (eksemplet er **ikke** en påstand om adgang):

```sh
npm run data:api:import -- --seasons=2022,2023 --max-requests=40
npm run data:api:import -- --offline --seasons=2022,2023
npm run data:api:discover -- --help
```

Ingen nøgle giver en tydelig fejl før netværkskald og skriver ingen falsk hentningsdato. Offline kræver allerede gemte svar og springer live-kontokontrol over. Kør kun én importproces ad gangen. Rapportering kan tage flere minutter på grund af ratebegrænsningen.

## Lokale filer og genoptagelse

Alt under `data/api-football/local/` er ignoreret af Git og ligger uden for Vites `public`/`src`:

- `cache/*.json`: succesfulde API-svar, parameter-URL og faktisk hentetidspunkt. Ingen request-headers eller API-nøgle.
- `coverage.json`: hold, abonnementstype/kvote uden identitetsoplysninger, sæsonadgang, turneringsdækning, antal unikke importerede spillere og manglende statistikfelter.
- `players.json`: kumulativt normaliseret arkiv med `api-football:{player.id}`, spilleridentitet og observationer pr. spiller/hold/turnering/sæson. Hver observation indeholder kilde-URL og hentetidspunkt. Transfermarkt-ID/link er valgfrie `null`-felter, som kan udfyldes efter manuel identitetskontrol.
- `review.json`: din konkrete kontrol af rettigheder og komplet klubhistorik.
- `candidate.json`: valideret kandidat til spillets lokale JSON.

Kun en fuldt pagineret sæson føjes til arkivet. Hver færdig sæson gemmes atomisk; råsider overlever en afbrydelse midt i næste sæson. Gentag kommandoen for at genoptage med cache. Import af nye sæsoner bevarer tidligere importerede sæsoner; en fuldt genimporteret sæson erstatter tidligere rækker for den sæson. Samme spiller forekommer én gang. Identiske statistikdubletter tælles én gang, modstridende dubletter afbryder behandlingen.

Succesfulde cache-svar genbruges i 24 timer; derefter hentes de igen online. `--offline` bruger også ældre cache og påstår ikke, at den er aktuel. Slet relevante lokale cachefiler for en tvungen opdatering. Slet ikke arkivet ved almindelig genoptagelse. Rapporten beskriver seneste kørsel; arkivet indeholder også tidligere importerede sæsoner med deres originale kildetider.

## Begrænsninger og fejl

Sekventielle kald med mindst 6,5 sekunders mellemrum; langsommere hvis serverens minutgrænse kræver det. Maksimalt 80 netværkskald pr. kørsel som standard. Daglig kvote kontrolleres fra status og headers med reserve på 5 kald. Tom minutkvote, HTTP 429, autentificeringsfejl, netværksfejl eller udløbet timeout stopper kørslen. Ingen automatiske retries, parallelle bursts, ekstra konti eller forsøg på at overskride grænser. Serverens `Retry-After` vises ved HTTP-fejl; gentag først efter den angivne pause/kvoten er nulstillet. API-fejl i en HTTP 200-response accepteres ikke som data.

Offlinesvar kan ikke bruges til at kontrollere nuværende konto- eller abonnementsrettigheder. Kaldsbudgettet er pr. kørsel; status/headers håndterer kontoens samlede forbrug. Eksterne samtidige klienter kan også bruge kvoten.

## Definition og sikker overgang til spillet

Spillets definition er uændret: **alle officielle kampe for FCM's herreførstehold**, inklusive liga/lavere divisioner, slutspil, pokal, officielle supercups/regionale turneringer og UEFA-kvalifikation/hovedturneringer. Ingen ungdom, reserver, forgængerklubber, træningskampe eller mål i straffesparkskonkurrencer. Assists følger API-kildens registrering uden manuel slutning.

`observedTotals` er alene summen af returnerede statistikblokke; ukendt felt giver `null`. De er ikke godkendte karrieretal og bruges aldrig direkte af spillet. Turneringstyper skal kontrolleres før brug; råarkivet kan også indeholde turneringer uden for spillets scope. `careerTotals` forbliver `null` i importarkivet.

Før offentlig brug skal både rettigheder og hver udvalgt spillers **samtlige FCM-ophold/turneringer** gennemgås. Kopiér `data/api-football/review.example.json` til `data/api-football/local/review.json`, udfyld det faktiske hold-ID og en fælles skæringsdato, og registrer:

- `rights`: `status: "granted"`, reel aftale-/vilkårsreference og ISO-tid i `confirmedAt`. En API-nøgle er ikke i sig selv en rettighedskontrol.
- `officialCompetitionIds`: de konkret kontrollerede officielle turnerings-ID'er.
- `players`: én post pr. godkendt spiller med `id`, `completeClubHistory: true`, `evidenceReference` til den faktiske kontrol og `observationKeys` med de præcise observationsnøgler fra arkivet.

Skabelonen indeholder bevidst ingen opdigtet godkendelse eller spiller. Alle valgte kildesvar skal være hentet på `statisticsAsOf`-dagen. Ved gammel cache: opdater de relevante sæsoner først. Samme hentedag er en praktisk snapshotafgrænsning, ikke et bevis for at kilden var fuldt opdateret på tidspunktet; undgå import under igangværende kampe.

```sh
npm run data:api:prepare -- --review=data/api-football/local/review.json
# Gennemgå local/candidate.json før dette eksplicitte trin:
npm run data:api:prepare -- --review=data/api-football/local/review.json --publish
npm run data:check
npm run data:ready
npm run build
```

Klargøringen kræver kilde- og dækningskontrol, beregner totalerne fra observationer og validerer output. Ukendte felter bliver fortsat `null`. Kilderegisteret gemmer sæson, turnerings-ID, observationsnøgle og hentetidspunkt; de valgte observationsrækker følger spilleren. `data:ready` fejler fortsat, indtil mindst 150 spillere har verificerede spilbare mål-totaler. Antal importerede navne alene opfylder ikke kravet. Manuel gennemgang er en eksplicit kvalitetsattest, ikke en algoritmisk garanti for sandhed.

Transfersummer importeres ikke automatisk: spillets eksisterende definition er den højeste dokumenterede **faste permanente salgssum fra FCM i EUR**, ikke markedsværdi, lån, bonusser eller senere videresalg. Den forbliver `null`, indtil separat kilde- og definitionskontrol foreligger. Observationer pr. sæson gemmes, men komplet sæsonhistorik/bedste sæson markeres heller ikke automatisk som verificeret. De andre spiltilstande aktiveres ikke af denne opgave.

## Lagring og offentlig visning

De officielle [vilkår](https://www.api-football.com/terms), læst 17. oktober 2026, beskriver anvendelse i apps/websites/spil og forbyder direkte videresalg af data. Der står ikke en tydelig, generel bestemmelse om ubegrænset permanent lagring, rettigheder efter abonnementsophør eller distribution af en komplet downloadbar rådatabase. Tredjepartsrettigheder kan desuden gælde; især billeder/logoer må ikke antages frit anvendelige.

**Derfor er permanent lagring og offentlig JSON-/Capacitor-distribution ikke dokumenteret godkendt for dette projekt endnu.** Bed API-Football afklare: lokal caching/permanent arkiv, offentlig visning af afledte spiltal, hele datasættet i frontendbundle/offline-app, fortsat brug efter abonnement samt eventuelle kreditkrav. Registrer den konkrete gældende rettighedsreference før publicering. Importeren henter ingen billeder/logoer og videresælger ingen data. Ingen leverandør er blevet kontaktet på dine vegne.

## Hvad mangler for 150–200 spillere?

1. Rigtig API-nøgle og live-kørsel: verificer hold-ID, tilladte sæsoner, alle sider, felter og faktisk unikt spillerantal.
2. Afklar rettighederne til den planlagte lokale/offentlige/offline-brug.
3. Sammenhold deltagelse og spillerophold med sæson-/turneringsdækning, især FCM's tidlige historie, lavere divisioner, pokal og UEFA-kvalifikation. Gratisplanens komplette brugbare interval er endnu ukendt.
4. Hvis den faktiske rapport viser mangler: undersøg dybere API-Football-adgang først uden at antage, at betaling løser alle huller. Supplér eventuelt med aftalt eksport fra [SuperStats](https://superstats.dk/om), FCM's eget statistikarkiv eller en [Sportmonks](https://www.sportmonks.com/football-api/)-aftale med konkret verificeret historik. Der er ikke implementeret import fra disse eller hævdet fuld dækning. Nye leverandør-ID'er skal matches manuelt i en identitetskrydsreference, ikke ved navn alene.
5. Manglende klubtal kan ikke løses ved at summere kendte sæsoner og kalde dem hele karrieren. Bevar `null`, eller aftal senere en eksplicit, synligt afgrænset spiltype. Den eksisterende scope ændres ikke stiltiende.

## Kontrol

`npm test` omfatter syntetiske importtests for paginering, dubletter, klubfilter, null/0, genoptagelse, kvoter, offline-cache, hemmeligheder i headers og publiceringskontrol samt eksisterende spiltests. `npm run lint` og `npm run build` kontrollerer projektet. Ingen test er en påstand om live API-adgang.

## Synlig status og tidsgrænser

`npm run data:api:discover` skriver straks en opstartsbesked og derefter konto-/holdopslag, cachebrug, hvert API-kald, kvotepauser og sæsonresultater. Et kald har en samlet timeout på 30 sekunder, inklusive læsning af JSON-svaret. Hele CLI-kørslen stoppes senest efter 10 minutter; allerede gemte cache-svar og spillerfiler bevares. En nødstop-grænse kan efterlade en rapport markeret running, hvis den aktiveres under en ventende operation. Gentag kommandoen for at bruge cache og fortsætte.

Netværksfejl, timeout, HTTP 401/403/429 og API-fejl inde i HTTP 200 har separate forklaringer. Afvist sæsonadgang logges og springes over; afvist nøgle stopper kørslen. Serverens vilkårlige fejltekster udskrives ikke, da de kan indeholde følsomme oplysninger. Nøglen logges ikke.
