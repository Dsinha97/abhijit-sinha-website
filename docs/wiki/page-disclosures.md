# Page: Disclosures (`/disclosures`)

Source: [disclosures.md](../sources/disclosures.md). Title: "Regulatory Disclosures & Commission Structure \| Abhijit Sinha (ARN-367596)".

## Sections

1. **Header** — "Statutory Disclosures & Remuneration Structure", citing SEBI circular `SEBI/IMD/CIR No. 4/168230/09` and the AMFI Code of Conduct.
2. **Operating model & remuneration** — 100% trail-only, Regular Plan execution, independent allocation, CAS verification. Full detail in [regulatory-compliance](regulatory-compliance.md#remuneration-model-disclosures).
3. **Annual Trail Commission Schedule** — a striped data table of asset classes against **Years 1–3**
   and **Year 4 onwards** trail ranges. *Corrected 2026-09-03: this page previously described the
   columns as "Year-1 / Year-2+", which the shipped table contradicts.* An intro line names the
   period (`commissionPeriod` in `site.ts`) and lists the empanelled AMCs inline.

   **`empanelledAmcs` is `AmcPartner[]`, not `string[]`.** It was widened from a plain string array
   to `{ name, logo, maxH }` objects when the footer gained AMC logo tiles. The footer was updated;
   this page's `empanelledAmcs.join(', ')` was not, so the live sentence rendered
   `([object Object], [object Object], [object Object], [object Object])` — valid JS, a clean build,
   `astro check` silent, and a visible defect on a statutory disclosure page. Fixed 2026-09-03 to
   `empanelledAmcs.map((amc) => amc.name).join(', ')`. **Anything consuming `empanelledAmcs` must go
   through `.name`** — see [regulatory-compliance](regulatory-compliance.md) for why placeholder
   figures on this page stay visibly marked.
4. **AMFI Code of Conduct grid** — Suitability-First, Conflict-of-Interest Mitigation, Transparent Documentation.
5. **Registration & statutory identifiers card** — Distributor Name, ARN, EUIN, ARN validity (confirmed), NISM certification, principal place of business. See [regulatory-compliance](regulatory-compliance.md) for the exact values — this page states them as text, with no PDF download link (the source certificates in `Important Docs/` are excluded from the public site).
6. **Statutory footer** — shared, plus regulatory/redressal links (CAMS, KFintech, SEBI SCORES 2.0, Investor Services, Schedule Meeting).

Related: [regulatory-compliance](regulatory-compliance.md) · [page-investor-services](page-investor-services.md)
