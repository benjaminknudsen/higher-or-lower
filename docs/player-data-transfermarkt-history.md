> HISTORIK: Importværktøjerne er fjernet. Brug den simple spillerfil og [den aktuelle vejledning](player-data.md). Kommandoer og status nedenfor beskriver en tidligere løsning.

> Historisk dokument fra før valget af API-Football. Følg [den aktuelle importvejledning](player-data.md). Status og anbefalinger nedenfor beskriver den tidligere undersøgelse.

# Spillerdata: definitioner, status og import

## Faktisk status den 17. oktober 2026

**0 importerede spillere. 0 verificerede spiltal. Målet på mindst 150 spillere er ikke opnået.**

`src/data/players.json` er en tom produktionsdatabase med indsamlingsstatus `blocked`. `lastImportedAt` og `statisticsAsOf` er `null`, fordi ingen spillerdata er hentet. Tiden i `accessCheckedAt` dokumenterer kun adgangskontrollen, ikke hentning af statistik. Der er ikke oprettet 150 tomme/skønsmæssige poster for at ligne en færdig database.

Transfermarkts officielle [vilkår, §11.1](https://www.transfermarkt.co.uk/intern/anb) forbyder automatiseret adgang og kopiering. Direkte læsning af `.com`-klubprofilen og vilkårssiden returnerede HTTP 403 i webværktøjet. De officielle vilkår blev læst via søgeresultatet; det er dokumenteret som indekslæsning, ikke som en vellykket direkte hentning. [robots.txt](https://www.transfermarkt.com/robots.txt) giver en generel Allow-regel, men giver ikke brugsrettigheder og ophæver ikke vilkårene. Adgangskontrollen findes i `data/access-review.json`. Ingen proxies, CAPTCHA-omgåelse eller alternative domæner blev brugt til spillerindsamling.

Brugeren har efterfølgende bedt om undersøgelse af alternative kilder. Resultatet og de åbne spørgsmål findes i `data/source-research.json`; ingen leverandør er kontaktet, ingen konto er oprettet, og intet abonnement er købt.

## Alternative kilder

| Kilde | Vurdering | Hvad mangler? |
| --- | --- | --- |
| [SuperStats](https://superstats.dk/om) | Stærk kandidat til dansk historik. De oplyser, at større datasæt/systematisk brug kræver aftale, og at eksport kan være mulig. | Aftale og eksport; bekræft dækning pr. turnering/sæson, assists og brug i web- og mobilspil. |
| [Sportmonks](https://www.sportmonks.com/football-api/) | Dokumenteret API. Gratisplanen beskriver Superliga-adgang. [Historiske sæsoner](https://www.sportmonks.com/glossary/seasons/) afhænger af adgang/tilkøb; fuld FCM-dækning er ikke verificeret. | Brugerejet konto/API-nøgle; kontrol af alle nødvendige sæsoner og turneringer. [Databrug](https://www.sportmonks.com/integrity-support/) skelner mellem eget produkt og videredistribution af rådata; afklar især en JSON-database i en statisk frontend/Capacitor-app. |
| [API-Football](https://www.api-football.com/coverage) | Dækningslisten omfatter Superligaen og DBU Pokalen. | API-adgang, rettigheder samt konkret historik og feltkomplethed skal verificeres. |
| [Wikidata](https://www.wikidata.org/wiki/Wikidata:Copyright) | Strukturerede data er CC0 og kan understøtte identiteter og kildelinks. | Navne/klubtilknytning beviser ikke komplette FCM-tal. Ingen statistisk dækning er godkendt her. |
| [FCM](https://www.fcm.dk/) | Officielle artikler er relevante til stikprøver og kontrol af enkeltoplysninger. | En komplet, genanvendelig statistisk eksport er ikke dokumenteret. |
| [Wikipedias spillerliste](https://en.wikipedia.org/wiki/List_of_FC_Midtjylland_players) | Ikke valgt som statistikgrundlag: siden advarer om uklare kilder og angiver en gammel skæringsdato. | Kan ikke bruges som facit for komplette aktuelle klubtal. |

Min anbefaling er SuperStats til tidlig dansk historik, alternativt en Sportmonks-konto til en afgrænset kontrol af datadækning. Ingen af disse muligheder udgør en allerede indhentet tilladelse eller verificerede spillerdata. Et konkret, usendt udkast til dataforespørgsel findes i `docs/data-request-draft.md`.

## Ensartet statistikgrundlag

Foreløbig definition: `fcm-men-first-team-all-official-v1`.

- Kun FC Midtjyllands herresenior-førstehold fra klubbens egen historie. Ikke Herning Fremad/Ikast FS før FCM.
- Alle officielle nationale ligakampe, inklusive lavere divisioner, samt officielle slutspil/playoffs.
- Landspokal og eventuelle officielle supercups.
- UEFA-turneringer inklusive kvalifikationskampe.
- Officielle regionale klubturneringer, eksempelvis Royal League, når deltagelse og dækning er dokumenteret.
- Ingen træningskampe, ungdom eller reserver. Mål i straffesparkskonkurrencer tæller ikke som spillermål.
- Kampe er faktisk deltagelse, ikke udtagelse eller plads på bænken.
- Mål er mål tilskrevet spilleren; selvmål til modstanderens fordel er ikke mål for spilleren.
- Assists følger kildens registrering. Ukomplet historisk assistdækning giver `null`, aldrig 0 eller et skøn. Ingen slutning fra kampreferater eller antal mål.

En totalsum er kun verificeret, når alle relevante turneringer og spillerens samtlige FCM-ophold er dækket. Hvis en kilde kun dækker Superligaen, oprettes en særskilt definition med tydelig mærkning i UI og data. Dens tal må ikke importeres under ovenstående definition. Ingen alternativ scope er aktiveret nu.

Alle tal i et sammenligningsdatasæt har samme dokumenterede `statisticsAsOf`. `accessedAt` angiver hvornår kilden blev læst/eksporteret; `verifiedAt` angiver den senere kontrol. En gammel artikel bliver ikke automatisk aktuel, fordi den læses i dag.

## Transfersum

`highest-fixed-permanent-fcm-sale-eur-v1` betyder **højeste dokumenterede faste transfersum i EUR ved et permanent salg fra FCM**. Det er ikke spillerens dyreste transfer andre steder i karrieren og ikke hans markedsværdi. Definitionen følger spillets oprindelige idé om, hvem FCM solgte dyrest.

Lejegebyrer, videresalgsklausuler, markedsværdier og ubekræftede bonusser udelades. Ukendt eller ikke-offentliggjort beløb giver `null`. Nul kræver eksplicit dokumentation for fri transfer og fuldstændig kendt FCM-salgshistorik. Et kendt enkelt salg er ikke nødvendigvis spillerens højeste salg, hvis andre FCM-afgange er ukendte. Valutaomregning foretages ikke uden separat dokumenteret metode.

## Model og kildebevis

Den aktuelle adapter er for den oprindeligt ønskede Transfermarkt-eksport. En valgt alternativ leverandør skal have sin egen dokumenterede ID-/kildeadapter og rettighedsvurdering; der er bevidst ingen generisk "godkend enhver URL"-funktion.

- `id`: stabilt `tm:<spiller-id>` for Transfermarkt-poster. En genkomst til FCM er samme spiller, ikke en ekstra post.
- `name`, `transfermarktId`, `profileUrl`: eksplicitte stamdata. Ukendt profillink er `null`; et kendt link skal matche ID'et.
- `membership`: separat kontrol af FCM-tilknytning, kildereferencer og tidspunkt.
- `stats`: `appearances`, `goals`, `assists`, `transferFee` som statistikobjekter, aldrig løse blandede tal.
- Hvert statistikobjekt indeholder `value`, `status`, `scopeId`, `coverage`, `asOf`, `sourceIds`, `verifiedAt` og `missingReason`.
- Manglende eller ikke-verificeret værdi: `value: null`, `status: unverified`, konkret `missingReason`. Verificeret nul er derimod et eksplicit tal med kildebevis.
- Transfers indeholder også `currency`, `transferDate`, `toClub` og `isExplicitFreeTransfer`.
- `seasons`: én post pr. `YYYY/YY`, med kampe, mål og assists på samme turneringsgrundlag.
- `seasonCoverage`: komplet/partiel/ukendt sæsonhistorik. Bedste sæson beregnes som maksimum af mål + assists, kun når alle FCM-sæsoner er dækket og begge tal verificeret. Et kendt godt år er ikke nødvendigvis spillerens bedste.
- `sources`: registry af ID → URL, leverandør, kildetype, FCM-scope, `accessedAt`, kontrolmetode og lokal reference til godkendt kildebevis/eksport. Søgecache kan ikke bruges som verificeringsmetode.
- `rights`: tilladelsesstatus, reference til den konkrete brugsret og tidspunkt. Et link eller en boolean er ikke i sig selv en juridisk vurdering.

Skabeloner til spiller, sæson og kilde findes i `data/templates/`. De er ufuldstændige, ikke rigtige spillere og kan ikke importeres uændret.

## Validering og spil

`src/data/quality.js` kontrollerer struktur, null-regler, dubletter, ID'er, kilder, tidsstempler, rettighedsreference, skæringsdatoer, dækning og statistikdefinitioner. Den henter ingen webside og kan ikke bevise rigtigheden af en manuel indtastning eller gyldigheden af en aftale. Den menneskelige kildekontrol er stadig nødvendig.

Spiladapteren afviser ugyldige databaser og inkluderer kun spillere med verificeret tilknytning og en verificeret værdi til den valgte spiltype. `null` kastes aldrig til nul. Med færre end to kvalificerede spillere er startknappen deaktiveret, og et direkte spillink viser en forklaring. Design og spillogik er bevaret.

De ti gamle fiktive spillere ligger nu i `src/data/fixtures/players.test.json` og bruges kun af automatiske tests og en separat, tydeligt mærket udviklingspreview. De tæller hverken mod 150-målet eller indgår i produktionsspillet.

Kommandoer:

- `npm run data:check`: validerer filen og rapporterer faktiske antal pr. statistik. En gyldig tom fil må gerne bestå strukturtjekket.
- `npm run data:ready`: kræver mindst 150 kvalificerede mål-spillere. Den fejler med vilje nu; databasen er ikke klar.
- `npm test`: eksisterende spiltests plus kontrol af datakvalitet.
- `npm run build`: inkluderer strukturtjek; et build kan lykkes med en tydeligt utilgængelig spiltilstand.

Når en godkendt eksport foreligger: registrér rettigheder og kildebevis, kontrollér dækningen, importér og deduplikér efter dokumenterede identiteter, udfyld kun verificerede felter, kør validering og mindst 150-kontrollen. Kontrollér særskilt tidlige, mindre kendte og nuværende spillere og lav spotkontrol på tværs af sæsoner. Hent ikke selv Transfermarkt-data uden den nødvendige tilladelse.
