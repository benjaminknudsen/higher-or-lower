> HISTORIK: Importværktøjerne er fjernet. Brug den simple spillerfil og [den aktuelle vejledning](player-data.md). Kommandoer og status nedenfor beskriver en tidligere løsning.

> Tidligere importarbejdsgang. Den aktuelle Flest kampe-pulje, dens kilder og begrænsninger er dokumenteret i [appearances-data.md](appearances-data.md). Der udvikles ikke videre på importværktøjet nu.

# Transfermarkt som primær reference

## Faktisk status

Transfermarkt er igen valgt som primær reference. **0 importerede spillere, 0 verificerede spiltal; spillet er ikke aktiveret.** API-Football er ikke længere standardløsningen. API-nøglen, lokale cachefiler og eventuelle tidligere arkiver er ikke slettet eller anvendt ved dette skift. Der er ikke indsat demo-data i produktionsdatabasen.

## Undersøgelsen den 17. oktober 2026

Den officielle [FCM-topscorerside](https://www.transfermarkt.com/fc-midtjylland/toptorschuetzen/verein/865) findes i søgeindekset. Tabellen har klubkampe og mål, men søgeuddraget beviser ikke komplet turneringsdækning, skæringsdato eller spillerprofilernes overensstemmelse. Indeksets tal er derfor ikke importeret. Direkte klub-/vilkårsopslag gav værktøjsfejl; ingen direkte hentning eller fuld kontrol af spillersider er gennemført.

De officielle [vilkår §11.1](https://www.transfermarkt.com/intern/anb) forbyder adgang og kopiering via bots, scraping og andre automatiske processer. En lille pulje er ikke en dokumenteret undtagelse fra den begrænsning. Vi omgår hverken adgangsfejl eller vilkår med alternative domæner, browserautomatisering, proxies eller søgecache. Ingen nye spilleropslag eller kopiering blev fortsat efter kontrollen af vilkårene.

Dette er en beskrivelse af den konkrete adgangsbegrænsning, ikke en generel juridisk konklusion om manuel brug af enkeltstående faktuelle oplysninger. Et relevant grundlag for den konkrete indsamling, lagring og brug i spillet skal dokumenteres. Det kan være en tilladt eksport eller data kontrolleret manuelt med dokumenteret brugsgrundlag. Der er ikke registreret en sådan tilladelse/kontrol nu.

## Ens statistik for alle

`fcm-men-first-team-all-official-v1` er uændret:

- FCM's herreførstehold, alle officielle nationale ligaer inklusive lavere divisioner, slutspil, pokal og eventuelle officielle supercup-/regionale turneringer.
- UEFA-turneringer inklusive kvalifikation.
- Ingen træningskampe, ungdom, reserver eller forgængerklubbers kampe. Mål i straffesparkskonkurrencer er ikke spillermål.
- Kampe betyder faktisk deltagelse, ikke blot udtagelse. Mål skal være tilskrevet spilleren for FCM.
- Alle FCM-ophold og relevante turneringer skal være dækket, før et klubtotal kan kaldes verificeret. Et samlet Transfermarkt-tal er ikke alene bevis for komplet tidlig klubhistorik.
- Ukendte/ukontrollerede kampe, mål og assists er `null`; de konverteres ikke til 0. Assists følger den dokumenterede kilderegistrering.

Hvis kun Superligaen kan kontrolleres, skal en ny, tydeligt navngivet spildefinition og UI-mærkning aftales/implementeres; tallene må ikke sættes ind under den nuværende definition.

## Den første pulje

Spillet kan teknisk aktiveres med **2** spillere med verificerede mål. 8–12 er et mere brugbart første datasæt, men ingen tal eller identiteter udfyldes for at opfylde et antal. Kravet på 150 spillere er et separat udvidelsesmål, ikke en lås på den første pulje.

For hver konkret spiller skal en manuel gennemgang eller tilladt eksport dokumentere:

1. Transfermarkt-ID, korrekt navn, profil-URL og FCM-tilknytning.
2. Klubafgrænset mål-/kampstatistik og dens præcise kilde-URL. Karriere- eller Superliga-totaler må ikke forveksles med alle officielle FCM-turneringer.
3. Alle klubophold/turneringer og eventuelle huller. Ved uafklaret dækning forbliver værdien `null`.
4. Kildens faktiske hentedato, fælles statistikskæringsdato, kontrollens tidspunkt og evidensreference. Kildens opdateringstid må ikke opfindes ud fra adgangsdatoen.
5. Dokumenteret grundlag for databrugen, også offentlig lokal JSON og eventuel offline-app.

## Lokalt datasæt og import

Opret et samlet datasæt i `data/transfermarkt/local/players.json` (mappen er Git-ignoreret). Brug strukturen i `src/data/players.json` og de eksisterende skabeloner i `data/templates/`. Skabelonerne har bevidst `null` og ingen opdigtede spillere eller godkendelser.

- `primarySource`: `transfermarkt`.
- `collection.status`: `partial` for første pulje; bevar målet på mindst 150.
- `collection.statisticsAsOf`: fælles skæringsdato, som de faktiske kilder understøtter.
- `collection.lastImportedAt`: faktisk klargøringstidspunkt, ikke en konstrueret tidligere hentning.
- `rights`: konkret reference og kontroltidspunkt; `granted` må ikke sættes uden grundlag.
- `sources`: separate kildeposter efter behov, med præcis URL, type, adgangstid og evidensreference. `verificationMethod` skal være `direct-authorized-review` eller `licensed-export`. Søgecache/scraping accepteres ikke som verifikation.
- Spiller-ID: `tm:<Transfermarkt-ID>`. Hvert verificeret statistikfelt har egne `sourceIds`, `verifiedAt`, `asOf` og `coverage: complete`.
- Ukendte felter forbliver `null` med status `unverified` og en begrundelse. Overfør ikke irrelevante personoplysninger eller billeder.

```sh
# Hjælp; ingen netværkskald og ingen læsning af API-nøgle:
npm run data:discover

# Valider lokalt input og lav en kandidat uden at ændre spillets data:
npm run data:import -- --input=data/transfermarkt/local/players.json

# Når den konkrete, verificerede pulje foreligger:
npm run data:import -- --input=data/transfermarkt/local/players.json --publish
npm run data:playable
npm run build
```

`--publish` afvises, hvis færre end 2 spillere har verificerede mål, eller data-/kildekontrollen fejler. Efter en vellykket import læser appen som før lokal JSON og viser Flest mål som tilgængelig. Valg af kortet starter spillet; mekanik og design er uændret.

Importen er et samlet snapshot, ikke en automatisk sammenfletning. Ved udvidelse skal tidligere spillere medtages; en import, der fjerner eksisterende spillere, afvises. Ved ny skæringsdato skal alle offentliggjorte verificerede felter fortsat understøtte den fælles dato. Validering kontrollerer struktur og dokumentation, ikke sandheden af den menneskelige attest.

```sh
# Første lille spilbare pulje:
npm run data:playable
# Det langsigtede mål på mindst 150 verificerede mål-totaler:
npm run data:ready
```

## Den tidligere API-løsning

Koden er bevaret, men kun eksplicitte `data:api:discover`, `data:api:import` og `data:api:prepare` bruger API-Football. De generelle `data:discover`, `data:import` og `data:prepare` foretager ingen API-kald. `.env` forbliver ignoreret og læses ikke af Transfermarkt-importen. Dokumentationen for den tidligere løsning findes i `docs/api-football-data.md`.

## Hvad mangler?

En faktisk lille spillerpulje med kontrollerede kilder og brugsgrundlag. Jeg kan ikke indsamle den automatisk under de offentliggjorte vilkår, og søgeuddrag alene opfylder ikke verifikationen. Derefter kan samme lokale struktur udvides mod 150 spillere; komplet historisk dækning skal eftervises for hver spiller, også når kluboversigten viser et samlet tal. Ingen leverandør er kontaktet på brugerens vegne.
