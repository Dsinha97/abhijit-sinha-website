# Data Model (Supabase)

Schema backing the [admin dashboard](admin-dashboard.md). Project `cebfypcoyqiegwuahmun`, region India.

Everything here is reached with the **publishable key**, which ships in the client bundle by design — Row Level Security is what protects the data. The **service_role key bypasses RLS entirely** and must never appear under `src/`, `public/`, or `.env`; it lives only in Supabase edge-function secrets.

## Tables

| Table | Purpose | Who can read | Who can write |
|---|---|---|---|
| `admin_allowlist` | The two permitted admin emails | admins | nobody via API (manual) |
| `leads` | Contact-form submissions | admins | **only** the `submit-lead` edge function |
| `site_content` | Editable content blocks, one row per key | anyone (build needs it) | admins |
| `videos` | YouTube/Vimeo links | anon: published only | admins |
| `posts` | Notes/blog entries | anon: published only | admins |
| `content_audit` | Append-only change log | admins | triggers only |

### `leads`

`id`, `created_at`, `form_name`, `source_page`, `name`, `email`, `mobile`, `investment_goal`, `mode`, `service_category`, `message`, `status` (`new`/`contacted`/`closed`), `admin_notes`, `updated_at`.

**There is deliberately no `folio` column.** Folio numbers are financial identifiers; collecting them through a web form would mean storing sensitive account data at rest under the DPDP Act for no operational gain. They are gathered over WhatsApp or phone once contact is established. Do not add one without a retention policy and a matching Privacy Policy disclosure.

**There is also no IP address column** — the rate limit keys on email instead, so no additional personal data is stored just to throttle spam.

The table has **no INSERT policy at all**. Writes arrive only through the `submit-lead` edge function using the service_role key, so the publishable key cannot write here even when extracted from the bundle. Verified: a direct anon `POST /rest/v1/leads` returns HTTP 401.

Retention: enquiries not leading to an ongoing engagement are deleted within 24 months, per the commitment published in `privacy-policy.astro` §5.1. The purge job itself is Phase 5.

**Outstanding:** row id 5 is a Phase 1 end-to-end test record containing a real email and mobile. Retained on purpose as sample data for building the Phase 2 inbox; delete it when Phase 2 is verified. See [admin-dashboard.md](admin-dashboard.md).

### `site_content`

`key` (PK), `value` (jsonb), `updated_at`, `updated_by`. Seeded from `src/data/site.ts` so database and committed fallback agree from day one.

Current keys: `commission_schedule`, `rta_portals`, `scheduler`.

`commission_schedule.value` is `{ unconfirmed: boolean, rows: CommissionRow[] }`. The `unconfirmed` flag carries the "placeholder, pending AMC empanelment" caveat that the source specs require; it is a real field so the caveat cannot be silently dropped by an edit.

**Compliance-locked values are deliberately absent from this table** — ARN, EUIN, NISM certification, office city, phone, email, and the `statutory` strings stay hardcoded in `src/data/site.ts` and are never editable through the dashboard.

## Functions

- `is_admin()` — `SECURITY DEFINER`, matches the JWT email against `admin_allowlist`. Every admin policy gates on it. EXECUTE granted to `authenticated` and `service_role` only.
- `log_content_change()` — audit trigger on `site_content`, `videos`, `posts`. Keys off `to_jsonb(NEW/OLD)` rather than record fields, because PL/pgSQL resolves `new.slug` against the actual row type and would fail on tables without that column.
- `touch_updated_at()` — maintains `updated_at`.

Both trigger functions have EXECUTE revoked from `public`, `anon`, and `authenticated`; triggers still fire, since the trigger mechanism does not check the caller's EXECUTE grant.

## Edge function: `submit-lead`

`POST https://cebfypcoyqiegwuahmun.supabase.co/functions/v1/submit-lead`

`verify_jwt` is **off** — site visitors are anonymous, so authorisation is not the control here. Protections are the honeypot, field validation, and a per-email rate limit (3/hour).

Accepts `multipart/form-data` (what `ContactForm.astro` sends) and JSON (so it is testable with curl). Returns `{ ok, message?, error? }`; `ContactForm.astro` surfaces `error` directly so validation problems tell the visitor what to fix.

CORS reflects the request origin **only when allowlisted** (both `abhijitsinha.in` forms, Vercel `*.vercel.app` preview deployments for this project, localhost), never an arbitrary one. Preview origins are matched by pattern rather than listed, because Vercel mints a new hostname per deployment. Override with the `ALLOWED_ORIGINS` secret.

A filled honeypot returns HTTP 200 and stores nothing — bots get no signal that they were caught.

### Secrets (set in the Supabase dashboard, not `.env`)

