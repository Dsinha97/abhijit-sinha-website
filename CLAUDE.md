# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This is the marketing/service site for **Abhijit Sinha**, an AMFI-registered Mutual Fund Distributor (ARN-367596) in India, built as a static **Astro + Tailwind** site. Target repo: `https://github.com/Dsinha97/abhijit-sinha-website.git`. Deployed on **Vercel** (static output, no adapter), live at **`https://abhijitsinha.in`** since the domain cutover on 2026-09-03. DNS is hosted at **GoDaddy** (apex `A → 216.198.79.1`; `www` CNAMEs to a per-account Vercel host and 308s to the apex). **The site is now indexable** — `robots.txt` is `Allow: /` with `Disallow: /admin` retained. What actually happened at cutover, including the GoDaddy forwarding trap that silently locks the parking A records, is in [docs/wiki/deployment-domain.md](docs/wiki/deployment-domain.md).

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
- `src/lib/url.ts` — a `url()` helper that prefixes `import.meta.env.BASE_URL`. **Use it for every internal link, image `src`, and asset reference.** The site now deploys at the domain root (`base` is `''`), so a raw `/solutions`-style path happens to work today — but `url()` remains mandatory, because it is the only thing that kept the site portable across the Pages sub-path and would do so again for any future sub-path or preview host. Don't reintroduce raw paths on the grounds that they currently render.
- `src/components/SchedulerEmbed.astro` — provider-agnostic booking widget. Switches on `site.scheduler.provider` (`'cal' | 'calendly' | 'google' | 'none'`) to render the right iframe embed, or a contact-card placeholder when no scheduler is configured yet. Swapping providers is a one-line edit to `site.ts`, never a template change.
- `src/components/Calculators.astro` — SIP growth + goal-planner calculators (two-tab UI, client-side compounding math). Formulas and reference values are documented in [docs/wiki/calculators.md](docs/wiki/calculators.md); use that to sanity-check any change to the math.
- Reusable content modules: `SectionCard.astro`, `ComplianceCallout.astro`, `DataTable.astro` (wrap wide tables in `overflow-x-auto`).

### Routes

`/`, `/solutions`, `/disclosures`, `/investor-services`, `/knowledge-corner`, `/knowledge-corner/[slug]`, `/schedule`, `/privacy-policy`, `/terms`, `/404`, plus the noindex admin pages `/admin`, `/admin/leads`, `/admin/knowledge`, `/admin/analytics`. Full per-page section breakdown is in [docs/wiki/site-architecture.md](docs/wiki/site-architecture.md) and the individual `docs/wiki/page-*.md` notes.

## Compliance rules (non-negotiable)

- Never change these identifiers without the user explicitly providing a new value: **ARN-367596**, **EUIN E703717**, **NISM Series V-A**, principal place of business **Navi Mumbai**, phone **+91-8976539234**, email **support@abhijitsinha.in**.
- The statutory risk-warning sentence ("Mutual fund investments are subject to market risks...") and the "Regular Plans" distributor notice must appear on every page's footer — they live in `Footer.astro`, do not move them into page-specific conditionals.
- Never write or approve copy that reads as personalized investment advice, a return guarantee, or a recommendation driven by commission rates — this site is distribution-only, and the specs are explicit about that distinction. See [docs/wiki/regulatory-compliance.md](docs/wiki/regulatory-compliance.md).
- Numbers in brackets in the source specs (commission ranges, allocation frameworks, ARN validity dates) are **unconfirmed placeholders**. Keep them visibly marked as such in `site.ts`; do not invent real-looking figures.
- **Never collect folio numbers, PAN, or bank details through a website form.** These are financial identifiers; storing them at rest is a DPDP liability with no operational gain. They are collected over WhatsApp/phone or through regulated AMC/RTA onboarding. The folio field was deliberately removed from `ContactForm.astro` — do not reintroduce it without a retention policy and a Privacy Policy disclosure.
- **Empanelment and rate-card receipt are separate facts, and `site.ts` keeps them apart.** `empanelledAmcs` is every AMC the ARN is empanelled with; `rateCardAmcs` is the subset whose current brokerage rate card is on file. The Annual Trail Commission Schedule on `/disclosures` may name **only** `rateCardAmcs`, because the ranges were derived from those cards alone. Widening the AMCs named beside that table without first re-deriving the figures makes a statutory claim the documents do not support. Flip `rateCardOnFile` only after re-deriving.
- **The compliance-locked identifiers above must never become admin-editable.** They stay hardcoded in `site.ts` and are deliberately absent from the Supabase `site_content` table and the `/admin` UI.

