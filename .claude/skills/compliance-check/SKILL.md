---
name: compliance-check
description: Check page copy, site.ts and the footer against the site's compliance rules - locked identifiers, statutory footer notices, banned advice or guarantee phrases, no financial identifiers in forms. Use after any copy, site.ts, Footer, ContactForm or Knowledge Corner change, when asked to "check compliance" or "grep the compliance text", and before opening a PR that touches page content.
---

# Compliance Check

This is a regulated-content site: every page carries statutory disclosures and must not read as
investment advice. Read [docs/wiki/regulatory-compliance.md](../../../docs/wiki/regulatory-compliance.md)
for the reasoning. This skill runs the mechanical half. The judgment half is yours.

## 1. Run the script

```bash
node .claude/skills/compliance-check/scripts/check.mjs
```

It exits 1 on any FAIL. It checks:

- **Locked identifiers** in `src/data/site.ts`: ARN-367596, EUIN E703717, NISM Series V-A, the
  Kharghar address, +91-8976539234, support@abhijitsinha.in. A mismatch is a FAIL.
- **Footer**: `Footer.astro` renders `statutory.riskWarning` and `statutory.regularPlanNotice`, and
  neither is behind a condition.
- **Banned phrases**: the list is parsed from `src/lib/compliance-lint.ts`, the single source, and
  searched across pages, components, layouts, `site.ts` and the knowledge snapshot. Admin pages are
  excluded. Hits are WARN, because "we do not recommend" and "you should invest" read differently.
- **Contact form**: no field named for folio, PAN, bank, account, IFSC or Aadhaar.
- **Inline identifiers**: ARN, EUIN or phone typed into a page instead of read from `site.ts`. WARN.
- **PDFs under `public/`**: `Important Docs/` must never be copied there.

## 2. Judge the WARN lines

For each WARN, open the line and decide: is it advice, a guarantee, or a recommendation driven by
commission? Fix it or say why it is safe. A WARN you cannot explain is not a pass.

## 3. Read changed copy yourself

The script cannot see these. Check them on every copy change:

- No personalised recommendation ("this fund suits you") and no scheme named as the pick.
- No promised or implied return, and no past performance framed as a forecast.
- Numbers in brackets in the specs are unconfirmed placeholders. They stay visibly marked.
- The commission table on `/disclosures` names only `rateCardAmcs`.
- Calculators describe themselves as illustrations, not projections.

## 4. If you change the banned list

Edit `src/lib/compliance-lint.ts` and the Postgres `assert_post_compliance()` trigger together.
The trigger is a Supabase change and a stop point: ask first.

## Not covered

The script cannot check the Google Business Profile NAP match, the Privacy Policy against new
analytics collection, or the CSP in `vercel.json`. Check those by hand when the change touches them.
