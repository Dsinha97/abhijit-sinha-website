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

Copy `.env.example` to `.env` and set `PUBLIC_FORM_ENDPOINT` (the Supabase `submit-lead` edge function, which stores the submission in the `leads` table and sends the notification email server-side) to enable the contact and service-request forms locally.

## Where content lives

- [`docs/wiki/`](docs/wiki/) — the authoritative reference for every page's content, the design system, and compliance rules. Start here.
- `docs/sources/` — original raw design specs (provenance only, not edited).
- `Images/` — site image assets, copied into `public/images/`.
- `Important Docs/` — **sensitive**, never committed. See [CLAUDE.md](CLAUDE.md).

See [CLAUDE.md](CLAUDE.md) for architecture and compliance rules future contributors (human or AI) need before editing this repo.

## Configuration you'll likely need to change

- **Scheduler** (`/schedule` page): edit `scheduler` in [`src/data/site.ts`](src/data/site.ts) — set `provider` to `'cal'`, `'calendly'`, or `'google'` and `url` to your booking page's embeddable URL once an account exists. Ships as a contact-card placeholder until then.
- **Contact forms**: set `PUBLIC_FORM_ENDPOINT` (local `.env`, and as a Vercel environment variable for deployed builds).
- **Regulatory/contact details, commission table, RTA links**: all in `src/data/site.ts` — this is the single source of truth, don't hardcode these elsewhere.

## Deploy

Pushing to `main` triggers a **Vercel** build and deploy (static Astro output, no adapter). The site is served from the domain root, currently at `https://abhijit-sinha-website.vercel.app`. The custom domain `abhijitsinha.in` is registered at **GoDaddy** and still parked; the cutover is deferred until the content is ready. Search indexing is disabled until then.

Build-time environment variables (`PUBLIC_FORM_ENDPOINT`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SITE_URL`) live in the Vercel project settings. See [docs/wiki/deployment-domain.md](docs/wiki/deployment-domain.md) for the step-by-step domain cutover runbook, the GoDaddy DNS records, and what not to touch before changing `SITE_URL`/`BASE_PATH`.
