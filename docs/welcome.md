# Velkomstskærm

`WelcomeScreen.jsx` og `WelcomeScreen.css` tilføjer appens nye startskærm. Den bruger det eksisterende lokale logo, mørke/lilla flader, original SVG-stadiongrafik og en stor cirkulær limegrøn PLAY-handling. Glow/puls og trykfeedback er CSS-baseret og respekterer reduceret bevægelse. Der er ingen eksterne billeder eller nye dependencies.

## Navigation

- `/higher-or-lower/` uden hash samt `#velkommen` viser velkomstskærmen uden bundnavigation.
- PLAY navigerer til `#forside`, hvor de eksisterende fire spilkort stadig er spilmenuen.
- Menuens nye tilbagepil går til `#velkommen`. Browserens normale tilbage-navigation virker også fra PLAY til velkomsten.
- `#spiltilstande`, `#rekord`, `#profil`, `#leaderboard` og `#spil/appearances` bevarer deres eksisterende funktion. Lukning af rekordvisningen fører til spilmenuen frem for til den nye startskærm.
- PWA-manifestets eksisterende `start_url: /higher-or-lower/` er uændret og peger nu naturligt på velkomsten. Direkte links og en allerede igangværende session tvinges ikke tilbage til start.

`App.jsx` vælger den nye skærm i den eksisterende hash-navigation. `HomeScreen.jsx` tilføjer tilbagepilen, og `Icon.jsx` tilføjer et lille målskiveikon til statistikken. Spilkort, gameplay og de øvrige sider er bevaret.

## Statistik og layout

Personlig rekord kommer direkte fra eksisterende `useHighScore`. Spillede runder og træfsikkerhed kommer fra eksisterende `useLocalAccount`. Ingen historik udledes fra en gammel rekord; manglende data vises som 0. Skærmen skriver ikke statistik og starter ikke en spilrunde, når PLAY vælges.

Layoutet bruger den eksisterende `--app-viewport-height` og safe-area-håndtering. Stadiongrafikken er klippet i sin egen dekorative baggrund; dokumentets scrolling er ikke låst. Alle vigtige elementer passer på de testede iPhone-størrelser. På usædvanligt lave skærme kan den eksisterende naturlige lodrette scrolling fortsat bruges.

## Test

- 81 tests, lint, build og PWA-kontrol består.
- WebKit er afprøvet ved 320×568, 375×667, 390×844, 430×932 og 1440×900 med simuleret standalone og 47/34 px safe areas.
- Velkomst, titel, PLAY og alle tre statistikker er synlige uden scrolling ved alle disse størrelser. Der er ingen vandret scrolling.
- Tom lagring giver 0/0/0 %. En eksisterende rekord og faktisk registrerede svar vises korrekt efter genåbning og navigation tilbage til velkomsten.
- PLAY, menuens tilbagepil, browser-tilbage, spilstart, rekordside, profil og leaderboard fungerer. Bundnavigationen er skjult på velkomst og under gameplay. Reduceret bevægelse er kontrolleret.
- Offline-start af velkomst, PLAY, spil, profil, statistik og demo-rangliste er kontrolleret i Chromium med den eksisterende service worker. Opdateringer aktiveres stadig uden at afbryde gameplay.

Fysisk iPhone-opstart skal stadig kontrolleres efter deployment. PWA-konfiguration, GitHub Actions-workflow, spillerdata, highscore-lagring, medaljeniveauer og spilmotor er ikke ændret. Der er ikke pushet eller deployet fra opgaven.