## Admin dashboard & data layer

The site is static with no adapter, so `/admin` is a client-side-only page and **security is enforced by Supabase Row Level Security, not by the host**. Read [docs/wiki/admin-dashboard.md](docs/wiki/admin-dashboard.md) and [docs/wiki/data-model.md](docs/wiki/data-model.md) before touching any of it.

- Contact forms POST to the Supabase `verify-lead` edge function (`PUBLIC_FORM_ENDPOINT`), which runs the bot checks (honeypot, dwell time, field caps, per-IP rate limit, Cloudflare Turnstile) and then forwards server-to-server to `submit-lead`, which stores submissions in `leads`. The `leads` table has **no INSERT policy** by design — only the edge function's service_role key can write to it.
- **Turnstile is fail-open while `TURNSTILE_SECRET_KEY` is unset and fail-closed once it is set**, and the client renders no widget without `PUBLIC_TURNSTILE_SITE_KEY`. Keep that asymmetry: an unconfigured secret must never take the site's only lead channel offline. `verify-lead`'s field caps mirror the `maxlength` attributes in `ContactForm.astro` — change both together. Rationale in [docs/wiki/contact-channels.md](docs/wiki/contact-channels.md).
- The **publishable/anon key is public by design** and belongs in the bundle. The **service_role key bypasses RLS entirely** and must never appear under `src/`, `public/`, or `.env` — only in Supabase edge-function secrets.
- Admin access is the two emails in the `admin_allowlist` table, enforced by `is_admin()`. A Supabase account alone grants nothing. Public sign-ups must stay disabled.
- The `/admin` panel is **built**: lead inbox, first-party analytics, and Knowledge Corner CRUD. Publishing content calls the `publish-site` edge function, which POSTs a **Vercel Deploy Hook** (secret `VERCEL_DEPLOY_HOOK_URL`). The old `repository_dispatch` plan is dead — the workflow file it needed no longer exists.
- **Never redeploy the `submit-lead` edge function.** Its live version is the only working lead path on the site and is verified end to end. New shared logic (CORS, origin allowlists) is duplicated into new functions rather than extracted, specifically to avoid touching it.
- `supabase/functions/` holds the source for `track`, `verify-lead` and `publish-site` (never `submit-lead`, whose source is not in this repo). Deploy new ones with `--no-verify-jwt`. `supabase/` is excluded from `tsconfig.json`: those are Deno files, and `npm run build` runs `astro check` first, so leaving them in would fail every site deploy on phantom type errors.
- Any content moved into Supabase must keep a committed build-time fallback, so a Supabase outage never ships an empty statutory table. For the Knowledge Corner that fallback is `src/data/knowledge.snapshot.json`, refreshed with `npm run sync:knowledge` and committed — without it, an outage produces a *green build that 404s every live article*.

## Knowledge Corner

`src/lib/knowledge.ts` fetches published articles, videos and links at **build time** via plain `fetch` (not `@supabase/supabase-js`) and never throws: live → committed snapshot → empty. `src/lib/markdown.ts` renders article bodies with `marked`, dropping raw HTML entirely so pasted `<script>`/`<iframe>` cannot reach the page; `javascript:` and `data:` links degrade to plain text.

Publishing an article requires **both** a clean lint (`src/lib/compliance-lint.ts`) and a ticked acknowledgement. That is enforced in Postgres by the `posts_publish_requires_ack` CHECK and the `assert_post_compliance()` trigger, not just in the UI — if you change the banned-phrase list in one place, change it in the other. Videos render as click-to-load `youtube-nocookie` facades: **no third-party request may fire before the visitor clicks**, which is why there is no thumbnail column.

## Analytics

First-party and cookieless, ingested by the `track` edge function into `analytics_events` and charted inside `/admin`. It stores **no IP address, no user-agent, no location**; `session_hash` is salted server-side and rotates daily. The client (`src/scripts/analytics.ts`) no-ops with zero network on localhost, on `/admin`, and under Do Not Track, and must send a `text/plain` Blob — `sendBeacon` cannot preflight, so `application/json` would silently drop every event. Retention is 13 months, enforced by a `pg_cron` job and disclosed in Privacy Policy §5.2. **Adding or widening any collection here requires a matching Privacy Policy edit.**

