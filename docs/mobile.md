# Mobiloplevelse

Telefoner fra 320 px er udgangspunktet for nye skærme og komponenter.

- Basestyles er mobillayoutet. Udvid med `min-width` ved 600 px (tablet) og 1024 px (desktop).
- Spiltilstande vises i én kolonne på telefon. Tablet og desktop tilføjer flere kolonner med en større, fremhævet Flest mål-udfordring og et varieret layout.
- Links og knapper har mindst 48 × 48 CSS-pixels trykflade. Primære knapper har mindst 56 px højde.
- Brødtekst er 16 px og kortbeskrivelser 15 px på telefoner. Bevar læsbarheden i kommende spillerkort.
- Bevar browserzoom, synlig tastaturfokus, touch-feedback og støtte til reduceret bevægelse. Hover må aldrig være nødvendig for at bruge en funktion.
- Undgå faste indholdsbredder og vandret scrolling. Kontroller både dokumentets bredde og teksternes overflow; skjul ikke layoutfejl med `overflow-x: hidden`.
- `viewport-fit=cover` og CSS-variablerne `safe-area-inset-*` reserverer plads ved skærmudskæringer, systemnavigation og i liggende visning. Bevar dette ved senere Capacitor-integration.
- Capacitor er endnu ikke installeret. Test også på fysiske iOS- og Android-enheder, når appskallen tilføjes.

## Kontrol af den første forside (før spillet blev aktiveret)

Kontrolleret i separat headless Chrome den 17. oktober 2026 ved 320, 375, 390, 768, 1024 og 1440 CSS-pixels:

- Dokumentbredde svarer til viewport ved alle bredder; ingen tekst-overflow i overskrifter eller beskrivelser.
- Alle synlige knapper og links har mindst 48 px bredde og højde.
- Alle fire kortvalg opdaterer valgt spiltilstand og bevarer præcis ét aktivt kort. På telefonbredder blev kortene afprøvet med simulerede touchtryk.
- Startknappen forbliver deaktiveret, mens spiltilstandene kommer snart.
- Skærmbilleder af mobil og desktop er gennemgået visuelt.
- `npm run build` og `npm run lint` består.

Gentag kontrollen ved 320, 375, 390 og desktopbredde efter ændringer i layoutet. Supplér med tablet, liggende visning og forstørret tekst ved nye spilskærme.

## Første spilbare version

Flest mål er nu aktiv med tydeligt markerede testdata. De øvrige tre tilstande kommer snart. Spilskærmen og dens kontrol er dokumenteret i [game.md](game.md). Mobilprincipperne ovenfor gælder fortsat.

## Visuel retning: fodboldquiz og party game

Forsiden og spilskærmene bruger et roligt quizudtryk med hvid baggrund, blå accent og afdæmpede grønne/gule detaljer. Typografien er almindelig sans-serif. Illustrationer og kort er lige, med bløde hjørner og uden håndskrift eller markante knapskygger. Teksterne er korte og venlige.

Illustrationerne er lokale SVG-komponenter uden eksterne billeder eller skrifttjenester. `FootballShirt.jsx` genbruges i forsideillustrationen og spillerkortene. Animationen ved afsløring flytter kun tallet; kortenes og knappernes geometri bevares. Reduceret bevægelse respekteres.

Redesignet er kontrolleret i Chrome ved 320 × 568, 375 × 667, 390 × 844 og 1440 × 1000, inklusive hele spilforløbet, genstart, touch, overflow og afsløring uden layoutskift. Ingen nye spilfunktioner er tilføjet.

## Verificerede spillerdata

Produktionsspillet afventer verificerede tal og viser Afventer data. Demo-spillerne findes kun i automatiske tests. Se [player-data.md](player-data.md) for faktisk indsamlingsstatus og undersøgte alternativer. Tidligere skærmkontroller af aktive spil ovenfor beskriver demoversionen.

## Feedback og stime

Spilrunderne fortsætter automatisk efter en kort, fast læsepause. Feedbackfeltet har fast højde også ved identiske tal. På korte skærme komprimeres gentagne oplysninger; svarknapperne bevarer store trykflader. Rekord og native deling skal desuden afprøves på fysiske telefoner. Se [game.md](game.md) for den isolerede udviklingspreview, som ikke ændrer produktionsdata.

## Lys quizpalette

Farveændringen er visuelt kontrolleret på forside, spilrunder, positiv/negativ feedback og Game Over ved 320, 375, 390 og 1440 px. Ingen vandret scrolling; svarknapperne kan nås uden scrolling ved de afprøvede skærmhøjder 640, 812, 844 og 1000 px. Afsløringen bevarer kortenes og knappernes placering. Spilkontrollen er udført i den isolerede udviklingspreview; produktionsdata er ikke ændret. Build og lint består.

