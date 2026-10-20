# Lokalt profilbillede

Profilkortet viser avatar og navn med én knap, **Rediger profil**. Knappen åbner en native dialog med navnefelt, gem/annullér samt `ProfilePhotoPicker`. I dialogen åbner **Skift profilbillede** en almindelig `input type="file" accept="image/*"` direkte fra brugerens klik. **Fjern profilbillede** vises kun med et gemt billede. Kamera-, navne- og fjernknapper vises ikke separat på selve profilkortet. Der bruges ikke `capture`, så iPhone selv tilbyder de tilgængelige billedkilder. Annullering ændrer intet. Filinput nulstilles efter valg, så samme fil kan vælges igen.

`optimizeProfilePhoto` validerer maks. 25 MB, lader browserens billeddecoder åbne filen, begrænser til 80 megapixel og nedskalerer proportionalt til højst 512 pixels på hver led uden opskalering. Canvas komprimerer til WebP med JPEG-fallback. Hvis browseren ikke kan afkode HEIC/HEIF, vises en besked om at prøve JPEG eller PNG. Ingen ekstra formatbiblioteker eller netværkskald bruges. Den faktiske HEIC-understøttelse afhænger af browser/enhed.

`createProfilePhotoRepository` i `src/services/profilePhoto.js` har `load()`, `save(blob)` og `remove()`. IndexedDB-databasen hedder `fcm-games-profile-photo`, object store `photos`, og den eneste nøgle er `self`. Udskiftning sker med `put`, og sletning bruger `delete`. Skrivninger afventes til transaktionen er afsluttet. En fremtidig Supabase Storage-adapter kan erstatte dette interface.

`useProfilePhoto` deler billedets tilstand mellem alle egne avatarer i samme appvisning. Et optimeret billede vises straks, mens det gemmes; ved lagringsfejl gendannes den tidligere avatar. Lokale data læses igen ved en ny appindlæsning. Andre spilleres avatarer bruger fortsat standardikonet. Ingen eksisterende localStorage-nøgler eller profildata røres.

Billeder bruger Blob URLs, der tilbagekaldes ved udskiftning og unmount. Decoderingens midlertidige URL tilbagekaldes også ved fejl. Avatarområdet har faste dimensioner, rund beskæring og `object-fit: cover`.

Automatiske tests verificerer lagringsadapterens transaktioner med en test-double, udskiftning på én nøgle, genåbning, sletning, fejl ved utilgængelig/fuld lagring, billedstørrelser, filvalidering, komprimeringsfallback og oprydning af input-URLs. Browserens faktiske IndexedDB, billedvælger og HEIC-decoder skal desuden kontrolleres på en fysisk iPhone og i desktopbrowser. Browserforbindelsen i dette arbejdsmiljø har ikke været tilgængelig.

Manuel kontrol: vælg et portræt, skift til leaderboardets egen avatar, genindlæs, udskift billedet, annullér et valg, fjern billedet, og bekræft at navn og rekorder bevares. Gentag offline efter første onlineindlæsning og i installeret iPhone-PWA.

Profilkortets 80 px-avatar har en diskret temafarvet ring. `ProfileCard.css` bruger de semantiske farvetokens for Neon og FCM. Native dialog sørger for fokusafgrænsning; luk-knap, Escape og klik på baggrunden lukker panelet og returnerer fokus til redigeringsknappen. Ugemte navneændringer kasseres ved lukning. Billedvalg og sletning gemmes med det samme via den eksisterende foto-adapter. Medalje og statistik er ikke ændret.