## Design system

Oxford Navy `#0F172A` primary, off-white surfaces, 8–12px rounded corners, no heavy shadows, 44×44px minimum touch targets. Full palette, typography, and layout rules: [docs/wiki/design-system.md](docs/wiki/design-system.md) — read it before styling anything rather than re-deriving the palette from component code.

**Mobile layout rules that are not negotiable** — all four were learned from one horizontal-scroll bug that took five deploys and does not reproduce in desktop emulation. Read [docs/wiki/mobile-viewport-pitfalls.md](docs/wiki/mobile-viewport-pitfalls.md) before adding anything that floats, clips, or scrolls sideways.

- **Float things with `left-0` + `w-screen`, never `right-*` or `inset-x-*`.** A fixed box resolves offsets against the window, and on a real phone the window measured 876px against a 411px layout viewport — `right-6` put the WhatsApp button at x=852 and gave every page 465px of sideways scroll.
- **`overflow-x: clip` on the root does not clip fixed-position boxes.** It was tried and reverted; don't reach for it as a catch-all.
- **An `sr-only` span inside an `overflow-x-auto` container needs `relative` on its parent.** `sr-only` is `position: absolute`, so with no positioned ancestor it escapes the scroll container and scrolls the document. The `relative` on the anchor in `DataTable.astro` is load-bearing.
- **No horizontally scrolling carousels.** The Knowledge Corner previews are a plain grid with "View all" links to the listing pages; `Carousel.astro` was deleted, not shelved.

## Where content lives

- [`docs/wiki/`](docs/wiki/) — **authoritative**, synthesized reference for every page's content, the design system, and compliance rules. Read this first when implementing or changing a page.
- `docs/sources/` — the original raw markdown specs. Provenance only; don't edit, and don't treat as more current than the wiki.
- `Images/` — the asset source (`logo.png`, `banner.png`, `banner-mobile.jpeg`, `profile-pic.jpg`, `Buffet-quote.jpeg`). Note: specs reference `.jpg` filenames for logo/banner — the real files are `.png`; use the real filenames.
- **`Important Docs/`** (ARN registration & NISM certificate PDFs) — **sensitive. Never commit, never copy into `public/` or any build output.** Their factual contents (identifiers already listed above) may be read and transcribed as text; the PDF files themselves stay local only and are `.gitignore`d.

## Deploy

Push to `main` triggers a Vercel build and deploy (`npm run build` → `dist/`). There is no GitHub Actions workflow and no GitHub Pages source — do not reintroduce either; a second live copy of a regulated-content site is a compliance problem, not just an SEO one.

`site`/`base` in `astro.config.mjs` default to `https://abhijitsinha.in` and the domain root, overridable via the `SITE_URL`/`BASE_PATH` env vars set in Vercel. `SITE_URL` is set to `https://abhijitsinha.in`, matching the default — it was pointed at the vercel.app hostname before cutover so canonicals and the sitemap matched the host actually serving them.

**Never touch DNS from Vercel's "Vercel DNS" nameserver tab.** It moves the whole zone off GoDaddy, including the MX records that route `support@abhijitsinha.in`. Apex changes go in the **DNS Records** tab as an A record.

**Security headers live in `vercel.json` and the CSP is enforcing.** Adding any third-party script, iframe, image host, or fetch target requires a matching CSP edit there — under an enforcing CSP the failure is silent, the resource simply never loads. `vite.build.assetsInlineLimit: 0` in `astro.config.mjs` is load-bearing for this: without it Astro inlines small `<script>` blocks into the HTML and every page violates `script-src 'self'`. `.env.example` is a **template of placeholders only** and must never become a copy of `.env`. Full audit and per-host CSP rationale: [docs/wiki/security-hardening.md](docs/wiki/security-hardening.md).

**`base` must stay at the domain root.** Vercel serves `dist/` from the root, and pages are emitted at the root regardless of `base`, so a non-empty `BASE_PATH` yields a site whose pages load while every stylesheet, image, and link 404s — a clean build and a broken site. `public/robots.txt`'s `Sitemap:` line is the only hardcoded absolute URL in the repo and is not env-driven; edit it by hand if the domain changes. Never create `public/CNAME` (a GitHub Pages artifact). See [docs/wiki/deployment-domain.md](docs/wiki/deployment-domain.md).
