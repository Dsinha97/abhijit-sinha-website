# Regulatory Compliance

Abhijit Sinha operates as an AMFI-registered Mutual Fund Distributor, not an investment adviser — every page on the site must reflect this distinction and carry the same identifiers, in the same wording, without drift. Sources: [design-overview.md](../sources/design-overview.md), [disclosures.md](../sources/disclosures.md), [homepage.md](../sources/homepage.md), [privacy-policy_terms.md](../sources/privacy-policy_terms.md).

## Fixed identifiers (must match verbatim site-wide)

- **AMFI Registration Number (ARN):** ARN-367596
- **EUIN:** E703717
- **Certification:** NISM Series V-A (Mutual Fund Distributors Certification)
- **Principal place of business:** Navi Mumbai
- **Direct email:** `abhijit.uti@gmail.com`
- **Direct phone:** `+91-9004087549`
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
