# SEO & Metadata

Source: [seo-tools.md](../sources/seo-tools.md).

## Sitemap & robots

`@astrojs/sitemap` integration. `site` is `https://abhijitsinha.in` and `base` is the domain root, matching the source spec — the site is served from the root on Vercel, so sitemap and canonical URLs need no sub-path allowance. Both values are env-overridable; see [deployment-domain](deployment-domain.md). `public/robots.txt` allows all crawlers **except on `/admin`**, and points to `/sitemap-index.xml`; its `Sitemap:` line is the one hardcoded absolute URL in the repo and must be edited by hand if the domain ever changes. Indexing was blocked outright (`Disallow: /`) until the 2026-09-03 cutover — see [deployment-domain](deployment-domain.md). The `Disallow: /admin` line was added ahead of that date specifically so lifting the blanket block could not accidentally expose the admin panel, and the sitemap integration filters `/admin` independently in `astro.config.mjs`; **both belts are deliberate, keep both.**

## Social preview

`og-image.jpg`, 1200×630px, derived from the banner asset, placed in `public/`.

## `SEO.astro` component

Reusable head component taking `title`, `description`, `image` (default `/og-image.jpg`), `article` props. Emits:

- `<title>`, meta description, canonical link (built from `Astro.url.pathname` + `Astro.site`)
- Open Graph tags (type, url, title, description, image, site_name "Abhijit Sinha | AMFI-Registered MFD")
- Twitter Card tags (summary_large_image)
- JSON-LD `FinancialService` schema: name, url, logo, image, description, `identifier: "ARN-367596"`, founder (Person, jobTitle "Mutual Fund Distributor", honorificSuffix "MBA in Finance")

Mounted inside `BaseLayout.astro`'s `<head>`. See [site-architecture](site-architecture.md).

## External profiles

Both are now linked from the JSON-LD `sameAs` array (see Additions 2026-09-06), which closes the open item this section used to record:

- Google Business Profile: place ID `ChIJ9zAUWBnB5zsRUORqF5Cp7OA` — `googleBusiness` in `site.ts`
- LinkedIn: `https://www.linkedin.com/in/abhijit-sinha-243b7243/` — `distributor.linkedin`

Related: [site-architecture](site-architecture.md) · [regulatory-compliance](regulatory-compliance.md)


## Additions 2026-09-01

- `SEO.astro` gained two optional, backwards-compatible props: `ogType` (default `'website'`) and
  `jsonLd` (default the site-wide `FinancialService` node). Knowledge Corner article pages pass
  `ogType="article"` and a `BlogPosting` node, so a post is described as content rather than as the
  business. Every existing caller is unaffected.
- `astro.config.mjs` now filters `/admin` out of the sitemap. This is **not optional**: without it
  the admin URLs are advertised in `sitemap-index.xml` the moment the blanket `Disallow` is lifted
  at cutover.
- `public/robots.txt` carries `Disallow: /admin` above the blanket `Disallow: /`, so the cutover
  edit cannot accidentally expose it.

## Additions 2026-09-06 — local business fields

The default `FinancialService` node gained the fields that make it usable as a local-business entity. `FinancialService` is a `LocalBusiness` subtype, so all of them are valid on the existing node — **no second script tag and no new schema type**:

- `telephone`, `email`
- `address` — a `PostalAddress` built from `distributor.address`
- `openingHours` — `distributor.officeHours.schema`, currently `["Mo-Sa 10:00-19:00"]`
- `areaServed` — `{ '@type': 'Country', name: 'India' }`
- `hasMap` and `sameAs` — the Google Business Profile URL, with LinkedIn alongside it in `sameAs`

`sameAs` is the field that actually ties site ↔ listing ↔ LinkedIn together as one entity; the address inside it must stay byte-identical to the listing's, so treat `site.ts` and the Google Business Profile as a single edit. See [contact-channels](contact-channels.md) for the full NAP note.

**No `aggregateRating` and no `review`, deliberately.** The listing has no reviews. Rating markup with nothing behind it is a Google structured-data penalty, and on a regulated-content site it is a misrepresentation. Add these only if real review data is ever fetched — which would need the Places API, a server, a key, and a `connect-src` widening in `vercel.json`.

The `ld+json` block remains the one inline `<script>` tolerated in `dist/` under the enforcing CSP, because browsers do not execute it — see [security-hardening](security-hardening.md). Extending it raises no CSP question; embedding a Google map would (`frame-src https://www.google.com`), which is why the site links out to Google instead.
