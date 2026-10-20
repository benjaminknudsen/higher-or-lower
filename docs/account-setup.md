# Kontosystem – tjekliste

Første migration er allerede kørt af ejeren; kør den ikke igen. E-mail-login og
URL Configuration er konfigureret. Der er ingen nye SQL-/deploy-opgaver her.

1. Tilføj den faktiske lokale Vite-base til redirect allowlist, normalt
   `http://localhost:5173/higher-or-lower/`. Behold den eksisterende Pages-base.
2. Kontrollér Confirm email og maillevering/SMTP for rigtige modtagere.
3. Supabase håndhæver den eksisterende passwordpolitik. Frontend viser sikre
   fejl fra Supabase og har ikke længere et ubekræftet 12–128-krav.
4. Brug `npm run dev` og følg trinene i `docs/supabase.md`.
5. Test signup, e-mailbekræftelse, reload, logout og recovery på begge temaer og
   fysisk iPhone/PWA. Ingen rigtige testkonti eller mails er oprettet af agenten.
6. CAPTCHA-widget er ikke implementeret. Hvis projektet kræver CAPTCHA, skal det
   integreres særskilt; rate limits og sikre fejl erstatter ikke botbeskyttelse.
7. Online-statistik, Storage og leaderboard kræver den nye migration i
   `docs/online-platform.md`; den er forberedt, men ikke kørt.

Kun eksisterende VITE_SUPABASE_URL og VITE_SUPABASE_PUBLISHABLE_KEY bruges.
