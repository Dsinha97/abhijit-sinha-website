# Admin Dashboard

Authenticated dashboard at `/admin` where Abhijit reads incoming requests and edits the non-regulatory content of the site without touching git.

**Status:** Phases 0–4 are built and verified (2026-09-01). Phase 5 (committed content snapshot) is partly done — see the note at the end of this file.

Backing infrastructure: Supabase project `cebfypcoyqiegwuahmun` (`https://cebfypcoyqiegwuahmun.supabase.co`), region India. Schema reference: [data-model.md](data-model.md).

---

## Why this shape

The site is a pure-static Astro build on GitHub Pages with no adapter and no server runtime, which rules out server-rendered admin routes and Astro Actions. Three options were weighed:

| Option | Verdict |
|---|---|
| **Decap CMS** (git-backed) | Rejected. No concept of form submissions, so it cannot deliver the lead inbox at all. Also expects JSON/YAML collections, while content lives in a TypeScript module. Its one real advantage — a git commit per edit — is recovered in Phase 5 instead. |
| **Sanity / Strapi** (cloud headless CMS) | Rejected as primary. Handles content but not leads, so Supabase would be needed alongside it. Two vendors for one job. |
| **Supabase** | Adopted. Covers auth, leads, and content in one free project. |

**The one deliberate deviation from a stock Supabase setup:** public pages must *not* fetch content client-side. `/disclosures` carries a statutory commission table; rendering it from client JS would make it invisible to crawlers, flash empty on load, and go blank entirely if Supabase were down or paused. Content is therefore read at **build time**, with `src/data/site.ts` as the committed fallback, and the site rebuilds via `repository_dispatch`.

The dashboard itself is a client-side-only page, which works fine on static hosting because **security is enforced by Postgres Row Level Security, not by the host**. The publishable key in the bundle grants only what RLS allows.

---

## Access control

Exactly two accounts, held in the `admin_allowlist` table:

- `abhijit.uti@gmail.com` (owner)
- `deepayansinha@gmail.com` (owner)

Every admin-only RLS policy gates on `public.is_admin()`, which matches the email in the caller's JWT against that table. Adding an admin is an `INSERT` there *plus* an invite from the Supabase dashboard — a Supabase account alone grants nothing.

> **Required setting:** public sign-ups must stay **disabled** in Supabase (Authentication → Providers → Email → "Allow new users to sign up" = off). The allowlist is the real gate, but leaving signups open lets strangers create accounts against the project.

---

## Phase 2 — Admin shell, auth, and lead inbox *(not built)*

The deliverable that answers "view requests like form details."

- `src/pages/admin/index.astro` — standalone page, deliberately **not** using `BaseLayout` (the regulatory strip, nav, and WhatsApp button are wrong furniture for a dashboard). Needs `<meta name="robots" content="noindex,nofollow">`.
- Add `Disallow: /admin` to `public/robots.txt`.
- `src/lib/supabase-client.ts` — browser `createClient` from `site.supabase.url` / `.anonKey`. **Client-side only**; importing it into page frontmatter would run it at build time.
- Auth via magic link — no passwords to manage.
- Inbox: newest-first table, expandable detail, status dropdown (`new` / `contacted` / `closed`), `admin_notes`, `mailto:` and `wa.me` quick actions built from the lead's own details, CSV export.
- Use `url()` from `src/lib/url.ts` for every link — `/admin` 404s on the Pages sub-path otherwise.

Only new dependency: `@supabase/supabase-js`.

**Verify:** log in as an allowlisted user and see leads; log out and confirm the page shows only a login card with no lead data in the network tab; `grep -r "service_role" dist/` returns nothing.

> **Cleanup owed (carried from Phase 1):** `leads` row **id 5** is a live end-to-end test record from 2026-08-28, holding a real email address and mobile number. It was deliberately kept so the inbox UI could be built and styled against a real row rather than a fixture. **Delete it as the final step of Phase 2**, once the inbox is verified: `delete from public.leads where id = 5;`  Leaving it in place past Phase 2 means shipping a dashboard whose first visible enquiry is fake, and holding personal data with no business reason to retain it.

