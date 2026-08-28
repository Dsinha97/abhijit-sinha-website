# Deployment & Domain

The site is a static Astro build (no SSR adapter) deployed on **Vercel**, which builds and deploys from `main` on every push. GitHub Pages was the original target and is fully retired: `.github/workflows/deploy.yml` is deleted and the repo's Pages source is set to **None**.

## Current state (verified live)

| | |
|---|---|
| Live URL | `https://abhijit-sinha-website.vercel.app` |
| Custom domain | `abhijitsinha.in` — registered at **GoDaddy**, still parked, **not** pointed here |
| Cutover | Deferred until the site's content is finished |
| Indexing | **Disabled** — `public/robots.txt` carries `Disallow: /` |
| Contact forms | Working end to end (Supabase `submit-lead` → `leads` → Web3Forms email) |

The `.vercel.app` hostname is temporary but fully functional. Everything in the [cutover runbook](#cutover-runbook) below is the plan for later, not the state today.

### Why `base` must stay at the domain root

`astro.config.mjs` reads `SITE_URL` and `BASE_PATH` from the environment, defaulting to `https://abhijitsinha.in` and root (`''`).

`base` is `''` on every host and must never go back to a sub-path. Vercel serves `dist/` at the root, so a non-empty `base` produces a site whose **pages load but whose CSS, images, and every link 404** — pages are emitted at the root regardless of `base`, so the deploy looks healthy while being completely broken. This is exactly how the first Vercel deploy failed, and it fails silently: no build error, no 500, just an unstyled page.

`SITE_URL` is currently **overridden in Vercel** to the vercel.app hostname so canonical tags, `og:url`, and the sitemap agree with the host actually serving them. Without it they would advertise `abhijitsinha.in`, which does not resolve — link previews in WhatsApp and LinkedIn resolve against `og:url`, so this is not merely cosmetic.

## Vercel project settings

Framework preset **Astro** — build `npm run build`, output `dist`, install `npm install`, all auto-detected. `npm run build` runs `astro check` first, so a type error fails the deploy the same way it fails locally. That is intentional; leave it.

Environment variables, scoped to Production + Preview + Development:

| Name | Value |
|---|---|
| `PUBLIC_FORM_ENDPOINT` | the `submit-lead` edge function URL |
| `PUBLIC_SUPABASE_URL` | the Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | the publishable key (public by design) |
| `SITE_URL` | `https://abhijit-sinha-website.vercel.app` → becomes `https://abhijitsinha.in` at cutover |

`BASE_PATH` is deliberately **not** set — root is already the default. The Supabase `service_role` key must never be added here; it stays a Supabase edge-function secret (see [data-model](data-model.md)).

---

## Cutover runbook

Do this when the site's content is ready. Steps are ordered so the site is never broken mid-flight: DNS is pointed **before** the config claims the new domain, and the old host keeps serving throughout.

### Before you start

- Decide you are ready for the site to be **indexable**. Step 5 lifts the `Disallow`, and that is the real go-live moment — the DNS work alone is reversible and invisible.
- Have the GoDaddy account and the Vercel dashboard open in the same session. Nothing here is done from the repo except step 5.

### 1. Add the domains in Vercel

Project → Settings → Domains:

- Add `abhijitsinha.in`.
- Add `www.abhijitsinha.in` and set it to **Redirect to `abhijitsinha.in`** (308).

Vercel will show both as unverified and display the exact DNS values it wants. **Copy the `www` CNAME target from this screen** — historically `cname.vercel-dns.com`, but newer accounts are issued a per-account hostname, so the dashboard is authoritative over any documentation, this file included.

### 2. Fix GoDaddy DNS

In GoDaddy → Domain → DNS Management:

1. **Delete the parking records first.** A parked domain ships with an `A @ →` GoDaddy parking IP and a `CNAME www → @`. Both must go, or the apex keeps resolving to the parked page no matter what else you add.
2. **Check Domain Settings → Forwarding and remove any domain or subdomain forwarding.** GoDaddy forwarding silently overrides DNS. This is the most common reason a correct A record appears to do nothing, and it will cost you an hour if you skip it.
3. Add `A` record — host `@`, value `76.76.21.21` (Vercel's apex anycast IP). An A record is required because GoDaddy cannot CNAME an apex; that is the only cost of choosing apex-canonical over www-canonical.
4. Add `CNAME` record — host `www`, value = whatever Vercel showed in step 1.
5. **Leave MX and TXT records alone.** `support@abhijitsinha.in` mail routing must not be disturbed by a hosting change.

Then wait for both hostnames to read **Valid** in Vercel's Domains panel. TLS certificates issue automatically once they do. GoDaddy TTLs are often an hour, so this is not instant.

Check propagation without waiting on a browser cache:

```bash
nslookup abhijitsinha.in
```

The apex should answer `76.76.21.21`.

### 3. Point `SITE_URL` at the domain

Vercel → Settings → Environment Variables: change `SITE_URL` to `https://abhijitsinha.in` for all three environments.

This does not take effect until a rebuild. Step 5's push provides one — no need to redeploy twice.

### 4. Confirm nothing else needs touching

Two things people expect to change here and should not:

- **Supabase CORS** — the `submit-lead` edge function already allowlists `https://abhijitsinha.in` and `https://www.abhijitsinha.in` (it has since v7). Forms work the moment DNS lands. No redeploy.
- **`base` / `BASE_PATH`** — already root. Leave unset.

### 5. Lift the indexing block (the go-live commit)

Edit `public/robots.txt`: delete the `Disallow: /` line and its explanatory comment, and repoint the sitemap:

```
User-agent: *
Allow: /

Sitemap: https://abhijitsinha.in/sitemap-index.xml
```

`robots.txt` is **not** env-driven — that sitemap line is the only hardcoded absolute URL in the repo. The sitemap itself is generated from `site`, so only this file can go stale.

Commit and push. Vercel rebuilds with the new `SITE_URL`.

### 6. Verify

```bash
for p in / /solutions /disclosures /investor-services /schedule /privacy-policy /terms /nope; do echo -n "$p -> "; curl -s -o /dev/null -w "%{http_code}\n" "https://abhijitsinha.in$p"; done
```

Expect seven 200s and one 404. Then check the metadata and the redirect:

```bash
curl -s https://abhijitsinha.in/ | grep -oE 'rel="canonical" href="[^"]*"|property="og:url" content="[^"]*"'
```

```bash
curl -s -o /dev/null -w "www -> %{http_code} %{redirect_url}\n" https://www.abhijitsinha.in/
```

Expect canonical and `og:url` on `https://abhijitsinha.in`, and `www` returning 308 to the apex.

Then, in a browser:

- Submit **both** contact forms (homepage and `/investor-services`) from the real domain. Confirm a row in `leads` **and** the Web3Forms email. The email leg is the only part of the stack that fails silently.
- Paste the URL into WhatsApp to check the link preview — that exercises `og:url` and the OG image together.

### 7. Post-cutover

- **Check whether `abhijit-sinha-website.vercel.app` still serves.** Vercel keeps project aliases reachable, and now that indexing is enabled it would be an indexable duplicate of a regulated-content site. If it still answers, set it to redirect to the apex in the Domains panel.
- **Google Search Console**: register `https://abhijitsinha.in` and submit the sitemap. Nothing was ever indexed under the vercel.app hostname, so there is no migration or duplicate-content cleanup — that was the point of the `Disallow`.
- **Resend** becomes viable for lead notification email. It needs `abhijitsinha.in` verified, which the parked domain could not do, and requires its own DKIM/SPF TXT records at GoDaddy. See [data-model](data-model.md).

### Rollback

Nothing in steps 1–4 affects the live site — the vercel.app host serves throughout, so an abandoned cutover leaves no damage; just delete the domains in Vercel.

After step 5, rolling back means reverting the robots.txt commit and setting `SITE_URL` back. If DNS is the problem, the fastest recovery is to keep sharing the vercel.app URL while you fix the records, since it keeps working independently of the domain.

---

## What NOT to do

- **Never create `public/CNAME`.** It is a GitHub Pages artifact. On Vercel it is meaningless and would ship into `dist/` as a stray public file.
- **Never set `BASE_PATH` to a sub-path.** See the failure mode above — it breaks the site without breaking the build.
- **Don't hardcode `abhijitsinha.in`** anywhere outside `astro.config.mjs`'s env-driven defaults and `robots.txt`. Every internal link, image, and asset reference goes through `url()` in `src/lib/url.ts`.
- **Don't re-enable a GitHub Pages source.** A second live copy of a regulated-content site competing in search results is a compliance problem, not just an SEO one.
- **Don't lift the `Disallow` early** as a way to "test SEO". It cannot be undone for anything already crawled, and it puts a throwaway hostname into the index.

Related: [site-architecture](site-architecture.md) · [seo-and-metadata](seo-and-metadata.md) · [data-model](data-model.md)
