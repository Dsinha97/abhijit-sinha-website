# Deployment & Domain

The site is a static Astro build (no SSR adapter) deployed on **Vercel**.

**Current state: serving from the temporary Vercel hostname `https://abhijit-sinha-website.vercel.app`.** The `abhijitsinha.in` cutover is deferred — the domain remains parked at GoDaddy with no DNS pointing here. Everything below about DNS is the plan for that day, not the state today.

When the cutover happens the domain stays **registered and DNS-hosted at GoDaddy** — only the DNS records point at Vercel; the nameservers never move.

GitHub Pages was the original target and has been retired. There is no longer a `.github/workflows/deploy.yml`; Vercel's Git integration builds and deploys on every push to `main`.

## Current state

- Live at `https://abhijit-sinha-website.vercel.app`, built from `main` by Vercel's Git integration.
- Domain `abhijitsinha.in` registered at **GoDaddy** and still parked. Cutover deferred.
- `astro.config.mjs` reads `SITE_URL` and `BASE_PATH` from the environment, defaulting to `https://abhijitsinha.in` and root (`''`). `SITE_URL` is currently **overridden in Vercel** to the vercel.app hostname so canonical tags, OG URLs, and the sitemap all agree with the host actually serving them.
- `base` is the domain root (`''`) on every host. It must never go back to a sub-path: Vercel serves `dist/` at the root, so a non-empty `base` produces a site whose pages load but whose CSS, images, and links all 404 — which is exactly how the first Vercel deploy broke.
- **Indexing is disabled** while on the temporary hostname: `public/robots.txt` carries `Disallow: /`, so a throwaway host never enters the index and there is no duplicate-content cleanup at cutover.
- `public/robots.txt` also hardcodes the sitemap URL. It is **not** env-driven; edit it by hand alongside any domain change. The sitemap itself is generated from `site`, so only robots.txt can go stale.

## Vercel project settings

Framework preset **Astro** — build `npm run build`, output `dist`, install `npm install`, all auto-detected. `npm run build` runs `astro check` first, so a type error fails the deploy the same way it fails locally. That is intentional.

Environment variables, scoped to Production + Preview + Development:

| Name | Value |
|---|---|
| `PUBLIC_FORM_ENDPOINT` | the `submit-lead` edge function URL |
| `PUBLIC_SUPABASE_URL` | the Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | the publishable key (public by design) |
| `SITE_URL` | `https://abhijit-sinha-website.vercel.app` (change to `https://abhijitsinha.in` at cutover) |

`BASE_PATH` is deliberately **not** set — root is already the default. The Supabase `service_role` key must never be added here; it stays a Supabase edge-function secret (see [data-model](data-model.md)).

## Cutover checklist (when the domain is ready)

1. Vercel → Settings → Domains: add `abhijitsinha.in` and `www.abhijitsinha.in`, setting `www` to redirect to the apex.
2. GoDaddy DNS: the records below.
3. Vercel env var: `SITE_URL` → `https://abhijitsinha.in`.
4. `public/robots.txt`: delete the `Disallow: /` line and point `Sitemap:` at `https://abhijitsinha.in/sitemap-index.xml`.
5. Redeploy, then register the property in Google Search Console and submit the sitemap.

## GoDaddy DNS records

1. **Delete the parking records first.** A parked GoDaddy domain ships with an `A @ →` GoDaddy parking IP and a `CNAME www → @`. Both must go, or the apex keeps resolving to the parked page. Also check Domain Settings → **Forwarding** and remove any domain/subdomain forwarding — GoDaddy forwarding overrides DNS and is the usual reason a corrected A record appears to do nothing.
2. `A` record, host `@`, value `76.76.21.21` — Vercel's apex anycast IP. An A record is required because GoDaddy cannot CNAME an apex, which is what makes apex-canonical cost one more step than www-canonical.
3. `CNAME` record, host `www`, value **exactly what Vercel shows in Project → Settings → Domains**. Historically `cname.vercel-dns.com`, but newer accounts are issued a per-account hostname — copy it from the dashboard rather than from any doc, including this one.
4. Leave MX and TXT records alone. `support@abhijitsinha.in` mail routing must not be disturbed by a hosting change.
5. Wait for both hostnames to read **Valid** in Vercel's Domains panel; TLS certificates issue automatically. GoDaddy TTLs are often an hour.

## What NOT to do

- **Never create `public/CNAME`.** It is a GitHub Pages artifact. On Vercel it is meaningless at best, and it would be copied into `dist/` as a stray public file.
- Don't hardcode `abhijitsinha.in` anywhere outside `astro.config.mjs`'s env-driven defaults and `robots.txt`. Every internal link, image, and asset reference goes through `src/lib/url.ts`'s `url()` helper.
- Don't re-enable a GitHub Pages source. A second live copy of a regulated-content site competing in search results is a compliance problem, not just an SEO one.

## Follow-ups unblocked by the cutover

- **Resend** for lead notification email now becomes viable — it requires verifying `abhijitsinha.in`, which the parked domain couldn't do. Needs its own DKIM/SPF TXT records at GoDaddy. See [data-model](data-model.md).
- **Google Search Console**: register `https://abhijitsinha.in` as a property and submit the sitemap.

Related: [site-architecture](site-architecture.md) · [seo-and-metadata](seo-and-metadata.md) · [data-model](data-model.md)
