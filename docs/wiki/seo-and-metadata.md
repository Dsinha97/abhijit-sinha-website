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

## External profile

LinkedIn: `https://www.linkedin.com/in/abhijit-sinha-243b7243/` — noted in the source for potential `sameAs` schema linkage or footer link, not yet placed in any page spec.

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
