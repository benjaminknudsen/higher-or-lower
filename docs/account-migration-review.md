# Review: første kontomigration

Fil: `supabase/migrations/202610200001_account_foundation.sql`.
Status: gennemgået og rettet som **førstegangsinstallation på standard Supabase**.
Ingen SQL, migrations eller databaseændringer er udført under reviewet. Det er en
kode-/dokumentationsgennemgang, ikke en garanti baseret på et kørt databaseforsøg.

## Kontroller og rettelser

| Punkt | Resultat |
| --- | --- |
| Auth-trigger | AFTER INSERT på `auth.users`. Opretter profil fra Auth-genereret `NEW.id` og valideret username; læser ikke e-mail/password. Spring anonyme Auth-brugere over. Signup og profilinsert er samme transaktion. |
| Ejerskab | Tabel og begge funktioner ejes eksplicit af `postgres`. Triggeret kører SECURITY DEFINER, så Auth-rollen ikke skal have INSERT-adgang til den offentlige tabel eller omgå RLS på egen hånd. |
| search_path | Begge funktioner har tom search_path. Tabeller, JSON-funktioner, lower/btrim/now er skemakvalificerede. Ingen dynamisk SQL eller caller-styrede objektnavne. |
| EXECUTE | Default PUBLIC/anon/authenticated-adgang fjernes fra begge triggerfunktioner. Kun den interne `supabase_auth_admin` får eksplicit EXECUTE på signup-triggerfunktionen. Browseren får ingen forhøjede rettigheder. |
| Samtidighed | ASCII-validering + lowercase før INSERT og en rigtig UNIQUE-constraint på canonical username. To samtidige registreringer kan ikke få samme navn: en taber med constraintfejl og rollback. Ingen `ON CONFLICT DO NOTHING` eller opslugt fejl, som kunne efterlade profilfri Auth-brugere. |
| RLS/kolonner | Offentlig SELECT. UPDATE kræver eget `auth.uid()` i både USING og WITH CHECK og afviser anonymous-claim. Browserens UPDATE-grant omfatter kun username/avatar_path. ID og timestamps kan ikke sættes; updated_at håndhæves af triggeret. Ingen browser INSERT/DELETE. |
| Senere username-opdatering | CHECK-reglen gælder alle inserts og updates, ikke kun signup. Kun canonical lowercase ASCII på 3–24 tegn accepteres; uppercase, Unicode, mellemrum, @ og andre tegn afvises. Den samme UNIQUE gælder ændringer. Fremtidig React normaliserer gennem `canonicalUsername`. |
| Eksisterende Auth-brugere | Ingen UPDATE/DELETE/backfill af `auth.users` eller eksisterende konti. Login, password-reset og e-mailopdatering aktiverer ikke INSERT-triggeret. Eksisterende konti mangler fortsat profil og kræver senere reviewet backfill, før de kan bruge onlineprofilen. |
| SQL Editor | Kør hele filen som `postgres`. En ny preflight afviser forkert rolle, manglende Supabase Auth og navnekonflikter før CREATE. BEGIN/COMMIT holder ændringer atomiske. Ingen udskiftning af eksisterende funktioner/tabeller/triggere, ingen destruktive DROP eller IF NOT EXISTS, der skjuler afvigende skema. |

### Nye brugere, invitationer og fremtidige providers

Triggeret gælder **alle nye ikke-anonyme Auth-brugere**, ikke kun React-signup.
En dashboard-oprettet/inviteret bruger uden et gyldigt metadata-username vil få en
fejl. Dette er et bevidst kontraktkrav for e-mail/password-produktet, ikke en effekt
på eksisterende login. Fremtidige loginmetoder kræver et nyt profil-onboardingdesign.
Der er ikke valgt et automatisk fallback-navn, som kunne skjule ugyldig registrering.

Preflight beskytter mod navnekonflikter, men kan ikke afgøre, om andre, forskelligt
navngivne Auth-triggere i projektet kolliderer funktionelt. Review eventuelle egne
Auth-triggere før installation. Standard Supabase kræver ingen ekstra extension.
Migrationen kan ikke genkøres oven på sig selv; den stopper sikkert. Ved fejl vil
transaktionen rulle tilbage, og den egentlige årsag skal undersøges før retry.