## Enkel lokal spillerfil

Appen bruger nu kun `src/data/players.json` til spiltal. Flest kampe er afprøvet med 42 rigtige spillere ved 320 × 640, 375 × 812, 390 × 844 og 1440 × 1000: rigtigt svar, automatisk fortsættelse, forkert svar, Game Over og genstart. Ingen vandret scrolling eller flyttede svarknapper ved afsløring. Antal spillere bruges dynamisk; puljen er ikke begrænset til den oprindelige størrelse. Det historiske snapshot vises fortsat tydeligt.

## Gameplay som fuldskærmsarena — 2026-10-17

Gameplay bruger nu `100dvh` med safe-area-padding, kompakt tilbage/score/rekord-topbar, to store sammenhængende spillerfelter og et fast svarområde. Spillerne står over hinanden på mobil og side om side fra 700 px. HØJERE/LAVERE har egne farver og trykdybde. Synlig databar, stor spiltypeoverskrift, gentagne klubnavne og instruktioner er fjernet. Statistikgrundlaget findes fortsat i skærmlæsertekst og i datafilen.

Browserkontrol i separat lokal Chrome: 320 × 568, 320 × 640, 375 × 667, 390 × 844, 430 × 932 og 1440 × 900. Kontrolleret med rigtige produktionsspillere: korrekt/forkert svar, låste knapper under afsløring, automatisk fortsættelse, Game Over og genstart. Ingen vandret eller lodret scrolling under runderne; knappernes placering bevares ved afsløring. Længste navn blev også kontrolleret i layoutet. Game Over må scrolle på korte skærme, så alle handlinger fortsat kan nås. Reduceret bevægelse slår animationer fra. Forsidens layout er bevaret.

Alle 150 verificerede spillere og spilmotoren er uændrede. 58 tests, lint og produktionsbuild består. Safe-area-reglerne er implementeret; fysisk iPhone/Android og browserens dynamiske adresselinje bør fortsat afprøves på enheder.

## Integrerede svarzoner — 2026-10-17

Gameplay består nu kun af en kompakt topbar og to spillerflader i lavendel/lime med mørk tekst. Trøjerne har altid sort grundfarve, rød stribe og hvide detaljer, også under feedback. Nederste spillerområde indeholder to native HTML-buttons, som hver dækker halvdelen af hele fladen; indholdet over dem blokerer ikke touch. Der er intet separat svarområde nedenunder. Den øverste spiller er ikke interaktiv.

Touchkontrol ved 320 × 568, 375 × 667, 390 × 844, 430 × 932 og desktop 1440 × 900: tryk væk fra teksten i begge zoner, korrekt/forkert svar, lås mod gentagne svar, afsløring uden ændret geometri, fortsættelse, Game Over og genstart. Kontrolleret lange navne, sorte/røde trøjer, native tastaturaktivering og reduceret bevægelse. Der er ingen scrolling under runderne. Feedback og tal har reserveret plads, også ved den korteste mobilhøjde.

`players.json` og `src/game/engine.js` er uændrede (kontrolleret med SHA-256 før/efter). Alle 150 verificerede spillere bruges fortsat. Safe-area-padding og 100dvh er bevaret; fysisk enhedstest af browserbjælke og skærmudskæringer er stadig relevant.

## Vælg spiller, bekræft svar

Begge spillerfelter er nu valgbare. Spørgsmålet er “Hvem har flest kampe?”. Valg af den kendte spiller svarer til LOWER i spilmotoren; valg af udfordreren svarer til HIGHER. Valget vises med kant og flueben og kan ændres, indtil den separate “Svar”-knap nederst bekræfter det. Svar er deaktiveret uden valg og under afsløring. Et nyt spørgsmål har intet forudvalgt svar. Lige kamptal accepterer fortsat begge valg. Data og spilmotor er uændrede.

## Mobil spilmenu og genanvendelig spillerfigur

Forsiden består af et kompakt navneområde og fire store spilflader. Flest kampe starter direkte på den eksisterende hash-rute; de tre øvrige viser lås og Kommer snart og er native disabled-buttons. 100dvh og safe areas, fire rækker på mobil og 2×2 fra 700 px. Browserkontrol ved 320×568, 375×667, 390×844, 430×932 og 1440×900: ingen overflow, alle fire flader synlige, tre låste spil, start og retur til menu fungerer.

