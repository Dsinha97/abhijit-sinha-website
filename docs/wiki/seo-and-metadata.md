# SEO & Metadata

Source: [seo-tools.md](../sources/seo-tools.md).

## Sitemap & robots

`@astrojs/sitemap` integration. `site` is `https://abhijitsinha.in` and `base` is the domain root, matching the source spec — the site is served from the root on Vercel, so sitemap and canonical URLs need no sub-path allowance. Both values are env-overridable; see [deployment-domain](deployment-domain.md). `public/robots.txt` allows all crawlers and points to `/sitemap-index.xml`; its `Sitemap:` line is the one hardcoded absolute URL in the repo and must be edited by hand if the domain ever changes.

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
