# Security Policy

This repository holds the source for **abhijitsinha.in**, the website of Abhijit Sinha, an AMFI-registered Mutual Fund Distributor (ARN-367596).

## Reporting a vulnerability

Please report suspected vulnerabilities privately, **not** as a public GitHub issue.

- **Preferred:** open a [private security advisory](https://github.com/Dsinha97/abhijit-sinha-website/security/advisories/new) on this repository.
- **Email:** support@abhijitsinha.in — put "Security" in the subject line.

Please include what you did, what you observed, and the URL or endpoint involved. A proof of concept helps but is not required to report.

Expect an acknowledgement within 5 working days. This is a single-maintainer project, so please allow reasonable time for a fix before disclosing publicly.

## Scope

In scope:

- `https://abhijitsinha.in` and anything served from it
- This repository's source
- The Supabase edge functions under `supabase/functions/` (`track`, `verify-lead`, `publish-site`)

Out of scope:

- Anything requiring physical access, social engineering, or a compromised end-user device
- Denial of service, volumetric testing, or automated scanning that generates load
- Reports produced solely by a scanner with no demonstrated impact
- Missing headers or configuration with no exploitable consequence
- Third-party services this site merely embeds or links to (Cloudflare Turnstile, Calendly, YouTube, Google) — report those to their own programmes

Please do not submit real personal data through the site's forms while testing, and do not attempt to access other people's enquiry submissions.

## Things that look like findings but are not

Two are common enough to name in advance:

- **The Supabase publishable (anon) key is in the client bundle by design.** It identifies the project, not an account; every table is protected by Row Level Security, and admin access is gated on an allowlist checked server-side. Finding this key is expected. Demonstrating that it *reads or writes something it shouldn't* is a genuine finding, and very much wanted.
- **The site's regulatory identifiers are public information.** ARN, EUIN, certification and the principal place of business are published deliberately, as AMFI requires.

## Safe harbour

Good-faith research that follows this policy is welcome, and no legal action will be pursued over it. If you are unsure whether something is in scope, ask first at the address above.
