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

### The corollary: a link is not a subresource

The Google Business Profile work of 2026-09-06 added Google links to the footer,
the homepage and `/schedule` and required **no CSP change at all**, which is
worth recording so the absence does not read as an oversight. The directions,
profile and write-review URLs are ordinary top-level navigations; CSP governs
subresources and form targets, and `form-action` applies to forms rather than
links, so nothing in the policy touches them.

That stops being true the moment anyone embeds a map. A Google Maps iframe needs
`frame-src https://www.google.com`; a static map image or Street View thumbnail
needs an `img-src` host (the policy allows no remote image host whatsoever); and
the Maps JS API needs `script-src https://maps.googleapis.com`, which the plain
`/maps/embed` iframe avoids. `Permissions-Policy: geolocation=()` would also
block a "find my location" control, though not a static embed. The site links
out instead — see [contact-channels](contact-channels.md) for why that also
keeps the Privacy Policy §5.4 promise intact.

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

Nothing from the 2026-09-03 pass. The `leads` row id 5 test record flagged in
[data-model.md](data-model.md) has also since been deleted (verified
2026-09-03: the table holds four rows, all genuine sign-off submissions).

For what the 2026-09-06 supply-chain and governance pass left open, see the end
of that section below.

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

---

# Supply chain and repo governance (2026-09-06)

The 2026-09-03 pass above was about **secrets and headers**, and it closed those
out. It never looked at the supply chain, at who can change `main`, or at the
origin allowlist on the edge functions. This section covers that second pass.

The credential position still holds, re-verified independently: no credential is
committed and none ever was, on any ref. `Important Docs/` and `.env` are
correctly ignored and were never tracked. Every credential in the tree is a
`Deno.env.get()` or `import.meta.env` read.

## `.gitignore` now fails safe

The environment rule was `.env`, `.env.local`, `.env.*.local` — a list of
variants, which meant `.env.production` or `.env.backup` would have been
committed without complaint. It is now `.env*` with `!.env.example`: deny
everything, re-allow the one file that is meant to be tracked. On a public repo
the pattern has to fail safe rather than depend on someone naming a file
predictably.

Also added: `.vercel` (the CLI writes org and project IDs into
`.vercel/project.json` on the first `vercel link`), a `*.pem` / `*.key` /
`*.p12` / `*.pfx` / `id_rsa*` backstop, `.idea/`, `*.log`, and
`.claude/settings.local.json`.

## GitHub settings

| Setting | Before | After |
| --- | --- | --- |
| Branch protection on `main` | none at all | PR required, 0 approvals, force-push and deletion blocked |
| Dependabot alerts | disabled | enabled |
| Dependabot security updates | disabled | enabled (security fixes only — no `dependabot.yml`, so no routine version-bump PRs) |
| Code scanning | none | CodeQL **default setup** |
| Actions | any action from anywhere | GitHub-owned actions only |
| GitHub Wiki | enabled, unused | disabled |
| `delete_branch_on_merge` | false | true |

**Why 0 required approvals.** A solo maintainer cannot approve their own pull
request, so any non-zero count would deadlock the repo permanently. Zero still
buys the thing that matters: every change gets a PR, a diff, a preview
deployment and a record. Admin bypass is left **on** deliberately — a statutory
correction on a regulated site should never be blocked behind process.

**Why CodeQL default setup and not a workflow file.** `CLAUDE.md` says not to
reintroduce a GitHub Actions workflow, for a good reason (a workflow that
publishes creates a second live copy of a regulated-content site). Default setup
runs scanning from repo settings with no workflow file committed, so the rule
stands as written and the scanning still happens. Actions is restricted to
GitHub-owned actions rather than disabled, because default setup needs to run
`github/codeql-action`.

**GitHub Pages was still enabled.** The Pages *workflow file* was deleted long
ago, but the Pages **site** was never removed — `build_type: workflow`, source
`main` `/`. It serves 404 today only because nothing publishes to it. That is
config, not safety: any future Pages upload would stand up a second indexable
copy of the site at `dsinha97.github.io/abhijit-sinha-website/`, which is
precisely what `CLAUDE.md` forbids. **Delete the Pages site in repo Settings →
Pages.** Deleting it via the API was blocked as a destructive action.

