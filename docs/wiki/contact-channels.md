# Contact Channels

How a visitor reaches Abhijit across the site. Sources: [whatsapp-contact.md](../sources/whatsapp-contact.md), [homepage.md](../sources/homepage.md), [schedule.md](../sources/schedule.md), [investor-services.md](../sources/investor-services.md).

## Channels

| Channel | Detail | Where it appears |
|---|---|---|
| Floating WhatsApp button | `wa.me/918976539234`, prefilled message "Hello Abhijit, I would like to know more about mutual fund investments and SIPs." | Every page, bottom-right, fixed position |
| Direct email | `support@abhijitsinha.in` | Footer, `/schedule`, `/disclosures` |
| Direct phone | `+91-8976539234` (Mon–Fri 10am–6pm IST) | Footer, `/schedule` |
| Homepage inquiry form | Name, Email, Mobile, Investment Goal, Mode (SIP/Lump Sum), Message | `/` `#contact` |
| Investor Services request form | Name, Email, Mobile, Service Category dropdown, Message. **No folio field** — the source spec listed one and it was deliberately removed (see below) | `/investor-services` |
| Scheduler | Booking UI — `scheduler.provider` in `site.ts` is set to **Calendly**; the component stays provider-agnostic so the spec-era "TBD (Cal.com / Calendly / Google)" is still a one-line swap | `/schedule` — see [page-schedule](page-schedule.md) |
| LinkedIn | `distributor.linkedin` in `site.ts`, opens in a new tab | `/` `#about`, under the profile credentials card |

## WhatsApp button component

Standard SVG icon, `aria-label` for screen readers, visible focus ring, 44–48px touch target, opens `wa.me` link in a new tab. Phone number and default message are props, not hardcoded — sourced from site config. Collapsed to an icon-only circle by default at every breakpoint; the "Chat on WhatsApp" label expands on `hover`/`focus-visible` (both, so keyboard users get the same reveal). The accessible name comes from the anchor's `aria-label` regardless of whether the label text is visible.

## Form submission handling (not specified in source docs)

The specs describe form *fields* but not a backend — the handling below is an implementation decision layered on top of them, not something the specs prescribe.

Both forms POST to the Supabase `verify-lead` edge function (`PUBLIC_FORM_ENDPOINT`), which runs the bot checks and then forwards to `submit-lead` — which validates the submission, stores it in the `leads` table, and emails a copy. See [data-model.md](data-model.md) for both endpoint contracts and [admin-dashboard.md](admin-dashboard.md) for the inbox that reads it. When `PUBLIC_FORM_ENDPOINT` is empty, `ContactForm.astro` still degrades to its original disabled/informational state.

## Bot protection (2026-09-03)

```
browser --(FormData + cf-turnstile-response)--> verify-lead --(FormData)--> submit-lead --> leads + email
```

The gate is a **new function in front of `submit-lead`, not a change to it**. `submit-lead` is the only working lead path on the site and its source is not in this repo, so it stays unredeployed and stays the rollback: repoint `PUBLIC_FORM_ENDPOINT` at `.../submit-lead` and the forms behave exactly as they did before.

Why a gate was needed at all: the only pre-existing defence was a honeypot plus `submit-lead`'s rate limit of **3/hour per email address**. A bot that varies the address was throttled by nothing.

`verify-lead` checks, in order — a filled honeypot or a too-fast submit returns a **normal-looking success and forwards nothing**, so a bot learns nothing from the response:

1. Origin allowlist (same list as `track`; unallowlisted origins get 403, not a silent pass).
2. 16KB body cap.
3. Honeypot `website` non-empty → silent success.
4. `form_dwell_ms` under 2500ms → silent success.
5. Field length caps, rejected with a message a human can act on. **These mirror the `maxlength` attributes in `ContactForm.astro` — change both together.**
6. Per-IP rate limit, 5 per 15 minutes, keyed on a SHA-256 of the first `x-forwarded-for` hop. In-memory only; the IP is never stored, matching the analytics posture.
7. Cloudflare Turnstile `siteverify`.

**The fail-open/fail-closed asymmetry is deliberate.** With `TURNSTILE_SECRET_KEY` unset, `verify-lead` forwards unverified and logs a warning — a secret that was never configured, or mis-set, must never take the site's only lead channel offline. With the secret set, a missing or invalid token is a 403. The client side lines up: no `PUBLIC_TURNSTILE_SITE_KEY` means no widget renders and nothing is requested from Cloudflare at all, which is also what keeps local development free of third parties.

`submit-lead`'s response — status code and JSON body — is relayed verbatim, so its own validation wording and its per-email limit still reach the visitor.

Client-side (`ContactForm.astro`) adds the widget, the dwell timestamp, and the `maxlength` caps. None of it is authoritative; a bot can POST straight at the endpoint and never run the script, which is why every check is repeated server-side. Two details worth keeping: on **success** the submit button stays disabled (a second click would only duplicate the lead), and on **failure** the button is re-enabled *and* `turnstile.reset()` is called — a Turnstile token is single-use, so without the reset every retry after a failure is rejected and the form looks broken.

Turnstile is disclosed in **Privacy Policy §5.6** (see [legal-copy.md](legal-copy.md) for the full shipped section list), and the privacy notice's cookie wording names the exception. Cloudflare receives the visitor's IP; the form contents never leave for Cloudflare. See [security-hardening.md](security-hardening.md) for the CSP entries the widget requires.

**The folio-number field was removed** from the Investor Services form. Folio numbers are financial identifiers, and collecting them through a web form means storing sensitive account data at rest for no operational gain; they are collected over WhatsApp or phone once contact is established. The form copy now says so explicitly, and Privacy Policy §5.1 asks visitors not to enter account identifiers. Do not reintroduce the field without a retention policy and a matching disclosure.

## Unconfirmed mailboxes

`support@abhijitsinha.in` is live and is the distributor's primary address (`distributor.email` in `src/data/site.ts`). `contact@abhijitsinha.in` and `compliance@abhijitsinha.in` are referenced in the disclosures/investor-services specs but are not yet provisioned — until they are, all mail routes to `support@abhijitsinha.in`.

Related: [regulatory-compliance](regulatory-compliance.md) · [page-schedule](page-schedule.md) · [page-investor-services](page-investor-services.md)
