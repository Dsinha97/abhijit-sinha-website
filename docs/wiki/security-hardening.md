# Security hardening

What was audited on 2026-09-03, what shipped, and the rules that keep it true.
Companion pages: [admin-dashboard.md](admin-dashboard.md) (auth and RLS),
[legal-copy.md](legal-copy.md) (what the Privacy Policy actually discloses),
[contact-channels.md](contact-channels.md) (the lead-form bot gate),
[data-model.md](data-model.md) (tables, retention, edge functions),
[deployment-domain.md](deployment-domain.md) (DNS, Vercel env vars).

## The audit

The repository is public. The question was what that actually exposes.

**No credential is committed, and none ever was.** Scans for `service_role`,
JWT-shaped strings, `sb_secret_`, `sbp_`, `gh[pousr]_`, `AIza`, `sk-` and
`key/secret/token = "…"` across the whole tree found only:

- `sb_publishable_*` and the project URL, which are public by design — the
  publishable key grants exactly what Row Level Security allows.
- Prose mentions of `service_role` in `CLAUDE.md` and the wiki, every one of
  them a prohibition.
- `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` in the two edge functions, which
  is where it belongs.

So the exposure was never credentials. It was two things:

1. **No security headers at all.** No `vercel.json` existed, so the site shipped
   Vercel's defaults: no CSP, no HSTS declaration, no `Referrer-Policy`, and no
   clickjacking protection on `/admin`.
2. **`.env` and `.env.example` were byte-identical.** The tracked "template" was
   functioning as the live config file. Nothing secret was in it, but the habit
   it encodes — "add the value to `.env.example` too" — is exactly how a
   `service_role` key ends up in a public repo one day.

Both are fixed. `.env.example` is now placeholders only, and says so at the top.

## Headers (`vercel.json`)

| Header | Value | Why |
| --- | --- | --- |
| `Content-Security-Policy` | see below | The one that does real work |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Two years, subdomains included |
| `X-Content-Type-Options` | `nosniff` | No MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | The `track` function reads `document.referrer`; this keeps paths off other people's logs |
| `X-Frame-Options` | `DENY` | Legacy partner to `frame-ancestors 'none'` — matters for `/admin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=(), payment=(), usb=()` | The site needs none of them |
| `Cross-Origin-Opener-Policy` | `same-origin` | Severs `window.opener` from anything we open |

`vercel.json` is JSON and cannot hold comments, which is why the reasoning lives
here.