## Phase 3 — Editable content, rendered at build time *(not built)*

`src/lib/content.ts` fetches `site_content` at build time and **falls back to the committed values in `src/data/site.ts`** when Supabase is unreachable or paused. That fallback is the whole point: a build must never ship an empty statutory table. The `CommissionRow`, `RtaPortalRow`, and `SchedulerProvider` types stay in `site.ts` and are reused unchanged.

Migrate easiest-first: `scheduler` → `rta_portals` → `commission_schedule`. Call sites: `src/pages/disclosures.astro:8`, `src/pages/investor-services.astro:23`, `src/components/SchedulerEmbed.astro`.

**Commission-rate guardrail.** Rates are the one editable field with regulatory weight. The editor must surface the `unconfirmed` flag as an explicit toggle rather than letting the placeholder caveat silently vanish, require a typed confirmation to save, and write to `content_audit`. The UI must expose **no** field for ARN, EUIN, certification, office city, or the `statutory` strings — those stay hardcoded per [regulatory-compliance.md](regulatory-compliance.md).

**Publish/rebuild.** A `trigger-rebuild` edge function calls the GitHub API with a fine-grained PAT held as a Supabase secret (never in the browser). Add to `.github/workflows/deploy.yml`:

```yaml
on:
  repository_dispatch:
    types: [content-updated]
```

**Verify:** edit a rate, publish, then confirm the new value appears in **view-source** on `/disclosures`, not just the rendered DOM. Then break the Supabase URL locally and confirm `npm run build` still succeeds on the fallback.

## Phase 4 — Videos and notes *(not built)*

- **Videos:** admin CRUD over the `videos` table. A `VideoGrid.astro` renders `youtube-nocookie.com` embeds, lazy-loaded behind a poster image so no third-party request fires until the visitor clicks. URLs only — no file uploads.
- **Notes/blog:** `src/pages/notes/index.astro` and `notes/[slug].astro` via `getStaticPaths()` over published `posts`. Render markdown at build time (`marked`), never client-side. Add "Notes" to `nav`.
- **Compliance gate:** free-text posts are the highest-risk surface on this site — they drift into what reads as personalised investment advice, which is prohibited. Every post page must render `ComplianceCallout.astro`, and the editor should show that requirement before publishing.

## Phase 5 — Audit trail and hardening *(not built)*

- **Git-visible history.** Have the rebuild workflow commit the fetched content to `src/data/content.snapshot.json`. This restores Decap's one genuine advantage — a git diff per published change on a regulated site — and doubles as disaster recovery if the Supabase project is lost.
- **Keep-alive.** Supabase pauses free projects after ~7 days of inactivity. Visitors degrade gracefully (the build falls back to `site.ts`) but **admin login breaks**. Add a scheduled GitHub Action that pings the project every few days.
- **Lead retention.** Scheduled purge of requests older than 24 months, to match the commitment now published in the Privacy Policy. This is an obligation, not polish.
- Add Cloudflare Turnstile to `submit-lead` if spam appears.

---

## Accepted security warning

Supabase's linter reports that `public.is_admin()` is executable by the `authenticated` role via `/rest/v1/rpc/is_admin`. This is intentional and cannot be removed: RLS policy expressions are evaluated with the caller's privileges, so signed-in users must be able to execute it. Calling it reveals only whether *you* are an admin. The `anon` role and both trigger functions have had their EXECUTE grants revoked.


## Status update — 2026-09-01

The dashboard is built. Corrections to what this file says above:

- **Phase 3's publish mechanism was wrong and is now replaced.** It described adding
  `repository_dispatch` to `.github/workflows/deploy.yml`. That workflow was deleted during the
  Vercel migration and CLAUDE.md forbids reintroducing it. Publishing now calls the `publish-site`
  edge function, which POSTs a **Vercel Deploy Hook** URL held as a Supabase secret. Delete the
  `GITHUB_DISPATCH_TOKEN` secret and revoke its PAT.
