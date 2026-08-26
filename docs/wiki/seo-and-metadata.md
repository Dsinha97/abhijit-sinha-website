# SEO & Metadata

Source: [seo-tools.md](../sources/seo-tools.md).

## Sitemap & robots

`@astrojs/sitemap` integration, configured with `site: 'https://abhijitsinha.in'` in the source spec. Note: the actual first deployment target is a GitHub Pages project sub-path, not the bare custom domain — see the project's `CLAUDE.md` and `docs/wiki/deployment-domain.md` for the real `site`/`base` values in effect. `public/robots.txt` allows all crawlers and points to `/sitemap-index.xml`.

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
