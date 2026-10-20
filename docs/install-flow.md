# Installation og deling

Send dette link:

https://benjaminknudsen.github.io/higher-or-lower/#installer

`InstallPage` er en selvstændig hash-route uden bundnavigation. Det normale opstartsflow og øvrige routes er uændrede; “Spil i browseren” og “Åbn FCM Games” peger på `#forside`. Siden bruger eksisterende logo, ikonkomponent, ThemeToggle og semantiske farvetokens. Ingen nye eksterne billeder eller biblioteker er tilføjet.

## Platforme

`createInstallController` registreres før React starter, så `beforeinstallprompt` kan opsamles også før installationssiden åbnes. Prompten aktiveres kun ved klik og bruges højst én gang. Manglende eller afvist prompt giver ikke en falsk besked om gennemført installation. En manuel guide bruges, når installation ikke tilbydes. `appinstalled` er et faktisk browser-event og kan bekræfte installation i den aktuelle session.

iPhone/iPad får en guide til Safari → Del → Føj til hjemmeskærm → Tilføj → Åbn ikonet. “Åbn som webapp” nævnes, hvis valget vises. Kendte indbyggede app-browsere får ekstra vejledning. Der anvendes aldrig et automatisk iOS-installationsforsøg. Platformgenkendelse vælger kun guidetekst; native prompt afhænger af det faktiske browser-event.

`display-mode: standalone` og iOS' `navigator.standalone` viser “FCM Games er klar!” i stedet for installationsopfordringen. Ændringer i visningstilstand og `pageshow` observeres. En normal browser kan ikke generelt afgøre, om appen allerede findes et andet sted på enheden.

Guiden er en native dialog med luk-knap, Escape, klik på baggrunden, fokusafgrænsning og retur til primærknappen. Den ruller inden for den synlige viewport og tager hensyn til safe areas.

## Deling

`shareInstallLink` deler titel, brugerens ønskede tekst og det faste produktionslink gennem `navigator.share`. Alternativt kopieres kun installationslinket med Clipboard API. Hvis også det fejler, vises et markérbart link. Annullering af systemets delingspanel kopierer ikke noget i baggrunden.

## PWA og data

Manifestet er kontrolleret: FCM Games, `standalone`, scope/start/id under `/higher-or-lower/`, eksisterende ikoner og Apple-metatags. Ingen ændringer i manifest, Vite-base, service worker eller deployment var nødvendige. Den eksisterende precache inkluderer automatisk den nye side som en del af appens JS/CSS. Første indlæsning og offlinecache kræver netværk som hidtil.

Installationsflowet skriver hverken localStorage eller IndexedDB. Det fælles temasystem gemmer fortsat brugerens tema separat. Highscores, fotos, navne og statistik er ikke ændret.

## Kilder og kontrol

- [Apple: Turn a website into an app in Safari on iPhone](https://support.apple.com/en-by/guide/iphone/iphea86e5236/ios)
- [MDN: beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)
- [MDN: Trigger installation from your PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt)

Automatiske tests dækker prompt-capture/forbrug, faktisk installations-event, afvisning/fejl, manuel fallback, standalone og legacy iOS, listener-oprydning, platformstekst, delingspayload, clipboardfallback og annullering. Eksisterende tests for temaer og PWA-assetkontrol består fortsat.

Der er ikke udført fysisk iPhone/Android-installation eller visuel browserkontrol i dette miljø. Efter deployment kontrolleres linket i Safari, en indbygget app-browser og Chrome på Android; afprøv guide, native prompt, deling, standalone-opstart samt begge temaer ved 390 × 844 og mindre bredder.
