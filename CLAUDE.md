# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This is the marketing/service site for **Abhijit Sinha**, an AMFI-registered Mutual Fund Distributor (ARN-367596) in India, built as a static **Astro + Tailwind** site. Target repo: `https://github.com/Dsinha97/abhijit-sinha-website.git`. Deployed via GitHub Pages/Actions; current live URL and the eventual custom-domain (`abhijitsinha.in`, currently parked at GoDaddy) cutover plan are in [docs/wiki/deployment-domain.md](docs/wiki/deployment-domain.md).

This is a regulated-content site: every page carries statutory disclosures and must not read as investment advice. See "Compliance rules" below before editing any page copy.

## Commands

```bash
npm run dev       # local dev server
npm run build     # production build to dist/
npm run preview   # serve the production build locally
npx astro check   # typecheck .astro files
```

There is no test suite. Verification is: `astro check` passes, `npm run build` is clean, and the manual checks in the project plan (page-by-page, mobile+desktop, calculator arithmetic, compliance-text grep) all pass.

## Architecture

- `src/layouts/BaseLayout.astro` — the shell every page uses. Mounts `SEO.astro` in `<head>`, then `RegulatoryStrip` → `Header` → `<slot/>` → `Footer` → `WhatsAppButton` in `<body>`. Pages should stay thin: supply `title`/`description` and page-specific sections only — shared chrome always comes from this layout, never duplicated per-page.
- `src/data/site.ts` — the **single source of truth** for every regulatory identifier, contact detail, nav entry, footer link, RTA table row, commission-table row, and the scheduler config. Components and pages read from here; never hardcode ARN/EUIN/phone/email/commission numbers inline.
- `src/lib/url.ts` — a `url()` helper that prefixes `import.meta.env.BASE_URL`. **Use it for every internal link, image `src`, and asset reference.** The site currently deploys to a GitHub Pages *project sub-path* (not the domain root), so a raw `/solutions`-style path will 404 in production even though it works fine in `npm run dev`. This is the single most common way this site breaks silently.
- `src/components/SchedulerEmbed.astro` — provider-agnostic booking widget. Switches on `site.scheduler.provider` (`'cal' | 'calendly' | 'google' | 'none'`) to render the right iframe embed, or a contact-card placeholder when no scheduler is configured yet. Swapping providers is a one-line edit to `site.ts`, never a template change.
- `src/components/Calculators.astro` — SIP growth + goal-planner calculators (two-tab UI, client-side compounding math). Formulas and reference values are documented in [docs/wiki/calculators.md](docs/wiki/calculators.md); use that to sanity-check any change to the math.
- Reusable content modules: `SectionCard.astro`, `ComplianceCallout.astro`, `DataTable.astro` (wrap wide tables in `overflow-x-auto`).

### Routes

`/`, `/solutions`, `/disclosures`, `/investor-services`, `/schedule`, `/privacy-policy`, `/terms`, `/404`. Full per-page section breakdown is in [docs/wiki/site-architecture.md](docs/wiki/site-architecture.md) and the individual `docs/wiki/page-*.md` notes.

## Compliance rules (non-negotiable)

- Never change these identifiers without the user explicitly providing a new value: **ARN-367596**, **EUIN E703717**, **NISM Series V-A**, principal place of business **Navi Mumbai**, phone **+91-9004087549**, email **abhijit.uti@gmail.com**.
- The statutory risk-warning sentence ("Mutual fund investments are subject to market risks...") and the "Regular Plans" distributor notice must appear on every page's footer — they live in `Footer.astro`, do not move them into page-specific conditionals.
- Never write or approve copy that reads as personalized investment advice, a return guarantee, or a recommendation driven by commission rates — this site is distribution-only, and the specs are explicit about that distinction. See [docs/wiki/regulatory-compliance.md](docs/wiki/regulatory-compliance.md).
- Numbers in brackets in the source specs (commission ranges, allocation frameworks, ARN validity dates) are **unconfirmed placeholders**. Keep them visibly marked as such in `site.ts`; do not invent real-looking figures.

## Design system

Oxford Navy `#0F172A` primary, off-white surfaces, 8–12px rounded corners, no heavy shadows, 44×44px minimum touch targets. Full palette, typography, and layout rules: [docs/wiki/design-system.md](docs/wiki/design-system.md) — read it before styling anything rather than re-deriving the palette from component code.

## Where content lives

- [`docs/wiki/`](docs/wiki/) — **authoritative**, synthesized reference for every page's content, the design system, and compliance rules. Read this first when implementing or changing a page.
- `docs/sources/` — the original raw markdown specs. Provenance only; don't edit, and don't treat as more current than the wiki.
- `Images/` — the asset source (`logo.png`, `banner.png`, `banner-mobile.jpeg`, `profile-pic.jpg`, `Buffet-quote.jpeg`). Note: specs reference `.jpg` filenames for logo/banner — the real files are `.png`; use the real filenames.
- **`Important Docs/`** (ARN registration & NISM certificate PDFs) — **sensitive. Never commit, never copy into `public/` or any build output.** Their factual contents (identifiers already listed above) may be read and transcribed as text; the PDF files themselves stay local only and are `.gitignore`d.

## Deploy

Push to `main` triggers `.github/workflows/deploy.yml` (Astro build → GitHub Pages). The site currently ships to the default Pages sub-path, not the custom domain — see [docs/wiki/deployment-domain.md](docs/wiki/deployment-domain.md) for the deferred GoDaddy/Cloudflare domain-cutover plan before touching `astro.config.mjs`'s `site`/`base` values.
