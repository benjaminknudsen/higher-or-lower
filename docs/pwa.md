# FCM Games · PWA og iPhone

## Tilføj appen

1. Commit og push ændringerne, og merge dem til `main`. Vent på grøn **Deploy to GitHub Pages** i Actions.
2. Åbn https://benjaminknudsen.github.io/higher-or-lower/ i Safari på iPhone.
3. Vælg Del → Føj til hjemmeskærm. Hvis iOS viser **Åbn som webapp**, skal det være slået til.
4. Start derefter fra det nye ikon på hjemmeskærmen. Den installerede app åbner i standalone; den almindelige Safari-fane beholder browserens navigation.
5. Åbn første gang med netforbindelse og lad appen indlæse færdig. Test derefter i flytilstand. Offline virker først, når service worker har installeret hele cachen.

Der kræves ingen API-nøgle, backend eller App Store-udgivelse. Hvis der allerede ligger et gammelt hjemmeskærmsikon, kan det være nødvendigt at tilføje ikonet på ny for at få de nye ikon-/standalone-indstillinger. Ryd ikke webstedsdata for at opdatere; det kan slette rekorder.

## Implementering

- `vite-plugin-pwa` genererer `manifest.webmanifest`, `sw.js` og Workbox-runtime under `dist`.
- Manifestets id, startadresse og scope er `/higher-or-lower/`; visning er `standalone`.
- HTML indeholder Apple-metatags, et 180×180 touch-ikon og `viewport-fit=cover`. Eksisterende `100dvh` og safe-area-layout er bevaret.
- Ikonerne i `public/icons/` er lokale, uigennemsigtige PNG-filer i 180, 192 og 512 px plus en maskable 512 px-variant. Alle er genereret fra ejerens `public/app-logo.png` med det lilla/lime ulvemotiv. Originalen er bevaret, og maskable-varianten har ekstra mørk margin, så motivet kan beskæres af platformen.
- Appens HTML, JS, CSS, ikoner, grain og alle silhuetter precaches med revisioner. Spillerdata følger med JS-bundlen. Ingen API- eller tredjepartssider caches.
- Hash-navigation forbliver inden for appens scope, så navigation mellem forside og spil ikke kræver en ny Safari-fane.

Manifestets `name` og `short_name`, HTML-titlen, `application-name` og `apple-mobile-web-app-title` er alle **FCM Games**. Higher or Lower er fortsat navnet på spiltypen. Appens identitet (`id`, `scope`, `start_url`), ikoner, cache-ID og localStorage-nøgler er bevaret ved navneskiftet.

## Opdateringer

`src/pwa.js` registrerer service worker. Ny version hentes i baggrunden og venter under `#spil/...`; på forsiden aktiveres den, og siden genindlæses. Der tjekkes også ved tilbagevenden til appen og genetableret netværk, højst én gang pr. minut. Ingen nye timere påvirker spillet. Workbox rydder gamle precache-assets ved aktivering; localStorage og highscore-nøgler ændres ikke.

Hvis en bruger bliver i samme spilvisning, venter opdateringen til næste besøg på forsiden. Hold appen åben med internet et øjeblik for at hente et nyt deploy. Udviklingsserveren installerer ikke en service worker.

## Kontrol og deployment

```sh
npm ci
npm test
npm run lint
npm run build
npm run preview
```

Åbn preview-adressen på `/higher-or-lower/`. `npm run build` kører også `pwa:check`, som validerer det genererede manifest, base-stier, PNG-størrelser, opacitet og nødvendige offline-assets. Det eksisterende deployment-workflow udfører dermed samme kontrol og uploader fortsat hele `dist`, inklusive service worker og ikoner. HTTPS på GitHub Pages understøtter service workers; ingen ændring af Pages-indstillinger er nødvendig.

Lokalt produktionsbuild er browser-testet med manifest, ikoner, service-worker-scope, offline-genindlæsning, svar, næste runde, menu-navigation og highscore bevaret. En reel ny worker blev testet: Den ventede under spil og aktiverede ved retur til menu. Skærme på 320×568, 375×667, 390×844, 430×932 og desktop blev testet med simulerede safe areas; 390×844 har ingen scrolling. 320×568 med 47/34 px safe areas tillader nødvendig lodret scrolling.

Fysisk iPhone-installation og den publicerede PWA skal kontrolleres efter deployment; lokal Chrome-test erstatter ikke Safari på en iPhone. Spil, spillerdata og eksisterende skærmstyles er uændrede.

Referencer: [Vite PWA](https://vite-pwa-org.netlify.app/guide/), [Apple: Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).

## Rettelse af hvid bund og overscroll

Den gamle globale `:root`-baggrund var stadig hvid (`--paper`), mens appens skærme var mørke. `body` og `#root` havde heller ikke deres egen dækkende baggrund. Derfor kunne dokumentets hvide canvas blive synligt under iOS-opstart og rubber-band-effekten. `html`, `body` og `#root` har nu den eksisterende forside-/manifestfarve `#161625`. En lille inline-style maler baggrunden, før ekstern CSS og JavaScript er klar. Gameplayets egen `--game-dark`-farve er bevaret.

Forside, dokumentrod og gameplay bruger nu samme `--app-viewport-height`. Almindelige browserfaner bruger `100dvh` med `100vh` som fallback. I standalone måler `src/viewport.js` den synlige højde før første React-render og synkroniserer ved viewport-resize, `pageshow` og genåbning. To animation frames lader opstart/rotation falde på plads uden at kræve et scroll; der er ingen polling eller scroll-hacks. Pinch-zoom får ikke appen til at skifte størrelse. Svarområdets proportioner beregnes fra samme højde. Safe areas indgår fortsat kun én gang i hver skærms border-box.

Dokumentets scrolling er ikke låst eller skjult. Små skærme må stadig scrolle lodret, når indholdets minimumshøjde kræver det.

Kontrol: 70 tests, lint, build og PWA-check består. WebKit og Chromium er testet ved 320×568, 375×667, 390×844, 430×932 og desktop, både normal visning og simuleret standalone med safe areas. Forside og gameplay er kontrolleret ved første indlæsning, efter navigation og efter viewport-ændringer. Ved 390×844 er der ingen scrolling. Offline-spil, bevaret highscore og en ventende worker, som aktiveres på forsiden, er også testet. WebKit-testen kører på macOS og simulerer standalone/safe areas; fysisk iOS-opstart og iOS' faktiske rubber-band-animation kan ikke bekræftes her.

Efter deployment: Åbn hjemmeskærmsappen med net, gå til forsiden og lad den hente/aktivere opdateringen. Luk og åbn derefter appen fra ikonet. En gammel worker kan vise den tidligere CSS, indtil dette er sket. Ryd ikke webstedsdata, da rekorder ligger i localStorage.

Baggrund: [WebKit om dynamiske viewport-enheder](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/).

Farvematch ved overscroll: Dokumentets canvas følger nu den aktive skærm via `:root:has(.gameplay-app)`. Forsiden bruger fortsat `#161625`; under gameplay bruger `html`, `body` og `#root` præcis gameplayets `--game-dark` (`#121116`). Tidligere blev forsidefarven også brugt bag gameplay, hvilket gav en synlig forskel. Skærmenes egne farver er ikke ændret.