## Dependencies: assessed, not blindly upgraded

`npm audit` wants `astro@7.3.1` — a **two-major** jump from 5.18.2 — to clear
eight Astro advisories plus one in `esbuild`. Every one was checked against what
this site actually does, and **none are reachable**:

| Advisory | Why it cannot fire here |
| --- | --- |
| XSS via `define:vars` | No `define:vars` anywhere in `src/` |
| Server island encrypted-parameter replay | No `server:defer`; there are no server islands |
| XSS via unescaped attribute names in spread props (×2) | **No spread props at all** in any template |
| XSS via `transition:*` on hydrated islands | No `transition:*`, no `<ClientRouter>` / `<ViewTransitions>` |
| Reflected XSS via View Transition animation props | Same — View Transitions are not used |
| Reflected XSS via unescaped slot name | No dynamic `slot={…}` |
| Host-header SSRF in prerendered error page | Static output, no adapter — there is no server to send a Host header to |
| `esbuild` arbitrary file read on Windows | Dev server only; needs an attacker able to reach `localhost:4321` |

So the major upgrade would buy **zero** reduction in visitor-facing risk, at
real regression cost on a live regulated site. It is deliberately not being
done.

**These are the conditions that would change that answer.** Adding any one of
them makes an accepted risk live, and the upgrade becomes required:

- adding `<ClientRouter />` / View Transitions
- using a dynamic `slot={…}` name
- using spread props (`{...attrs}`) on an element
- adding `define:vars` to a `<script>` or `<style>`
- adding an SSR adapter, or any `server:defer` island

`sharp` was a different case and **was** fixed. Its four libvips CVEs were the
only HIGH findings, and although they are equally unreachable — the site uses no
`astro:assets`, `<Image>`, `<Picture>`, `getImage` or `image()`, so libvips
never parses anything during a build — an `overrides` entry pinning
`sharp@^0.35.4` clears them outright. Worth doing precisely because it is
risk-free here: it keeps `npm audit` quiet so a genuine future alert stands out
instead of arriving into a list that is already red. Verified by a clean
`astro check` and `npm run build`.

One side effect: `sharp@0.35.4` declares `node >=22.19.0`, so `npm install`
prints an `EBADENGINE` warning on Node 22.14. It is a warning, not an error —
there is no `.npmrc` and so no `engine-strict` — and sharp is never loaded
anyway.

Separately, `package.json` had **no `devDependencies` block at all**: 430 prod
dependencies, 0 dev, with the typechecker and the CSS toolchain shipping as
production deps. `@astrojs/check`, `typescript`, `tailwindcss` and
`@tailwindcss/typography` moved to `devDependencies`, which is what they are.

## The edge-function origin allowlist was open to anyone

All three in-repo functions shared this:

```
const VERCEL_PREVIEW = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;
```

That matches **every `vercel.app` subdomain in existence**, not just this
project's. Anyone could deploy a page at `evil-thing.vercel.app` and pass the
origin check on `track` and `verify-lead`. On `publish-site` the server-side
`admin_allowlist` re-check still stopped them, so the real exposure was the
analytics and lead endpoints.

It mattered more than it looks, because `verify-lead` **forwards unverified when
`TURNSTILE_SECRET_KEY` is unset**. That fail-open is deliberate and stays — an
unconfigured secret must never take the site's only lead channel offline — but
in that state this regex was the only barrier left standing.

Now anchored to the project:

```
const VERCEL_PREVIEW = /^https:\/\/abhijit-sinha-website-[a-z0-9-]+\.vercel\.app$/;
```

which still admits both real preview forms (`-<hash>-<scope>` and
`-git-<branch>-<scope>`) and shuts out everybody else's. It drops the bare
`abhijit-sinha-website.vercel.app` alias, which is correct: that hostname 308s
to the apex and serves no page, so nothing has it as an origin.

