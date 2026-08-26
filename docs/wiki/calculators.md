# Calculators (SIP Growth & Goal Planner)

Source: [calculator.md](../sources/calculator.md), mounted on [page-solutions](page-solutions.md).

## Formulas

**SIP Future Value** (monthly contributions, compounded monthly, contribution at start of period):

$$FV = P \times \left[\frac{(1+i)^n - 1}{i}\right] \times (1+i)$$

**Required monthly SIP for a goal** (inverse of the above):

$$P = \frac{FV}{(1+i) \times \left[\frac{(1+i)^n - 1}{i}\right]}$$

Where `P` = monthly investment, `i` = annual rate / 12 / 100, `n` = years × 12.

## Two-tab component

A single `Calculators` component with tab switching between two panels:

1. **SIP Growth Calculator** — inputs: Monthly Investment (₹500–₹200,000 slider), Expected Annual Return (4–20%, step 0.5), Investment Horizon (1–30 years). Outputs: Total Invested, Estimated Returns, Total Value. CTA "Structure Your SIP Plan" → `/schedule`.
2. **Target Goal Planner** — inputs: Target Wealth Goal (₹1L–₹2Cr), Expected Annual Return (4–20%), Time to Reach Goal (1–30 years). Outputs: Target Corpus, Required Monthly Investment. CTA "Start This Goal Plan" → `/schedule`.

All monetary values are formatted with `toLocaleString('en-IN')` for Indian digit grouping (lakhs/crores).

## Reference values (for build verification)

At defaults (₹10,000/month, 12%, 10 years): Total Invested ₹12,00,000, Estimated Returns ≈ ₹11,23,391, Total Value ≈ ₹23,23,391.
At Goal defaults (₹50,00,000 target, 12%, 10 years): Required Monthly SIP ≈ ₹21,521.

## Implementation notes

- The source component code hardcodes `i = 4%..20%` so `i` never reaches zero in practice, but a defensive `i === 0` guard is still worth adding before dividing.
- The results panel must carry a "these figures are illustrative, not a guarantee of returns" disclaimer per [regulatory-compliance](regulatory-compliance.md) — the source spec code omits this, but the site's compliance rules require it near any numeric projection.

Related: [page-solutions](page-solutions.md) · [regulatory-compliance](regulatory-compliance.md)