| Secret | Purpose | Status |
|---|---|---|
| `WEB3FORMS_ACCESS_KEY` | Email notification on each new lead | **Set.** Verified end to end 2026-08-28: lead stored + email delivered. Recipient is currently a test inbox; switch it to `abhijit.uti@gmail.com` in the Web3Forms form settings — the access key does not change, so no secret update or redeploy is needed. |
| `ALLOWED_ORIGINS` | Optional CORS override | Optional |
| `GITHUB_DISPATCH_TOKEN` | Phase 3 rebuild trigger | Phase 3 |

Web3Forms is used for the notification email rather than Resend because Resend requires verifying `abhijitsinha.in`, which was still parked at GoDaddy when this was built. The [domain cutover](deployment-domain.md) has since pointed the domain at Vercel, so Resend is now viable — it needs DKIM/SPF TXT records added at GoDaddy.


## Analytics and publishing tables (added 2026-09-01)

**`analytics_events`** — first-party, cookieless website measurement. Columns: `occurred_at`,
`event_type` (`pageview`|`click`), `path`, `ref_host`, `device`, `link_kind`, `link_label`,
`link_href`, `utm_source/medium/campaign`, `session_hash`.

Deliberately absent: **IP address, user-agent string, geolocation, screen resolution.** `device` is
bucketed from viewport width alone. `session_hash` is `sha256(salt, IST date, ip, ua)` truncated to
16 chars, computed inside the `track` function; the inputs are consumed and discarded, and the IST
date component rotates the hash daily so a visitor cannot be linked across days. This is the whole
DPDP argument: no personal data is collected, so there is nothing to consent to and no rights
request to service.

RLS mirrors `leads`: **no INSERT policy at all** (service_role only), admin SELECT/DELETE via
`is_admin()`. Verified: anon `POST /rest/v1/analytics_events` returns 401.

**`analytics_salt`** — single row holding the salt. RLS enabled with **zero policies**, so only
service_role can read it. Kept in the database rather than as an edge-function secret so there is no
manual setup step that could be skipped (a missing salt would silently weaken the hash) and so it
can be rotated without a redeploy. Rotating it breaks session continuity by design.

**`resource_links`** — curated third-party reading links for /knowledge-corner. Same RLS shape as
`posts`/`videos` (anon reads published only; admins write).

**`deploy_log`** — one row per Vercel Deploy Hook invocation, written only by `publish-site`.
Admin SELECT only, no INSERT policy.

**`posts` extensions** — `seo_description`, `tags`, `sort_order`, `compliance_ack`,
`compliance_ack_at`, `compliance_ack_by`; a slug-format CHECK; and the
`posts_publish_requires_ack` CHECK (`published = false or compliance_ack = true`).

**`videos` extensions** — `published_at` and a YouTube-URL CHECK. No thumbnail column: hotlinking
`i.ytimg.com` would fire a Google request on page load, defeating the click-to-load design.

### Functions added

- `assert_post_compliance()` — BEFORE trigger on `posts`. Scans title + excerpt + body against a
  banned-phrase list on publish and raises `check_violation` naming the offending phrase. Mirrored
  client-side in `src/lib/compliance-lint.ts`; **keep the two lists in sync.**
- `stamp_published_at()` — BEFORE trigger on `videos` and `resource_links`.
- `analytics_totals / analytics_daily / analytics_top_pages / analytics_top_clicks /
  analytics_referrers / analytics_devices` — security definer, each re-checking `is_admin()`
  explicitly (security definer bypasses RLS, so the guard must be in the body). EXECUTE granted to
  `authenticated` only; anon gets `42501`.
- `purge_analytics()` (13 months), `purge_old_leads()` (24 months, closed only), and
  `run_retention_purges()`, scheduled daily at 03:00 UTC by the `retention-purges` pg_cron job. The
  leads purge was a published Privacy Policy commitment that had never been implemented.

### Edge functions

- **`track`** (`verify_jwt` off) — origin allowlist → size cap → bot filter → rate limit
  (60/10 min per session) → normalise → insert. Every rejection returns 204, not an error. Must
  parse `req.text()`, not `req.json()`: the client sends a `text/plain` Blob so `sendBeacon` produces
  a CORS-simple request, and beacons cannot preflight.
- **`publish-site`** (`verify_jwt` off, token verified in-body so errors are readable JSON) —
  verifies the caller's JWT, **re-checks `admin_allowlist` server-side**, debounces to one build per
  60s, POSTs `VERCEL_DEPLOY_HOOK_URL`, logs to `deploy_log`.

### Secrets

`VERCEL_DEPLOY_HOOK_URL` must be set in Supabase for publishing to work; until then `publish-site`
returns a 503 explaining exactly what to create. `GITHUB_DISPATCH_TOKEN` should be **deleted** and
its PAT revoked — the `repository_dispatch` mechanism it served no longer exists.
