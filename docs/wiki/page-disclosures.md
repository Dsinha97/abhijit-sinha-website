# Page: Disclosures (`/disclosures`)

Source: [disclosures.md](../sources/disclosures.md). Title: "Regulatory Disclosures & Commission Structure \| Abhijit Sinha (ARN-367596)".

## Sections

1. **Header** — "Statutory Disclosures & Remuneration Structure", citing SEBI circular `SEBI/IMD/CIR No. 4/168230/09` and the AMFI Code of Conduct.
2. **Operating model & remuneration** — 100% trail-only, Regular Plan execution, independent allocation, CAS verification. Full detail in [regulatory-compliance](regulatory-compliance.md#remuneration-model-disclosures).
3. **Annual Trail Commission Schedule** — a striped data table of asset classes against **Years 1–3**
   and **Year 4 onwards** trail ranges. *Corrected 2026-09-03: this page previously described the
   columns as "Year-1 / Year-2+", which the shipped table contradicts.* An intro line names the
   period (`commissionPeriod` in `site.ts`) and names the AMCs the ranges were derived from.

   *Updated 2026-09-03: the intro used to name **the empanelled AMCs**. It now names
   `rateCardAmcs` — see "Two AMC lists, deliberately" below — followed by an explicit sentence
   saying rate cards for the remaining empanelled AMCs have not been received and their schemes are
   not reflected in the ranges. The `DataTable` caption carries the same scope, so a screen-reader
   user gets the qualification too.*

   **`empanelledAmcs` is `AmcPartner[]`, not `string[]`.** It was widened from a plain string array
   to `{ name, logo, maxH }` objects when the footer gained AMC logo tiles. The footer was updated;
   this page's `empanelledAmcs.join(', ')` was not, so the live sentence rendered
   `([object Object], [object Object], [object Object], [object Object])` — valid JS, a clean build,
   `astro check` silent, and a visible defect on a statutory disclosure page. Fixed 2026-09-03 to
   `empanelledAmcs.map((amc) => amc.name).join(', ')`. **Anything consuming `empanelledAmcs` must go
   through `.name`** — see [regulatory-compliance](regulatory-compliance.md) for why placeholder
   figures on this page stay visibly marked.
4. **Empanelled Asset Management Companies** *(added 2026-09-03)* — all fourteen AMCs as logo
   tiles in a responsive grid (2 / 3 / 4 / 5 columns), sitting **directly beneath the commission
   table** so the "which AMCs does this table actually cover" question is answered on the spot. The
   wall used to live in the footer; fourteen tiles is a page section, not a footer block, so the
   footer now carries a one-line pointer here instead. Tile mechanics are in
   [design-system](design-system.md#amc-logo-tiles).

   The non-endorsement sentence — empanelment is a distribution arrangement, not a recommendation
   of any scheme or AMC — travels with the wall wherever it goes, and is repeated in the footer.

5. **AMFI Code of Conduct grid** — Suitability-First, Conflict-of-Interest Mitigation, Transparent Documentation.
6. **Registration & statutory identifiers card** — Distributor Name, ARN, EUIN, ARN validity (confirmed), NISM certification, principal place of business. See [regulatory-compliance](regulatory-compliance.md) for the exact values — this page states them as text, with no PDF download link (the source certificates in `Important Docs/` are excluded from the public site).
7. **Statutory footer** — shared. Since 2026-09-03 the footer link row is a short inline selection (see [design-system](design-system.md)); of the redressal links only SEBI SCORES 2.0 remains there, and the CAMS/KFintech portals live on [/investor-services](page-investor-services.md), where they are explained.

## Two AMC lists, deliberately

`site.ts` exports **two** lists and this page uses both, for different claims:

- `empanelledAmcs` — every AMC the ARN is empanelled with (fourteen as of 2026-09-03). Empanelment
  is a distribution arrangement; listing it claims nothing about rates.
- `rateCardAmcs` — the subset with `rateCardOnFile: true`, meaning that AMC's current brokerage
  rate card is actually held in `Important Docs/Commission Structure/` and its scheme rates are
  inside `commissionSchedule`. Six as of 2026-09-03: Axis, DSP, ICICI Prudential, Nippon India,
  quant, WhiteOak Capital.

They were one list until 2026-09-03. Publishing the full empanelment while `empanelledAmcs` still
fed the commission sentence would have silently widened a dated statutory claim to cover eight AMCs
whose rate cards nobody has seen — the table would have read as derived from cards that do not
exist. Splitting the two was the fix; **only `rateCardAmcs` may be named beside the commission
table**, and the flag flips only after the figures are re-derived. This is now a rule in the root
`CLAUDE.md`. Provenance and method: [regulatory-compliance](regulatory-compliance.md#commission-disclosure-provenance).

Related: [regulatory-compliance](regulatory-compliance.md) · [design-system](design-system.md) · [page-investor-services](page-investor-services.md)
