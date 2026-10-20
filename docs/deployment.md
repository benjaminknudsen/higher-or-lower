# GitHub Pages

Appen publiceres på https://benjaminknudsen.github.io/higher-or-lower/.

`.github/workflows/deploy.yml` kører ved push til `main` og kan startes manuelt fra Actions → Deploy to GitHub Pages → Run workflow, når filen findes på `main`.

Workflowet bruger Node 24, `npm ci`, tests, lint og build. Kun `dist` uploades som Pages-artifact; deploy-jobbet venter på et vellykket build og har `pages: write` og `id-token: write`. Miljøet hedder `github-pages`.

I Settings → Pages skal Source være **GitHub Actions**. Repositoryets Actions skal være aktiveret og tillade de officielle `actions/*`-actions. Eventuelle miljøregler for `github-pages` skal tillade deployment fra `main`.

Supabase-konfigurationen injiceres i buildet fra repositoryets Actions Variables:

- `VITE_SUPABASE_URL`: projektets HTTPS-URL, fx `https://<project-ref>.supabase.co`.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: projektets `sb_publishable_...`-nøgle.

Opret dem under Settings → Secrets and variables → Actions → Variables. Publishable
key og URL er beregnet til browseren og bliver indlejret i den offentlige build; brug
aldrig en `service_role`- eller `sb_secret_...`-nøgle her. Workflowet stopper før
build, hvis en af variablerne mangler. Lokalt kommer de samme værdier fra `.env`,
som fortsat er gitignored.

Vite bruger `base: '/higher-or-lower/'`. JavaScript-genererede billedstier bruger `import.meta.env.BASE_URL`; Vite omskriver selv CSS- og HTML-assets. Hash-navigationen kræver ikke server-rewrites.

## Få rettelsen online

Ændringerne er lavet på `feat-homepage`. Commit og push dem på denne branch, og merge en pull request til `main`. Push/merge til `main` starter **Deploy to GitHub Pages** automatisk. Følg build- og deploy-jobbet under repositoryets Actions-fane. Efter grøn deployment kan siden genindlæses.

Lokal kontrol af produktionsbuild:

```sh
npm test
npm run lint
npm run build
npm run preview
```

Åbn preview på `/higher-or-lower/`, inklusive spillet på `/higher-or-lower/#spil/appearances`.

## Diagnose 2026-10-18

Ved kontrol af GitHubs offentlige API manglede `.github/workflows` på `main`. API'et viste kun det dynamiske `pages-build-deployment`-workflow med én vellykket kørsel fra 2026-10-17 på commit `59a64c9`, mens `main` var på `ee50e22`. Der fandtes dermed intet repository-workflow, som byggede Vite og deployede ved nye pushes til `main`. Lokal Vite-konfiguration manglede desuden den nødvendige base-sti.

Pages-indstillingerne kunne ikke læses via det offentlige API (404); Source = GitHub Actions er oplyst af ejeren. Der er ikke ændret indstillinger på GitHub eller pushet/deployet fra denne arbejdsmappe.