## Forståelige React-fejl uden falske garantier

Supabase Auth kan oversætte en trigger-/UNIQUE-/CHECK-fejl til en generisk 500
(`unexpected_failure`, “Database error saving new user”). SQLSTATE eller custom
RAISE-tekst er derfor ikke en stabil frontendkontrakt. Vi kan ikke korrekt skelne
mellem et optaget navn og en teknisk fejl alene ud fra dette svar.

`src/lib/signupError.js` er nu den sikre oversætter, brugt af auth-servicen:

- Kendte Auth-koder for svagt password, ugyldig e-mail, rate limiting og deaktiveret
  signup får konkrete danske beskeder.
- Generiske databasefejl og ukendte koder får en besked med mulighed for at prøve
  et andet brugernavn og en tydelig mulighed for et teknisk problem.
- Ingen påstand om “brugernavnet er optaget” ved en vilkårlig 500; ingen rå SQL,
  constraintnavne, e-mailadresser eller serverfejl gengives.
- Ugyldigt username afvises allerede lokalt inden API-kaldet. Det er UX, ikke
  sikkerhedsbarrieren: databaseconstraints beskytter også direkte API-kald.

Et eventuelt senere offentligt username-opslag kan give hurtigere feedback, men
kan aldrig erstatte UNIQUE (et andet signup kan vinde mellem opslag og INSERT).
E-mail-eksistens må ikke afsløres via et lignende offentligt opslag. Signup-success
kan være obfuskeret ved en eksisterende konto; UI skal stadig håndtere dette neutralt.

## Offentlighed og resterende risici

Hele `profiles`-rækken er offentligt læsbar: UUID, username, avatar_path og begge
tidsstempler. Der er ingen mailkolonne, auth-join eller offentlig Auth-visning.
Fremtidige private attributter skal i en anden tabel, aldrig blot tilføjes her.

Konsekvenser som skal accepteres før aktivering:

- Profiler kan enumereres/scrapes; CORS og den offentlige publishable key forhindrer
  det ikke. UUID og tidsstempler kan korreleres. Navneændringer kan observeres.
- Profilrækken oprettes før e-mailbekræftelse, så også ubekræftede kontiers username
  og registreringstid bliver synlige. En profil er ikke bevis på et valideret spilresultat.
- Offentligt username og senere foto kan identificere personen. UI skal forklare
  offentligheden og ikke automatisk importere private lokale oplysninger.
- Brugernavne kan reserveres af ubekræftede/bot-konti. Aktivér Auth-rate limits og
  CAPTCHA før offentlig signup og planlæg kontrolleret oprydning; ingen auto-sletning her.
- Avatarstien begrænser mappe og filnavn, men beviser ikke, at et objekt findes,
  ejes af brugeren eller indeholder et sikkert billede. Storage kommer særskilt.
- Service-role/ejeren bypasser RLS. Ingen af disse credentials må indgå i React.
  JWT'er kan leve til udløb efter logout; denne migration lover ikke øjeblikkelig revocation.

## Kontrol før og efter senere godkendt installation

Før: standardprojekt, SQL Editor-rolle postgres, ingen eksisterende profilsystem-
objekter og ingen kolliderende egne Auth-triggere. Kopiér **hele** første migration
inklusive BEGIN/COMMIT. Anden migration er ikke nødvendig for profiler/signup.

Efter, i staging: kør rigtig signup med metadata-username; test to samtidige
casevarianter, fejl/rollback, anonym SELECT uden mails, A→B update, forbudte felter,
uppercase/Unicode/optaget update, e-mailbekræftelse samt eksisterende kontologin og
reset. Disse databaseintegrationstests er endnu ikke kørt.

Kilder: [Supabase profiltrigger](https://supabase.com/docs/guides/auth/managing-user-data),
[Auth-rolle og triggerrettigheder](https://supabase.com/docs/guides/troubleshooting/dashboard-errors-when-managing-users-N1ls4A),
[Generisk signup-databasefejl](https://supabase.com/docs/guides/troubleshooting/database-error-saving-new-user-RU_EwB),
[PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/17/sql-createfunction.html).
