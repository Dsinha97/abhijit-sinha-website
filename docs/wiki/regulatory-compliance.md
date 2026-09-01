# Regulatory Compliance

Abhijit Sinha operates as an AMFI-registered Mutual Fund Distributor, not an investment adviser — every page on the site must reflect this distinction and carry the same identifiers, in the same wording, without drift. Sources: [design-overview.md](../sources/design-overview.md), [disclosures.md](../sources/disclosures.md), [homepage.md](../sources/homepage.md), [privacy-policy_terms.md](../sources/privacy-policy_terms.md).

## Fixed identifiers (must match verbatim site-wide)

- **AMFI Registration Number (ARN):** ARN-367596
- **EUIN:** E703717
- **Certification:** NISM Series V-A (Mutual Fund Distributors Certification)
- **Principal place of business:** Navi Mumbai
- **Direct email:** `support@abhijitsinha.in`
- **Direct phone:** `+91-8976539234`
- **ARN validity window:** `11/08/2026 to 01/07/2029` — confirmed against `Important Docs/ARN Registration.pdf`

Contact addresses `support@`, `contact@`, and `compliance@abhijitsinha.in` appear in the specs but no mailbox exists yet for the domain — see [contact-channels](contact-channels.md).

## Mandatory statutory text (verbatim, appears on every page footer)

> "Mutual fund investments are subject to market risks, read all scheme related documents carefully."

## Distributor disclaimer pattern

Every page's disclaimer is a variant of: "Abhijit Sinha is an AMFI-registered Mutual Fund Distributor (ARN-367596). [Page-specific scope clause]." e.g. on /disclosures it adds "...does not constitute formal investment advice or guaranteed return projections."

## Regular Plan notice

Recurring compliance statement: all transactions are executed in **Regular Plans**; AMCs pay the distributor trail commission out of the scheme's Total Expense Ratio; investors could alternatively use lower-cost **Direct Plans** on AMC portals directly. This must appear on the homepage product-cards section and on [solutions](page-solutions.md) and [disclosures](page-disclosures.md).

## Remuneration model ([disclosures](page-disclosures.md))

- 100% trail-only — no upfront commissions, advisory fees, or platform charges to the investor.
- Commission is disclosed under SEBI circular `SEBI/IMD/CIR No. 4/168230/09` and the AMFI Code of Conduct.
- Exact commission is verifiable by the investor via their Consolidated Account Statement (CAS) from NSDL/CDSL or CAMS/KFintech.
- Indicative trail commission ranges are placeholders (e.g. Equity `[0.50%–1.25%]`) pending AMC empanelment agreements — do not present these as final.

## AMFI Code of Conduct pillars (three-column grid on /disclosures)

1. Suitability-first approach
2. Conflict-of-interest mitigation (no scheme picked for higher payout)
3. Transparent documentation (KIM/SID provided before transaction)

## Grievance escalation ladder ([investor-services](page-investor-services.md))

1. **Level 1:** Direct distributor support desk (`support@abhijitsinha.in`, cc `contact@abhijitsinha.in`, phone, 2-business-day response)
2. **Level 2:** Relevant AMC or RTA (CAMS/KFintech)
3. **Level 3:** SEBI SCORES 2.0 (`https://scores.sebi.gov.in/`) or Smart ODR (`https://smartodr.in/`)

## Legal pages

Privacy Policy and Terms of Use are full statutory documents — see [legal-copy](legal-copy.md) for their content, both sourced from [privacy-policy_terms.md](../sources/privacy-policy_terms.md).

## Sensitive source documents — handling rule

`Important Docs/ARN Registration.pdf` and `Important Docs/NISM Certificate.pdf` live outside this wiki's scope. Their factual contents (the identifiers above) may be read and transcribed as text into the site; **the PDF files themselves must never be committed to git or copied into the public site build.**

Related: [design-system](design-system.md) · [contact-channels](contact-channels.md) · [legal-copy](legal-copy.md)


## Article publishing control (added 2026-09-01)

Knowledge Corner articles are free text written in the admin panel, which makes them the easiest
place on the site for distribution-only copy to drift into personalised advice, a return guarantee,
or a specific buy recommendation. Three layers, only the first two of which are binding:

1. **`posts_publish_requires_ack`** — a Postgres CHECK constraint. `published = true` is impossible
   without `compliance_ack = true`, so an article cannot go live without someone explicitly
   confirming it carries no personalised advice, no return guarantee and no scheme recommendation.
2. **`assert_post_compliance()`** — a BEFORE trigger scanning title, excerpt and body on publish
   against a banned-phrase list ("guaranteed returns", "risk-free", "I recommend", "best fund to
   buy", "safe as a fixed deposit", and others). It raises `check_violation` naming the phrase, and
   the editor surfaces that message verbatim.
3. **`src/lib/compliance-lint.ts`** — the same list linted live while typing, with Publish disabled
   until it is clean. Convenience only. **If you edit this list, edit the trigger too.**

Every article page renders `ComplianceCallout.astro`, and third-party links carry a non-endorsement
statement on the page and in Terms §5.

## Commission disclosure provenance (updated 2026-09-01)

The trail-commission table on `/disclosures` is no longer placeholder data. It is derived from the
Aug–Sep 2026 brokerage rate cards of the four empanelled AMCs (Nippon India, ICICI Prudential, DSP,
WhiteOak Capital) held in `Important Docs/Commission Structure/`, which are **never committed**.
Figures are base trail per annum excluding GST, taken as the min/max across every scheme row, with
minimums rounded down and maximums rounded up so the published range always encloses actual rates.

`/disclosures` also now discloses the SEBI B-30 / women-investor incentive (1% of the first
investment, capped at ₹2,000, payable after one year), which is a real payment received in
connection with an investment and was previously undisclosed.

**These figures go stale when new rate cards arrive.** Re-derive them rather than editing by hand.