`PlayerIllustration.jsx` er original SVG-grafik med anonym figur set bagfra og sort/rød trøje. Navnet hentes fra spilleren og deles på to linjer ved lange navne; der vises ingen spillernumre. Komponenten accepterer `imageSrc` til et lokalt billede. Den valgfri egenskab `localImage` på en spiller føres videre til komponenten; ingen eksisterende data er ændret. Eksempel efter tilføjelse af et billede med brugsret i `public/players/`: `"localImage": "/players/evander.webp"`. Eksterne URL'er bruges ikke, og loadfejl giver SVG-fallback. Lokal SVG-billedvisning, manglende fil, ekstern URL og navneombrydning er afprøvet i en midlertidig browserpreview, som derefter er fjernet.

## Mørke cinematiske spillerkort

Spillerkortene bruger nu navy/sort, dybe røde baggrundslag, diskret statisk grain og skulderlys. Den eksisterende figur er integreret med bløde skygger, farvetoning, mørkt forgrundslag og alfafade ved bunden. Ingen kropsrotation, ingen nye billeder og ingen ændring af layout eller svarlogik. Styles er isoleret i `CinematicCards.css`.

Browserkontrol ved 320×568, 375×667, 390×844, 430×932 og 1440×900: valg kan skiftes før bekræftelse, flueben vises kun på valgt spiller, score stiger efter korrekt svar, kontroller låses ved afsløring og valg nulstilles i næste runde. Ingen overflow; mobil og desktop er også gennemgået visuelt. Alle 58 tests, lint og build består.

## Overflowrettelse

Safe areas blev talt to gange: `.app` tilføjede top/bund-padding uden på en `100dvh`-høj `.game-shell`, som også havde safe-area-padding. Måling ved 390×844 med 47px top og 34px bund gav før rettelsen en dokumenthøjde på 925px. Den nye `.app.gameplay-app` fjerner wrapperens ekstra padding; gameplay ejer safe areas inden for sin border-box. Forsiden er ikke omfattet.

Illustrationsbeholderne havde `height:108%`, `bottom:-13%` og negativ `right`. Kortene havde dermed intern overflow på begge akser (ved 390px: scrollWidth 378px for et 374px kort og scrollHeight 348px for et 308px kort), selv om de blev klippet lokalt. Beholderne ligger nu inde i kortenes dimensioner. Talområdet var desuden begrænset til 59% samtidig med ikke-krympbare tal; nu har det plads til sit faktiske indhold. Grid-kolonnen har `minmax(0,1fr)` og gameplay har fleksibelt svarområde og dokumenteret minimum til læsbare spillerkort. Ingen global overflow-regel er tilføjet.

Vandret dokumentoverflow kunne ikke reproduceres i denne Chrome før rettelsen ved almindelig 390×844-emulering; den interne overflow blev målt og fjernet. Efter rettelsen er scrollWidth/scrollHeight præcis viewportens dimensioner ved 320×568, 375×667, 390×844 og 430×932, samt desktop 1440×900. Ekstra 390×844-tests med 47/34px top/bund-indryk og 20px sideindryk består også. Alle 150 faktiske navne afprøvet i layoutet; korrekt svar og fortsættelse består. Ved 320×400 tillades lodret scrolling, og Svar kan nås. Forsiden ved 390×844 består fortsat. 58 tests, lint og produktionsbuild består.

## Direkte Højere/Lavere igen

Spillerkortene er nu visning uden valg eller flueben. To separate HØJERE/LAVERE-knapper nederst afgiver svaret direkte; den særskilte Svar-bekræftelse er fjernet. Svar låses fortsat under afsløringen, og fokus flyttes til knapperne ved næste spørgsmål. Den lokale spillerillustration, lilla/lime/mørk palette og overflowrettelse er bevaret. 58 tests, lint og build består.

## 50/50-startskærm

Forsiden er nu et kompakt brandhoved og en 50/50-opdelt hovedflade. `HomeHero.jsx` genbruger den eksisterende lokale spillerillustration uden navn/nummer i et mørkt lilla/rødt lysfelt med fade og diskret tekstur. Kortene ligger i 2×2-grid på mobil og desktop med uændrede farver og låsestatus. Kun Flest kampe starter spillet, via den eksisterende rute. Gameplay og spillerdata er ikke ændret.

Browserkontrol: 320×568, 375×667, 390×844, 430×932 og 1440×900. Ingen vandret eller lodret scrolling; alle fire titler, ikoner og statusfelter er inden for kortene uden overlap. Hero og grid har lige stor højde. Safe-area-test ved 390×844 med 47px top og 34px bund består. Ved 320×400 bruges nødvendig lodret scrolling. Navigation til gameplay og retur til startskærmen er kontrolleret. 58 tests, lint og build består.