### The CSP, host by host

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none';
form-action 'self' https://<project>.supabase.co;
script-src 'self' https://challenges.cloudflare.com;
style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:;
connect-src 'self' https://<project>.supabase.co https://challenges.cloudflare.com;
frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com https://calendly.com;
upgrade-insecure-requests
```

- **`challenges.cloudflare.com`** — Turnstile's script, its challenge iframe, and
  its own fetches. All three directives are needed; drop one and the widget
  fails in a way that looks like a broken form.
- **`<project>.supabase.co`** in `connect-src` — the `verify-lead` and `track`
  fetches, plus everything `/admin` does.
- **`<project>.supabase.co`** in `form-action` — not redundant. `ContactForm`
  keeps a native `action="…"` so the form still submits with JavaScript
  disabled, and `form-action` governs that path.
- **`www.youtube-nocookie.com`** — the click-to-load video facade in
  `VideoCard.astro`. Nothing is requested before the click.
- **`calendly.com`** — the click-to-load booking iframe in `SchedulerEmbed.astro`.
- **`font-src 'self'`** is safe because there are no web fonts: `global.css` has
  no `@import` and no `@font-face`, and the design system uses a system stack.
- **`style-src` keeps `'unsafe-inline'`** — Astro emits inline `<style>` for
  component styles. Inline *style* is a far smaller risk than inline *script*,
  and removing it would mean fighting the framework for little gain.
- **The Supabase host is hardcoded here.** Like `public/robots.txt`'s `Sitemap:`
  line, it is not env-driven. Edit it by hand if the project or domain changes.

### `assetsInlineLimit: 0` is load-bearing

`script-src 'self'` with no `'unsafe-inline'` is the whole point of the CSP, and
it initially failed: Astro inlines bundled `<script>` blocks under ~4KB straight
into the HTML, and four of ours qualified. A report-only walk-through of every
route showed five inline-script violations per page.

The three ways out were `'unsafe-inline'` (throws away the CSP's main reason for
existing), per-script `sha256` hashes (go stale silently the next time anyone
edits a script), or making Astro emit every script as a real file. The third is
`vite.build.assetsInlineLimit: 0` in `astro.config.mjs`. Cost: a handful of
small extra requests over HTTP/2. **Do not remove it** without also solving the
CSP, or every page will start violating its own policy.

After the change, the only inline `<script>` left anywhere in `dist/` is the
`application/ld+json` block in `SEO.astro`, which browsers do not treat as
executable script and which raised no violation.

### Verifying a CSP change before it ships

Vercel headers do not apply to `astro dev` or `astro preview`, so a CSP cannot be
tested by running the dev server. What was used here, and what to repeat:

1. `npm run build`.
2. Serve `dist/` from a throwaway Node script that reads `vercel.json` and sends
   the same headers, but renames `Content-Security-Policy` to
   `Content-Security-Policy-Report-Only` (and drops HSTS, which would poison
   `localhost` for other work).
3. Walk every route with the console open. Report-only logs each violation and
   breaks nothing.
4. Fix the *directive* for each legitimate violation — or the build, as with
   `assetsInlineLimit` — then re-walk and ship enforcing.

Two notes on report-only output: `upgrade-insecure-requests` logs "ignored when
delivered in a report-only policy" every time, which is expected and disappears
when enforced; and the console buffer is cumulative across navigations, so
grepping the built HTML for `<script>` tags is a more reliable check than
re-reading the console.

**The maintenance rule: adding any third-party script, iframe, image host or
fetch target requires a matching CSP edit in `vercel.json`.** Under an enforcing
CSP the failure mode is silent — the resource simply never loads — so this is
not something to discover in production.

## Standing rules

- `.env.example` is a template. Every value in it is a placeholder, including
  the ones that are public by design. It must never be a copy of `.env`.
- The `service_role` key lives only in Supabase edge-function secrets. Never in
  `src/`, `public/`, `.env`, or the Vercel env vars.
- GitHub secret scanning and push protection are enabled on the repository, so a
  future paste is blocked at push time rather than found afterwards.
- The compliance-locked identifiers (ARN, EUIN, NISM, office, phone, email) stay
  hardcoded in `src/data/site.ts` and are deliberately absent from
  `site_content` and the `/admin` UI. Editability is an attack surface.

## GitHub repository settings

**Secret Protection** and **Push protection** are both enabled (confirmed
2026-09-03). Note the naming: GitHub now labels secret scanning "Secret
Protection" under repo Settings → Advanced Security, so searching the settings
for "secret scanning" finds nothing. Push protection is the one that matters
most here — it blocks a commit containing a recognised secret at push time
rather than alerting after it is already public and needs rotating.

## Still open

Nothing from this pass. The `leads` row id 5 test record flagged in
[data-model.md](data-model.md) has also since been deleted (verified
2026-09-03: the table holds four rows, all genuine sign-off submissions).

## Vercel env var types

`PUBLIC_*` variables must be created as **Config**, not **Secret**. Astro inlines
every `PUBLIC_`-prefixed value into the client bundle, so marking one Secret
hides nothing from a visitor — it only makes the value write-only in the Vercel
dashboard, so it can never be read back or diffed. Vercel flags this itself
("Remove the public framework prefix to keep this value private").

The trap: a variable already saved as Secret **cannot be converted** to Config.
It has to be deleted and re-created. `PUBLIC_FORM_ENDPOINT`,
`PUBLIC_TURNSTILE_SITE_KEY`, `PUBLIC_SUPABASE_URL` and
`PUBLIC_SUPABASE_ANON_KEY` are all Config by design.

Preview deployments get a fresh `*.vercel.app` hostname per deploy, which is not
in the Turnstile widget's hostname list — so the widget errors there, no token
is issued, and `verify-lead` rejects the submit. **Test forms on production**,
or add the specific preview hostname in Cloudflare.
