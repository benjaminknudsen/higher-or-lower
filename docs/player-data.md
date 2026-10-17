# Én lokal spillerfil — Transfermarkt: Competition Total

Spillet læser `src/data/players.json` direkte. Ingen import, API-kald eller nøgle kræves.

## Definition og status

`appearances` betyder **Transfermarkts registrerede FCM-kampe med “Competition: Total”** for klub-ID 865, samlet over spillerens FCM-ophold. Referencen er https://www.transfermarkt.com/fc-midtjylland/rekordspieler/verein/865 . Turneringsdækningen følger dette filter: brug ikke en enkelt liga, sæson eller en anden udbyders officielle førsteholdstotal som erstatning. Der påstås ikke fuldstændig dækning af alle faktisk spillede officielle kampe.

Det nye scope er `fcm-transfermarkt-competition-total-v1`. **150 spillere er spilbare**, baseret udelukkende på brugerens manuelt indsamlede og kontrollerede liste fra Transfermarkt, modtaget 2026-10-17. Navne og tal er aflæst fra listen; der er ikke hentet yderligere oplysninger online. `verified: true` dokumenterer her brugerens kontrol, ikke en selvstændig onlinekontrol fra udviklingsagenten.

31 eksisterende poster er opdateret, og 119 nye er tilføjet. Alle 150 bruger samme kildelink, `lastChecked: "2026-10-17"`, scope og en kontrolnote med placering og kolonnen Apps. Mads Thychosen og Jens Cajuste genbruger ID'erne fra Mads Døhr Thychosen og Jens-Lys Cajuste; de tidligere navne er bevaret som aliases.

Der er i alt 161 poster i filen: 150 aktive og 11 historiske poster, som ikke indgår i den indsendte liste. De 11 bevarer deres tal og kilder, men har `verified: false` og udelades fra spillet. For opdaterede poster gemmer `previousVerification` også det gamle navn, kamptal, kilde, kontroldato og note. `previousDefinition` bevarer den oprindelige definition.

`asOf: null` betyder, at ingen fælles statistikdato ud over brugerens kontroldato er fastlagt. Den tidligere dato 2026-04-04 gælder kun den gamle opgørelse. Der er ikke gættet nye tal for de 11 afventende spillere.

## Manuel kontrol og opdatering

1. Brug kun tilladte opslag eller materiale, som må anvendes. Kontrollér spillerens identitet, klub-ID 865, alle relevante FCM-ophold og filteret **Competition: Total**. En søgesnippet, klubartikel eller profil med en anden afgrænsning er ikke tilstrækkelig dokumentation for samme tal.
2. Ret `appearances` til det faktisk kontrollerede heltal og `source` til den konkrete dokumenterende side. Ved supplerende materiale angives desuden `transfermarktReference` med den relevante Transfermarkt-side for FCM (URL med `/verein/865`). Kildelinks må ikke indeholde adgangsnøgler.
3. Sæt `scopeId` på posten til `fcm-transfermarkt-competition-total-v1`, `lastChecked` til kontroldatoen (`YYYY-MM-DD`) og skriv `verificationNote`: hvad blev kontrolleret, hvilket filter, eventuel statistikdato og afgrænsning. Bevar gerne den historiske `previousVerification`.
4. Først derefter sættes `verified: true` og `verificationStatus: "verified-transfermarkt-total"`. Statusfeltet er en læsehjælp; spillets kontrol kræver det eksplicitte scope, flag, gyldig kilde/reference, dato og kontrolnote.
5. Ved senere månedlig kontrol ret tal, kilde, dato og kontrolnote. Opdater kun filens `asOf`, hvis hele den aktive pulje faktisk har samme statistikdato; ellers behold `null`. Er tallet usikkert, brug `verified: false` og eventuelt `appearances: null`.

Tilføj nye spillere i samme `players`-liste med entydigt ID, navn og ovenstående felter. Start med `appearances: null`, `verified: false` og `lastChecked: null`, indtil kontrollen er udført. Kopiér ikke en anden spillers tal. Der er ingen ekstra registreringsfil, som skal opdateres.

Et dokumenteret nul accepteres; manglende oplysninger bliver aldrig til nul. Ufuldstændige poster og modstridende dubletter ignoreres. Den lokale kontrol kan kontrollere format og eksplicit attest, men kan ikke bevise tallets sandhed eller læse kilden for dig.

## Kontrolkommandoer

- `npm run data:check`: struktur og antal aktive/afventende poster.
- `npm run data:playable`: kræver mindst to verificerede spillere; består med den aktuelle pulje.
- `npm run data:ready`: kræver mindst 150; består med den aktuelle pulje.
- `npm test` og `npm run build`: tester logik og bygger appen, også når data afventer.

## Adgang og udvidelse

Denne opdatering bruger udelukkende brugerens indsendte liste. Der er ikke foretaget scraping, hentet nye statistikker eller tilføjet importscripts. Den tidligere adgangsfejl fra Transfermarkt er ikke forsøgt omgået.

Ved senere udvidelse skal oplysninger fortsat kunne indsamles og anvendes på tilladt vis. Målet på mindst 150 er opfyldt; yderligere udvidelse mod 200 kræver nye kontrollerede oplysninger under samme filter.
