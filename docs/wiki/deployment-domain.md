# Deployment & Domain

The site is a static Astro build (no SSR adapter) deployed on **Vercel**, which builds and deploys from `main` on every push. GitHub Pages was the original target and is fully retired: `.github/workflows/deploy.yml` is deleted and the repo's Pages source is set to **None**.

## Current state (verified live 2026-09-03)

| | |
|---|---|
| Live URL | `https://abhijitsinha.in` |
| Custom domain | **Cut over.** DNS hosted at GoDaddy (`ns31`/`ns32.domaincontrol.com`), apex `A → 216.198.79.1`, `www` CNAME → per-account Vercel host, 308 to apex. Both certificates issued. |
| Cutover | **Done** — see [what actually happened](#what-actually-happened-at-cutover-2026-09-03) |
| Indexing | **Enabled** — `public/robots.txt` is `Allow: /` with `Disallow: /admin` retained |
| Contact forms | Working end to end (Supabase `submit-lead` → `leads` → Web3Forms email) |

The [cutover runbook](#cutover-runbook) below has been **executed**, not superseded — it is kept as
written because it is the recovery procedure if DNS ever has to be rebuilt, and because its
reasoning is still the reasoning. Where reality diverged from it, the runbook step carries an
inline correction and the divergences are collected in the section directly below.

**Historical note:** the site served from `https://abhijit-sinha-website.vercel.app` with
`Disallow: /` from launch until 2026-09-03. Nothing was ever indexed under that hostname, which
was the entire point of the block — so the cutover needed no duplicate-content cleanup.

## What actually happened at cutover (2026-09-03)

Five things the runbook did not predict. All five are now folded into the steps below, but they are
worth reading as a set, because four of them present as *the same symptom*: correct-looking records
that do nothing.

1. **Vercel now issues `216.198.79.1` for the apex, not `76.76.21.21`.** Vercel's own panel says the
   legacy IP "will continue to work", so this is not urgent for anyone already pointed at it — but
   the dashboard is authoritative and new setups should use what it shows.

2. **The `www` CNAME target is per-account and unguessable.** Ours is
   `50fdc8d963fd4e2e.vercel-dns-017.com`. The runbook already warned about this; it was right to.
   GoDaddy adds its own trailing dot, so enter the value without one.

3. **Do not use Vercel's "Vercel DNS" tab.** The Domains panel offers a nameserver switch to
   `ns1`/`ns2.vercel-dns.com` as an alternative to the A record. Taking it moves the *entire* zone to
   Vercel — including the **MX records routing `support@abhijitsinha.in`**, which would stop
   delivering until recreated by hand. The A-record route leaves mail untouched. Use the **DNS
   Records** tab.

4. **GoDaddy domain forwarding is what locks the parking A records.** The apex had *three* A records
   — `15.197.225.128` and `3.33.251.168` (GoDaddy's forwarding endpoints) alongside the one we
   added. The two forwarding rows had their delete and edit controls **greyed out**, because the
   forwarding feature owns them. They cannot be removed from the DNS page at all; deleting the
   forwarding entry under **Domain Settings → Forwarding** removes both rows automatically. Until
   then DNS round-robins across all three, so roughly two visitors in three land on the parking page
   — an intermittent failure that looks like slow propagation.

5. **The forwarding pointed the wrong way.** GoDaddy was set to forward apex → `http://www` (301),
   while Vercel is configured `www` → apex (308). Left in place these two fight each other into a
   redirect loop *after* DNS is otherwise perfect. Deleting the forwarding was required for
   correctness, not just tidiness.

Once forwarding was deleted, propagation took under a minute, and the post-push Vercel build was
live in ~30 seconds.

### Why `base` must stay at the domain root

`astro.config.mjs` reads `SITE_URL` and `BASE_PATH` from the environment, defaulting to `https://abhijitsinha.in` and root (`''`).

`base` is `''` on every host and must never go back to a sub-path. Vercel serves `dist/` at the root, so a non-empty `base` produces a site whose **pages load but whose CSS, images, and every link 404** — pages are emitted at the root regardless of `base`, so the deploy looks healthy while being completely broken. This is exactly how the first Vercel deploy failed, and it fails silently: no build error, no 500, just an unstyled page.

`SITE_URL` was **overridden in Vercel** to the vercel.app hostname for the whole pre-cutover
period, so canonical tags, `og:url`, and the sitemap agreed with the host actually serving them —
link previews in WhatsApp and LinkedIn resolve against `og:url`, so this was never merely cosmetic.
Since 2026-09-03 the override is `https://abhijitsinha.in`, which now matches the config default;
it is kept set rather than deleted so the value is visible in the dashboard alongside the others.

## Vercel project settings

Framework preset **Astro** — build `npm run build`, output `dist`, install `npm install`, all auto-detected. `npm run build` runs `astro check` first, so a type error fails the deploy the same way it fails locally. That is intentional; leave it.

Environment variables, scoped to Production + Preview + Development:

| Name | Value |
|---|---|
| `PUBLIC_FORM_ENDPOINT` | the `submit-lead` edge function URL |
| `PUBLIC_SUPABASE_URL` | the Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | the publishable key (public by design) |
| `SITE_URL` | `https://abhijitsinha.in` (set at cutover, 2026-09-03) |

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

Use the **DNS Records** tab, **not the Vercel DNS tab** — the nameserver switch it offers would
move the MX records for `support@abhijitsinha.in` to Vercel and break mail. See
[divergence 3](#what-actually-happened-at-cutover-2026-09-03).

1. **Delete the forwarding first, before touching any record.** Domain Settings → **Forwarding**,
   remove both the domain and any subdomain entry. Corrected 2026-09-03: this was step 2 and is now
   step 1, because the parking A records **cannot be deleted while forwarding exists** — GoDaddy
   greys out their delete and edit controls. Deleting the forwarding removes them for you. Doing it
   in the old order leaves you fighting a control that will never work.
2. **Confirm the parking records are gone.** A parked domain ships with GoDaddy forwarding IPs on
   `A @` (ours were `15.197.225.128` and `3.33.251.168`) and a `CNAME www → @`. If any survive, the
   apex round-robins between Vercel and the parking page.
3. Add `A` record — host `@`, value **`216.198.79.1`**. Corrected 2026-09-03: the runbook previously
   said `76.76.21.21`, which Vercel confirms still works but no longer issues. Take whatever the
   dashboard shows. An A record is required because GoDaddy cannot CNAME an apex; that is the only
   cost of choosing apex-canonical over www-canonical.
4. Add `CNAME` record — host `www`, value = whatever Vercel showed in step 1 (ours:
   `50fdc8d963fd4e2e.vercel-dns-017.com`, entered **without** a trailing dot — GoDaddy appends one).
5. **Leave MX, TXT and the `NS`/`SOA` rows alone.** `support@abhijitsinha.in` mail routing must not
   be disturbed by a hosting change.

Then wait for both hostnames to read **Valid** in Vercel's Domains panel. TLS certificates issue automatically once they do. GoDaddy TTLs are often an hour, so this is not instant.

Check propagation without waiting on a browser cache:

```bash
nslookup abhijitsinha.in
```

The apex should answer a single address — `216.198.79.1`. *More than one answer means a parking
record survived*; go back and clear the forwarding. Query a public resolver (`nslookup
abhijitsinha.in 8.8.8.8`) rather than trusting a browser or the Vercel badge, and check `www`
resolves through the vercel-dns host too. The real proof that certificates issued is that
`https://` responds at all on both names, not the panel turning green.

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

All of the above passed on 2026-09-03: eight 200s and one 404 (the runbook's original loop omitted
`/knowledge-corner`), canonical and `og:url` both on the apex, `www` 308, sitemap index resolving,
and **zero `/admin` URLs** in `sitemap-0.xml`. The Knowledge Corner article was checked in
view-source rather than by status code alone — a 200 proves the route exists, not that the
build-time Supabase fetch returned anything.

Then, in a browser:

- Submit **both** contact forms (homepage and `/investor-services`) from the real domain. Confirm a row in `leads` **and** the Web3Forms email. The email leg is the only part of the stack that fails silently.
- Paste the URL into WhatsApp to check the link preview — that exercises `og:url` and the OG image together.

### 7. Post-cutover

- **Check whether `abhijit-sinha-website.vercel.app` still serves.** Vercel keeps project aliases reachable, and now that indexing is enabled it would be an indexable duplicate of a regulated-content site. If it still answers, set it to redirect to the apex in the Domains panel.
  **Done 2026-09-03.** It was serving the full site on 200 for roughly an hour after cutover — a
  crawlable second copy of regulated content, which is exactly what the pre-cutover `Disallow` had
  existed to prevent. Now **308s to the apex and preserves the path** (`/disclosures` →
  `https://abhijitsinha.in/disclosures`), so no page on that host is independently indexable.
  Verify with a deep path, not just `/`: a root-only redirect would leave every inner page exposed.
- **Supabase → Auth → URL Configuration** must be updated by hand: Site URL to
  `https://abhijitsinha.in`, and `https://abhijitsinha.in/admin` added to the Redirect URLs
  allowlist. Nothing in the repo controls this, and the failure mode is silent — the magic link
  arrives and simply does not sign you in. **Set and confirmed by a real sign-in 2026-09-03** — the
  admin pages work on the custom domain. The edge functions needed **no** change; `track`,
  `publish-site` and `submit-lead` already allowlist both hostnames in source, which is why the
  forms worked the moment DNS landed.
- **Google Search Console**: register `https://abhijitsinha.in` and submit the sitemap. Nothing was ever indexed under the vercel.app hostname, so there is no migration or duplicate-content cleanup — that was the point of the `Disallow`.
  **Submitted 2026-09-03; still reports "Couldn't fetch".** Do not treat that as a fault on its own.
  `https://abhijitsinha.in/sitemap-index.xml` was checked with a Googlebot user-agent and returns
  **200 `application/xml` with no redirect**, and `robots.txt` both allows it and advertises the
  same URL — so there is nothing on the site to fix. "Couldn't fetch" is Search Console's state
  *before a successful crawl has been recorded*, and Google may also still hold the pre-cutover
  parking IP from the old records' 1-hour TTL. Resubmitting does not speed it up. If it persists
  beyond ~24h, suspect the **property**, not the sitemap: a URL-prefix property must be
  `https://abhijitsinha.in` exactly (`http://`, or the `www` form, is a separate property, and a
  sitemap submitted under a mismatched one fails). A DNS-verified Domain property avoids the
  distinction entirely and is the better fit here, since the GoDaddy zone is already under control.
- **Resend** becomes viable for lead notification email. It needs `abhijitsinha.in` verified, which the parked domain could not do, and requires its own DKIM/SPF TXT records at GoDaddy. See [data-model](data-model.md).

### What is still open (as of 2026-09-03)

The cutover itself is **finished and verified**: DNS, TLS, all routes, canonicals, sitemap, the
`/admin` exclusions, the vercel.app redirect, admin sign-in on the custom domain, and both contact
forms end to end. Nothing below blocks the site; these are the loose ends.

| Item | State | Notes |
|---|---|---|
| Search Console sitemap | **Waiting** | "Couldn't fetch" — expected pre-first-crawl. Re-check on or after **2026-09-04**; if unchanged, check the property type, not the sitemap (see above). |
| WhatsApp link preview | **Unverified** | Paste `https://abhijitsinha.in` into a chat. Exercises `og:url` and the OG image together — neither is provable by `curl`, since the failure is a preview that renders blank or stale. |
| `VERCEL_DEPLOY_HOOK_URL` | **Unverified** | Admin sign-in working does not prove *publishing* works. Press Publish in `/admin`; a **503 with an explanatory message** means the Supabase secret was never created. See [admin-dashboard](admin-dashboard.md). |
| Resend for lead email | **Optional** | Now unblocked — `abhijitsinha.in` can finally be domain-verified, which the parked domain could not do. Needs DKIM/SPF TXT records at GoDaddy. Web3Forms keeps working until then; this is an improvement, not a repair. See [data-model](data-model.md). |
| `commissionPeriod` | **Expires** | `site.ts` carries `1 August 2026 to 30 September 2026`. It is a dated statutory claim on `/disclosures` and goes stale on its own — it needs refreshing from the AMC rate cards when the period ends, independent of anything to do with the domain. |
| Missing AMC rate cards | **Waiting** | Empanelled with 14 AMCs, 6 rate cards on file. `/disclosures` states the gap openly, so this is not a defect — but each card that arrives means re-deriving `commissionSchedule` and flipping `rateCardOnFile` in `site.ts`. Outstanding: Aditya Birla Sun Life, Edelweiss, HDFC, ITI, Kotak Mahindra, Motilal Oswal, SBI, UTI. See [regulatory-compliance](regulatory-compliance.md#commission-disclosure-provenance). |
| quant rate card | **Lapsed** | The quant card on file is dated **1–31 August 2026** and has expired, while `/disclosures` publishes a period ending 30 September. Its figures are still in the table (highest slab, so the range encloses them); replace the card with one covering the published period. |

The last row is the only one with a hard deadline, and it is the one nothing will remind you about.

### Rollback

*(Executed 2026-09-03; retained as the recovery procedure.)* Nothing in steps 1–4 affects the live site — the vercel.app host serves throughout, so an abandoned cutover leaves no damage; just delete the domains in Vercel.

After step 5, rolling back means reverting the robots.txt commit and setting `SITE_URL` back. If DNS is the problem, the fastest recovery is to keep sharing the vercel.app URL while you fix the records, since it keeps working independently of the domain.

---

## What NOT to do

- **Never create `public/CNAME`.** It is a GitHub Pages artifact. On Vercel it is meaningless and would ship into `dist/` as a stray public file.
- **Never set `BASE_PATH` to a sub-path.** See the failure mode above — it breaks the site without breaking the build.
- **Don't hardcode `abhijitsinha.in`** anywhere outside `astro.config.mjs`'s env-driven defaults and `robots.txt`. Every internal link, image, and asset reference goes through `url()` in `src/lib/url.ts`.
- **Don't re-enable a GitHub Pages source.** A second live copy of a regulated-content site competing in search results is a compliance problem, not just an SEO one.
- **Don't lift the `Disallow` early** as a way to "test SEO". It cannot be undone for anything already crawled, and it puts a throwaway hostname into the index.

Related: [site-architecture](site-architecture.md) · [seo-and-metadata](seo-and-metadata.md) · [data-model](data-model.md)


## Additions to the cutover checklist (2026-09-01)

The admin panel, analytics and Knowledge Corner add three things the runbook above predates:

1. **`robots.txt` already carries `Disallow: /admin`**, added ahead of time precisely so step 5
   cannot forget it. When you delete the blanket `Disallow: /`, **keep the `/admin` line.**
2. **Supabase Auth redirect allowlist** must include `https://abhijitsinha.in/admin` alongside the
   vercel.app URL, or admin magic-link sign-in breaks silently after the cutover. The `track` and
   `publish-site` functions already allowlist both hostnames.
3. **`VERCEL_DEPLOY_HOOK_URL`** — create a Deploy Hook (Vercel → Settings → Git → Deploy Hooks,
   branch `main`) and save the URL as a Supabase secret. Until then the admin Publish button returns
   a 503 explaining this. The hook URL is a bearer credential: it must never reach the browser or
   the repo.

Post-cutover verification gains two checks: `/knowledge-corner` and one article URL must both return
200 and show their content in **view-source**, and `dist/sitemap-0.xml` must contain no `/admin` URL.
