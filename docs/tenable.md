# FCM Tenable

Åbn via forsiden eller `#spil/tenable`. Alle udfordringer vises på én scrollbar side under LET, MELLEM og SVÆR. Tryk direkte på en udfordring for at spille; der er intet sværhedsgradsvalg eller filter. Nedtællingen begynder først ved valg af udfordring. Ingen statistik, medaljer, leaderboard, Supabase eller lagring er tilkoblet.

## Indhold

`src/data/tenable/practiceChallenges.js` indeholder ni redaktionelle øvelseslister om fodbold, tre pr. sværhedsgrad. Placeringerne er redaktionelle, ikke historiske ranglister. `productionChallenges.js` er klar til verificerede statistikudfordringer. `testChallenges.js` bruges kun af automatiserede tests og indlæses ikke i spillet.

Hver udfordring indeholder:

- `id`: unik streng
- `title`, `description`: dansk titel og præcis afgrænsning
- `difficulty`: `easy`, `medium` eller `hard`
- `type`: `top10` (rangordnet) eller `latest10` (nyeste først)
- `answers`: præcis 10 objekter med `label` og valgfri `aliases` (strenge). Arrayets rækkefølge er placering 1–10.
- `durationSeconds`: valgfrit, standard 300 (5 minutter)
- `isTest`: true for testdata; medtag også TEST i titel, beskrivelse og kilde
- `source`: kildeoplysninger, gerne URL og dato for verificering

Svar matches kun på fuldt navn eller eksplicit angivne varianter efter Unicode-normalisering, små bogstaver og sammenfoldning af mellemrum. Tilføj almindelige stavevarianter, diakritikvarianter og forkortelser som eksplicitte aliases. Ingen delstrengsmatch eller automatisk accept af efternavne. Validatoren afviser tvetydige aliases mellem svar.

Timeren bruger et absolut sluttidspunkt og kontrolleres også ved indsendelse og når fanen bliver synlig. Mobil bruger et sticky svarfelt, 16px inputtekst og ingen automatisk åbning af tastatur ved start. Alle ti svar står i én lodret liste, som kan scrolles. Mistede liv og tidsudløb afslører hele listen; genstart nulstiller alt.