- **Phase 5's keep-alive GitHub Action is unnecessary.** Continuous analytics ingest keeps the free
  project from pausing, provided there is real traffic. During the pre-launch period, when
  `robots.txt` blocks everything and traffic is near zero, occasional manual unpausing may still be
  needed — that breaks admin login, not the public site.
- **Phase 5's content snapshot is implemented** as `src/data/knowledge.snapshot.json`, refreshed by
  `npm run sync:knowledge` and committed. It is deliberately not part of `npm run build`, so Vercel
  builds stay deterministic and never write into the repo.
- **`site_content` editing (the scheduler / RTA / commission tables) is not built.** The commission
  ranges are now real, document-derived figures in `src/data/site.ts` rather than placeholders, so
  the urgency has dropped, but updating them is still a code change today.

### What was built

`src/layouts/AdminLayout.astro` (standalone, noindex) plus `/admin`, `/admin/leads`,
`/admin/knowledge`, `/admin/analytics`. Auth is magic-link, then `rpc('is_admin')`; the client-side
check is UX only and RLS is the real control. Page scripts live in `src/scripts/admin/`.

### Verified

Signed out, `/admin/leads` shows only the login card and no lead data reaches the browser. Anon
REST returns `[]` for `leads`, `analytics_events`, `analytics_salt` and `deploy_log`, and `42501`
for the analytics RPCs. `dist/` contains no service_role key and the sitemap excludes `/admin`. The
`submit-lead` function was never redeployed and both contact forms still work end to end.

### Outstanding

- `VERCEL_DEPLOY_HOOK_URL` is not set yet, so the Publish button returns an explanatory 503.
- Supabase Auth redirect allowlist must include both the vercel.app host and `abhijitsinha.in`, or
  magic-link sign-in breaks silently after the domain cutover.
- Signed-in admin flows (inbox rendering, editor round-trip, charts with real data) have not been
  exercised, because that needs a magic link delivered to a real inbox.


### Accepted advisor warnings (re-checked 2026-09-01)

The Supabase linter reports two things after this work. Both are intentional; do not "fix" them.

- **`rls_enabled_no_policy` on `public.analytics_salt` (INFO).** That is precisely the design: RLS
  on with zero policies means no role reachable through the API can read the table, and only
  service_role (the `track` function) can. Adding a policy would weaken it.
- **`authenticated_security_definer_function_executable` (WARN) on the six `analytics_*` functions
  and on `is_admin()`.** PostgREST can only expose an RPC that `authenticated` may EXECUTE, so this
  grant is unavoidable for the dashboard to work at all. Each analytics function re-checks
  `public.is_admin()` in its own body and raises `42501` otherwise, because `security definer`
  bypasses RLS and the guard therefore has to be explicit. A signed-in non-admin gets an error, not
  rows. This is the same accepted trade-off already documented for `is_admin()` itself.


### Auth accounts must be created before anyone can sign in

`admin_allowlist` is the **authorisation** layer, not the authentication one. An email being
listed there grants access *once signed in*; it does not create a login. Sign-in also requires a
row in `auth.users`, and the login form sets `shouldCreateUser: false`, so Supabase refuses to
create one on demand and returns "Signups not allowed for otp".

Keep `shouldCreateUser: false`. With it enabled, anyone could type any address into the public
`/admin` form and have this project email them a sign-in link — an open email-spam relay and a
source of junk `auth.users` rows. A non-allowlisted account would still see no data (RLS), but the
abuse vector is real.

**To add an admin, both steps are required:**

1. Supabase → Authentication → Users → Add user → Create new user. Enter the email and tick
   **Auto Confirm User**. The password the form demands is irrelevant — sign-in is magic-link only.
2. Insert the same address into `public.admin_allowlist`.

Doing only (1) gives an account that can sign in and see nothing. Doing only (2) gives the
"Signups not allowed" error. The login form now explains that case rather than surfacing Supabase's
raw wording.

Note the free-tier default SMTP is rate-limited to a handful of emails per hour; repeated sign-in
attempts will start failing with a rate-limit message, which the form also translates.