## Personlig rekord i startskærmens top

`HomeHero` genbruger `useHighScore(clubId, 'appearances', 0, false)` som læsende rekordvisning. Ingen nye lagringsnøgler og ingen score gemmes fra forsiden. Manglende rekord vises som 0; ved retur fra gameplay læses den nye rekord, og storage-events fra andre faner opdaterer visningen. Undertitlen er fjernet. Overskrift, rekord, trofæ og lavintens lilla lys/grain ligger kun i øverste halvdel. Kortenes styles, placering, farver og låsestatus er ikke ændret.

Browserkontrol ved 320×568, 375×667, 390×844, 430×932, 390×844 med 47/34px safe areas og 1440×900: 0 uden rekord, korrekt svar i gameplay og opdateret rekord ved retur, storage-event-synkronisering og trecifret rekord uden overlap. Ingen scrolling, titler/rekord overlapper ikke hinanden eller spilgridet. 58 tests, lint og build består.

## Tre streger for skjult statistik

Nederste kort bruger `ConcealedStatistic` i stedet for spørgsmålstegn. Tre dekorative CSS-streger bevæger sig forskudt ±2px over 1,8 sekunder med ease-in-out. Skjult statistik har en skærmlæsertekst; tallet er først tilgængeligt ved afsløring. En usynlig CSS-målestreng reserverer en trecifret talplads og baseline. Ved afsløring afmonteres stregerne, og kun tallet fades ind med 4px bevægelse over 240ms. Reduceret bevægelse deaktiverer begge animationer. Ingen ekstra timere eller statistikændringer.

Browserkontrol ved 320×568, 375×667, 390×844, 430×932 og 1440×900: forskudte animationer, korrekt afsløret tal, uændret x/y-position for enheden "kampe", ingen overflow og ingen animation med prefers-reduced-motion. Øverste kort, silhuetter og knapper er bevaret. 62 tests, lint og build består.

## Mere markant korrekt-feedback

Ved korrekt svar vises et kort grønt lyslag og en indvendig ring på udfordrerens kort, et indstemplet flueben og +1, samt et stærkere pop i scoretælleren. Alle effekter ligger uden for layoutflowet, ignorerer pointer events og fjernes automatisk med rundens eksisterende state. Ingen nye timere eller ændringer af point/svarlogik. Reduceret bevægelse giver statisk grøn feedback.

Kontrolleret i browser ved 320×568, 375×667, 390×844, 430×932 og 1440×900: effekt vises kun ved korrekt svar, knapper låses som før, knappernes position ændres ikke, ingen overflow, reduceret bevægelse virker og effekten forsvinder i næste runde. Forkert svar og Game Over fungerer fortsat. 62 tests, lint og build består.

## Feedback stiger med stime

Korrekt-feedback har fire præsentationsniveauer: score 0–4, 5–9, 10–19 og 20+. Rysten, lyspuls, ringradius, partikelbevægelse og score-pop stiger trinvis. Partikelantal er 12/16/20/24, og rysten er begrænset til 6px med højst 0,15 graders rotation. Effekterne afsluttes inden for den eksisterende afsløringspause; timers, point og svarlogik er ikke ændret. Reduceret bevægelse giver fortsat statisk feedback uden ryst eller splash. Niveau og partikelantal beregnes i `src/game/celebration.js`, med tests for grænser og loft ved lange stimer.

### Tydeligere spring ved 10 og 20 point

Niveau 3/4 har nu mærkbart kraftigere kort-ryk (11/16px), kombineret med et kort indadgående zoom for at holde bevægelsen inden for viewporten. Splash udspringer fra kortets midte i stedet for ved højrekanten, hvor en stor del tidligere blev klippet væk. Partiklerne er større, og en kort radial lyseffekt fremhæver de høje niveauer. Reduceret bevægelse skjuler lyseffekt og bevægelse som før. Ingen ændring af pauser, point eller regler.

### Større korrekt-effekt over spilfladen

Korrekte svar udløser nu to ekspanderende chokbølger og et kort kantlys over hele gameplay-fladen. Fra 10 point får begge kort et indadgående kameraryk og et stort, kortvarigt “STÆRKT!”-splash; fra 20 point bliver bølger og lys kraftigere med “USTOPPELIG!”. Overlayet er dekorativt, uden pointer-events og klippet i sin egen beholder, så det ikke skaber scrolling. Effekterne afsluttes inden den eksisterende rundepause og fjernes ved reduceret bevægelse.
