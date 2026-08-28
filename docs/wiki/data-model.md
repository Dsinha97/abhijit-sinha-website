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

CORS reflects the request origin **only when allowlisted** (Pages origin, both `abhijitsinha.in` forms, localhost), never an arbitrary one. Override with the `ALLOWED_ORIGINS` secret.

A filled honeypot returns HTTP 200 and stores nothing — bots get no signal that they were caught.

### Secrets (set in the Supabase dashboard, not `.env`)

| Secret | Purpose | Status |
|---|---|---|
| `WEB3FORMS_ACCESS_KEY` | Email notification on each new lead | **Set.** Verified end to end 2026-08-28: lead stored + email delivered. Recipient is currently a test inbox; switch it to `abhijit.uti@gmail.com` in the Web3Forms form settings — the access key does not change, so no secret update or redeploy is needed. |
| `ALLOWED_ORIGINS` | Optional CORS override | Optional |
| `GITHUB_DISPATCH_TOKEN` | Phase 3 rebuild trigger | Phase 3 |

Web3Forms is used for the notification email rather than Resend because Resend requires verifying `abhijitsinha.in`, which is still parked at GoDaddy with no DNS pointing anywhere. Revisit after the [domain cutover](deployment-domain.md).
