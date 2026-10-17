# Fælles spillerillustration

`src/components/PlayerIllustration.jsx` bruger én lokal original illustration til alle spillere:

`public/images/player-silhouette.webp` → `/images/player-silhouette.webp` i browseren.

Figuren er anonym og set bagfra. Den forestiller ikke de navngivne spillere. Der bruges ingen spillerfotos, klublogoer eller opdigtede numre. Navnet sættes dynamisk på den øverste ryg med SVG-tekst; lange navne får to linjer og begrænset tekstbredde. De store navne i spillerkortene er fortsat den primære identifikation.

Ved udskiftning lægges en transparent WebP-fil på ovenstående sti. Bevar en centreret figur med format 2:3, hele hovedet og en beskæring ved lårene, så navnene stadig rammer ryggen. Navnefeltet ligger centralt omtrent en tredjedel nede i billedet. Ingen tekst eller numre skal være indbygget i selve billedfilen.

Et valgfrit `localImage` pr. spiller har fortsat prioritet. Kun lokale billedstier accepteres. Hvis et lokalt spillerbillede fejler, bruges den fælles figur. Hvis også den mangler, vises `PlayerSilhouetteFallback.jsx` automatisk. Der ændres ikke på spillernes statistikker eller kvalificering til spillet.

Illustrationens lag har `pointer-events: none`; valg af spiller, bekræftelse, fokus og svarlogik fungerer fortsat gennem hele spillerkortet.

## Originalgrafik

Genereret med den indbyggede imagegen-funktion; ingen billeder hentet fra nettet. Prompt: anonym realistisk fodboldspiller set direkte bagfra fra hoved til lår, naturlig anatomi, sort/rød trøje og sorte shorts, realistiske folder og stoftekstur, diskret kantlys, blank øvre ryg, ingen ansigtstræk, navne, numre, logoer eller sponsorer. Transparent baggrund. Efterfølgende baggrundsfjernelse bevarer figur og lys og fjerner alt uden for kroppens kontur.

## Validering

Den færdige WebP er 1024 × 1536 med transparent alfakanal, cirka 246 KB. Alfakanalen er kontrolleret på baggrundspixels før konvertering, og figuren er visuelt kontrolleret på spillets lyse farveflader. Billedfilen er allerede lagt i projektet; brugeren behøver ikke tilføje den manuelt.

Browserkontrol: 320 × 568, 375 × 667, 390 × 844, 430 × 932 og 1440 × 900. Begge figurer indlæses; navnetryk holder sig inden for rygområdet, touchvalg og bekræftelse fungerer, score og automatisk fortsættelse fungerer, ingen vandret eller lodret overflow under gameplay. Manglende fælles billedfil udløser SVG-fallback i begge felter. Gameplay-layout, spillerfil og spilmotor er uændrede.

## Cinematisk integration

Gameplay-stilen ligger i `src/components/game/CinematicCards.css`. Flere mørke navy/røde baggrundslag danner stadionlys bag figuren; lokal `public/images/card-grain.svg` giver en meget svag, statisk tekstur. Drop-shadows, begrænset farvetoning og en lodret alfamaske integrerer spilleren. Et separat mørkt forgrundslag beskytter tekstkontrast og får den nederste del af figuren til at forsvinde naturligt i baggrunden. Lagene har ingen pointer events. Der bruges ingen rotation til at simulere kropsvinkel.

Den eksisterende figur ses stadig direkte bagfra. En ægte 3/4-vinkel kræver en ny original transparent illustration med samme sort/røde kit, hoved-til-lår-beskæring og lysretning. Den er ikke skabt i denne opdatering. En sådan fil kan senere lægges i `public/images/player-silhouette-3q.webp` og gives til komponentens `silhouetteSrc`-prop. Justér derefter navnetrykkets position til den nye rygvinkel. Standardfilen bruges fortsat nu; manglende filer bryder ikke gameplay.

## Atmosfærisk silhuet i gameplay

Gameplay bruger nu `PlayerIllustration` med `shadow`-prop. Den eksisterende WebP genbruges kun som alfakontur, med `brightness(0)` så alle hudfarver, hår- og trøjedetaljer forsvinder. Der renderes ingen navn- eller nummertekst på figuren. Den fælles figur bruges uanset eventuelle individuelle billeder. Hvis fællesfilen ikke kan indlæses, udelades skyggen diskret i dette visuelle mode; den erstattes ikke af en kantet SVG-person.

`ShadowPlayers.css` gør figuren større og højrestillet inden for kortets mål. En vandret maske på beholderen og en lodret maske på billedet giver en kombineret fade uden behov for mask-composite. Delvis transparens farver skyggen efter det eksisterende lilla/lime-underlag. Et separat gradientlag binder venstre del sammen med baggrunden og bevarer tekstkontrasten; statisk grain tilfører diskret dybde. Alle dekorative lag ignorerer pointer events, og navn/tal ligger over dem. Den eksisterende bagfra-vinkel er bevaret; der simuleres ikke en ny kropsvinkel med rotation.

Browserkontrol ved 320×568, 375×667, 390×844, 430×932 og 1440×900: fælles billeder indlæses, filter fjerner fotografiske detaljer, ingen tekst på silhuetterne, ingen overflow, korrekt svar og fortsættelse virker. Den generelle billedkomponent beholder sin tidligere realistiske visning som standard, men gameplay vælger altid skyggetilstanden.

## Fem tilfældige konturer

Gameplay fordeler fem lokale, originale anonyme silhuetter ved starten af hver session. `src/game/silhouettes.js` blander en pose med alle fem; næste pose blandes på ny. To naboer får aldrig samme silhuet, også ved poseskel. Fordelingen gemmes i sessionens React-state efter spiller-ID, så figuren ikke skifter under afsløring, scoreopdatering eller når udfordreren bliver udgangspunkt. Genstart laver en ny fordeling. Der gemmes ingen visuel variant i spillerdata eller localStorage.

Varianter: tætbygget med kort hår (`stocky-crop`), slank med krøller (`slim-curls`), atletisk med hårknold (`athletic-bun`), bredskuldret og skaldet (`broad-bald`), samt slank med lokker (`lean-locks`). Alle er generiske, ikke forsøg på at afbilde den navngivne spiller. Filerne ligger i `public/images/silhouettes/*.webp` og bruger samme mørke filter, faste placering og fade. Ved manglende variant bruges den tidligere fælles lokale figur som fallback.

Billederne er genereret med indbygget imagegen. Fælles prompt: én anonym realistisk fodboldspillers kontur set direkte bagfra, hoved til midt på lårene, naturlig kropsbygning, afslappede arme og hænder, t-shirt og shorts, mørk silhuet med transparent alfabaggrund. Ingen tekst, numre, logoer, ansigt eller baggrund. Hver variant har en særskilt kropsbygning og frisure som beskrevet ovenfor. PNG-output konverteres til lokale WebP-filer med bevaret alfa.

Valideret: alle fem filer er forskellige, transparente WebP-billeder i 512×768, cirka 35–41 KB pr. fil. Samlet kontaktark er gennemgået visuelt. Browserkontrol ved 320×568, 375×667, 390×844, 430×932 og 1440×900: to forskellige varianter, stabil variant under afsløring, samme variant når spilleren går videre, fortsat svarfunktion og ingen overflow. 62 tests, lint og build består. Midlertidig PNG-kopiering og kontaktark-preview er fjernet fra projektet.
