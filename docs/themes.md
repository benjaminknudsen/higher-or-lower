# Globale temaer

Neon er standard; FCM vælges med den 44 × 44 px store temaknap i velkomst, menu, profil/leaderboard og begge spils headers. Knappen viser det aktive navn og har tastaturfokus og tilgængelig forklaring.

`src/services/theme.js` styrer validering, HTML-rodens `data-theme`, browserens `theme-color` og den separate localStorage-nøgle `fcm-games:theme:v1`. Eksisterende data og nøgler berøres ikke. Blokeret lagring giver stadig et fungerende temaskift for den aktuelle session. Storage-events synkroniserer andre faner.

En lille synkron initialisering i HTML-head læser temaet før React og CSS. Den mørke FCM-baggrund males også før bundlen, og systemet fungerer med de eksisterende offline-assets. Manifest, app-ID, ikoner, base, service-worker og deployment er uændrede.

`src/themes.css` definerer semantiske farver for baggrund, overflader, primær CTA og CTA-tekst, sekundær accent, tekst, muted tekst, rammer og glød. Eksisterende CSS-værdier har deres oprindelige farve som fallback. Afledte `--tone-*`-tokens binder de tidligere nuancer og alfa-glows til FCM-paletten uden at ændre Neons oprindelige farver. FCM har desuden egne overfladegradients og hvid knaptekst; rød accenttekst er lysere for at sikre læsbarhed på mørke flader.

Grøn/rød svarfeedback, den naturligt grønne fodboldbane, medaljernes metalfarver, guld/sølv på podiet samt billeder og logoer bevarer deres betydning. Prestige-medaljen bruger hverken temaets farvetokens eller temaregler. Reduceret bevægelse respekteres.

Automatiske tests dækker standard/fallback, persistens, adskillelse fra andre brugerdata, blokering af storage, synkron HTML-opstart, kontrast i den primære palette og medaljens uafhængighed. Visuel browserkontrol og fysisk iPhone-kontrol er ikke udført i dette miljø. Kontrollér begge temaer ved 390 × 844 og 320 px, under spil, i hintdialog, med tastatur og efter genåbning af PWA.
