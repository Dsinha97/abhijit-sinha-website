# Deployment & Domain (Phase 5 — deferred)

This is a deliberately deferred decision, not a forgotten one. The site currently deploys to the default GitHub Pages project URL, `https://dsinha97.github.io/abhijit-sinha-website/`, with no custom domain attached.

## Current state

- Domain `abhijitsinha.in` is registered at **GoDaddy**. No DNS records point at this deployment.
- `astro.config.mjs` reads `SITE_URL` and `BASE_PATH` from the environment, defaulting to the GitHub Pages sub-path values (`https://dsinha97.github.io` / `/abhijit-sinha-website`) when unset.
- `.github/workflows/deploy.yml` passes both through as optional repo variables (`vars.SITE_URL`, `vars.BASE_PATH`), currently unset, so the build uses the sub-path defaults.
- `public/robots.txt` hardcodes the sub-path sitemap URL — this needs a manual edit alongside any domain change, it's not env-driven.
- No `public/CNAME` file exists. Adding one while still serving from the sub-path is a GitHub Pages misconfiguration.

## Two paths for the custom-domain cutover (evaluate later, don't build yet)

**Option A — Keep GitHub Pages, point GoDaddy DNS at it**
1. At GoDaddy: add `A` records for `abhijitsinha.in` to GitHub Pages' IPs, plus a `CNAME` record for `www` → `dsinha97.github.io`.
2. Add back `public/CNAME` containing `abhijitsinha.in`.
3. Set repo variables `SITE_URL=https://abhijitsinha.in` and `BASE_PATH=` (empty) so Astro builds without a sub-path.
4. In GitHub repo Settings → Pages, set the custom domain and enable "Enforce HTTPS".
5. Update `public/robots.txt`'s sitemap URL to match.

**Option B — Move to Cloudflare**
1. Either keep DNS at GoDaddy and just add Cloudflare Pages as a second deploy target reading the domain via a Cloudflare-side custom domain, or transfer/point nameservers for `abhijitsinha.in` to Cloudflare entirely (more control, free SSL/CDN, faster in India).
2. Connect the GitHub repo to Cloudflare Pages (auto-builds on push, replacing or running alongside the current GitHub Actions workflow).
3. Same `SITE_URL`/`BASE_PATH` env-var change as Option A — Cloudflare Pages serves from the domain root too.

Both options are one-time config changes because the codebase never hardcodes a domain-relative path (see `src/lib/url.ts` and `CLAUDE.md`). Neither requires touching component or page templates.

## What NOT to do prematurely

- Don't add `public/CNAME` before DNS is actually pointed here — it silently breaks the currently-working Pages sub-path deployment.
- Don't hardcode `abhijitsinha.in` anywhere outside `astro.config.mjs`'s env-driven defaults and `robots.txt`.

Related: [site-architecture](site-architecture.md) · [seo-and-metadata](seo-and-metadata.md)
