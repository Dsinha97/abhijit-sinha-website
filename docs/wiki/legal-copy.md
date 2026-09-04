# Legal Copy: Privacy Policy & Terms of Use

Source: [privacy-policy_terms.md](../sources/privacy-policy_terms.md).

## Privacy Policy (`/privacy-policy`)

- **Scope:** covers data collected via the site, contact forms, and consultations.
- **Data collected:** contact data (name/email/phone/city), financial profile & goals shared in consultations, KYC/regulatory info (PAN, DOB, bank details, address proof — collected strictly during transaction onboarding, not via the website itself), technical logs (browser/OS/IP).
- **Purpose:** suitability assessment, meeting coordination, onboarding/transaction routing via SEBI-registered RTAs/AMCs, statutory record-keeping under SEBI/AMFI.
- **Sharing:** never sold/rented for marketing; shared only with authorized infrastructure entities (AMCs, RTAs, payment gateways, BSE StAR MF/NSE NMF II) or under legal/regulatory obligation.
- **Security:** access-controlled systems, no absolute-security guarantee claimed.
- **Data rights:** access, correction, withdrawal of consent for non-regulatory communications — subject to statutory retention requirements.
- **Contact:** `compliance@abhijitsinha.in` (mailbox not yet provisioned — see [contact-channels](contact-channels.md)).

### What actually shipped

The bullets above are the **source spec**, and the live page has since grown well
past them. Every third party the site touches and every store of visitor data has
had to be disclosed as it was added, so the shipped structure is now:

| Section | Covers | Added |
|---|---|---|
| 1–4 | Scope, information collected, purpose and legal basis, sharing | Launch |
| 5 | Data storage and security (intro) | Launch |
| 5.1 | Website enquiry forms — what is stored, where (Supabase, India), 24-month retention, and the explicit "do not enter folio/PAN/bank details" instruction | 2026-08-28, with the folio-field removal |
| 5.2 | Website analytics — first-party, cookieless, no IP/user-agent/location, 13-month retention, how to opt out | 2026-09-01 |
| 5.3 | Embedded video — `youtube-nocookie`, nothing requested before a click | 2026-09-01 |
| 5.4 | Booking calendar — Calendly, click-to-load | 2026-09-01 |
| 5.5 | Links to other websites | 2026-09-01 |
| 5.6 | **Form spam protection** — Cloudflare Turnstile: it receives the visitor's IP and may set a short-lived cookie; the form contents never reach it; plus our own per-connection limits on a non-reversible value with no IP stored | 2026-09-03 |
| 6 | Data rights | Launch |

**§5.6 came with a second edit that is easy to miss.** The privacy notice
component and §5.2 both claimed the site "uses no cookies" — a blanket zero.
Turnstile may set a challenge cookie of its own, so both were narrowed to "no
**tracking** cookies" with the anti-spam exception named. `PrivacyNotice.astro`
exists precisely because a banner that misstates what the site does is a false
disclosure, which on a regulated financial site is worse than no banner; leaving
the old wording in place would have made the component contradict its own
rationale. Keep the notice copy and §5.6 in step if either changes.

The standing rule this reflects: **adding or widening any collection, or adding
any third party, requires a matching Privacy Policy edit in the same change.**
See [contact-channels](contact-channels.md) for the Turnstile mechanics and
[security-hardening](security-hardening.md) for the CSP entries it needs.

## Terms of Use (`/terms`)

- **Acceptance:** using the site implies agreement to the terms.
- **Distributor status:** AMFI-registered (ARN-367596); distribution services only — explicitly **not** investment advice, tax advice, or a financial plan under SEBI (Investment Advisers) Regulations, 2013.
- **Regular Plans:** all transactions executed in Regular Plans; Direct Plans available directly from AMCs at lower expense ratios.
- **Risk warnings:** standard market-risk and no-guaranteed-returns language, matching [regulatory-compliance](regulatory-compliance.md).
- **Accuracy/availability:** content provided "as is", no uptime guarantee.
- **Limitation of liability:** no liability for decisions made without a formal suitability assessment, for downtime, or for third-party links (CAMS/KFintech/SEBI SCORES).
- **Governing law:** laws of India, exclusive jurisdiction of competent Indian courts.
- **Contact:** `support@abhijitsinha.in`, Navi Mumbai.

Related: [regulatory-compliance](regulatory-compliance.md) · [contact-channels](contact-channels.md) · [security-hardening](security-hardening.md) · [data-model](data-model.md)
