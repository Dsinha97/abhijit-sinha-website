# Abhijit Sinha Website

Static site for Abhijit Sinha, an AMFI-registered Mutual Fund Distributor (ARN-367596), built with Astro + Tailwind CSS.

## Development

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # typecheck + production build to dist/
npm run preview   # serve the production build locally
npm run check     # astro check only
```

Copy `.env.example` to `.env` and set `PUBLIC_FORM_ENDPOINT` (a Web3Forms/Formspree-style endpoint) to enable the contact and service-request forms locally.

## Where content lives

- [`docs/wiki/`](docs/wiki/) — the authoritative reference for every page's content, the design system, and compliance rules. Start here.
- `docs/sources/` — original raw design specs (provenance only, not edited).
- `Images/` — site image assets, copied into `public/images/`.
- `Important Docs/` — **sensitive**, never committed. See [CLAUDE.md](CLAUDE.md).

See [CLAUDE.md](CLAUDE.md) for architecture and compliance rules future contributors (human or AI) need before editing this repo.

## Configuration you'll likely need to change

- **Scheduler** (`/schedule` page): edit `scheduler` in [`src/data/site.ts`](src/data/site.ts) — set `provider` to `'cal'`, `'calendly'`, or `'google'` and `url` to your booking page's embeddable URL once an account exists. Ships as a contact-card placeholder until then.
- **Contact forms**: set `PUBLIC_FORM_ENDPOINT` (local `.env`, and as a `PUBLIC_FORM_ENDPOINT` repository secret for the deploy workflow).
- **Regulatory/contact details, commission table, RTA links**: all in `src/data/site.ts` — this is the single source of truth, don't hardcode these elsewhere.

## Deploy

Pushing to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds with Astro and publishes via GitHub Pages. In the repo's Settings → Pages, set **Source: GitHub Actions**.

The site currently ships to the default project URL `https://dsinha97.github.io/abhijit-sinha-website/` — no DNS changes needed. The custom domain `abhijitsinha.in` is registered at GoDaddy but not yet pointed here; see [docs/wiki/deployment-domain.md](docs/wiki/deployment-domain.md) for the deferred cutover plan (GitHub Pages custom domain vs. moving to Cloudflare Pages) before touching `SITE_URL`/`BASE_PATH`.