`track`, `verify-lead` and `publish-site` are redeployed with `--no-verify-jwt`.
**`submit-lead` is not touched** — its source is not in this repo and it is the
only working lead path; `verify-lead` calls it server-to-server, so its own CORS
is not in the browser path and needs no change.

`publish-site`'s `corsFor` returns a literal `'null'` origin where the other two
return `null` and 403. That is safe (`'null'` matches no real browser origin,
and CORS is not the authorisation boundary there) and it was left as-is rather
than restructuring a live function for symmetry — but it now carries a comment
saying so, which is the actual fix for "three copies that have drifted".

## The database schema is now in version control

`supabase/migrations/` was empty. The RLS policies and `is_admin()` are not one
layer of the admin panel's protection — they **are** the protection, because the
site is static and has no server to enforce anything. That boundary lived only
in the Supabase dashboard: no diff, no review trail, and no way to notice a
policy being dropped or widened.

`supabase/schema.sql` is now a committed snapshot of the public schema: ten
tables, their CHECK constraints, fourteen functions, eleven triggers, every RLS
policy, and the `retention-purges` cron job. No data — no leads, no analytics
rows, and none of the addresses in `admin_allowlist`.

**It is deliberately not in `supabase/migrations/`.** A file there is something
`supabase db push` will try to execute against the live database, which is the
opposite of what a reference snapshot should invite. The live database stays the
source of truth; this file follows it, and exists to be read and diffed.

Two absences in it are load-bearing and worth knowing before anyone "fixes"
them: `leads` has **no INSERT policy**, so nothing but the `submit-lead`
service_role key can write a lead; and `analytics_salt` has RLS enabled with
**no policies at all**, so nothing reachable through the API can read the salt
that makes `session_hash` irreversible.

## Governance files

`SECURITY.md` (a private reporting route — the repo previously had none, so a
finder's only channel was a public issue) and `LICENSE` (explicitly proprietary,
not open source; the statutory disclosures in this repo are specific to this ARN
and must not be reused by another distributor). No `CODEOWNERS` — pointless with
one maintainer.

## Still open from this pass

- **Delete the GitHub Pages site** in Settings → Pages (see above). This is the
  only finding here with a real compliance edge.
- **Turn on Vercel Deployment Protection for the Preview environment.**
  Requiring PRs means every PR now builds a public preview of a
  regulated-content site. Vercel adds `X-Robots-Tag: noindex` to previews
  automatically, but authentication on previews is the durable answer, and it is
  a dashboard setting.
- **Secret scanning validity checks and non-provider patterns** would not enable
  via the API — the `PATCH` returns 200 and the values stay `disabled`, which
  usually means the feature is not offered on this repo's plan. Worth a look in
  Settings → Code security.

## What CodeQL found on its first run

One alert, rated high: `js/incomplete-url-substring-sanitization` at
`src/scripts/analytics.ts:98` — `href.includes('wa.me')`.

It is worth recording both halves of the verdict, because they point in
opposite directions and both are true.

**It was not a vulnerability here.** `classify()` picks an analytics label; it
does not authorise, navigate, or sanitise. CodeQL rates the pattern high
because it is dangerous *when used as a security check*, which is not what this
is. Taking the severity at face value would have been wrong.

**It was still a real bug.** `href.includes('wa.me')` matches
`https://example.com/?ref=wa.me`, so an ordinary outbound link could be counted
as a WhatsApp click. Parsing the URL and comparing the host fixes the alert and
the miscount together, and real WhatsApp clicks were never affected either way
(the floating button carries `data-track="whatsapp"` and is matched by the
explicit branch first).

The general lesson for future alerts on this repo: **read the finding, not the
severity.** A static analyser cannot know that a function is a labeller rather
than a gate — but it was right that the line was wrong, and the fix was three
lines. Verified: zero open code-scanning alerts on `main` afterwards.

See [data-model](data-model.md) for what this changes about `link_kind`.
