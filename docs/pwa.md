# PWA og iPhone

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
