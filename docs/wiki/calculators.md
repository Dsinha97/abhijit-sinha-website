# Calculators (SIP Growth, Goal Planner & Lump Sum Planner)

Source: [calculator.md](../sources/calculator.md), mounted on [page-solutions](page-solutions.md).

## Formulas

**SIP Future Value** (monthly contributions, compounded monthly, contribution at start of period):

$$FV = P \times \left[\frac{(1+i)^n - 1}{i}\right] \times (1+i)$$

**Required monthly SIP for a goal** (inverse of the above):

$$P = \frac{FV}{(1+i) \times \left[\frac{(1+i)^n - 1}{i}\right]}$$

**Required lump sum for a goal** (single upfront investment, compounded monthly):

$$PV = \frac{FV}{(1+i)^n}$$

Where `P` = monthly investment, `PV` = lump sum invested today, `i` = annual rate / 12 / 100, `n` = years × 12.

**Inflation adjustment.** The Goal Planner and Lump Sum Planner panels take an Expected Inflation Rate
`f` (0–10%, step 0.5, default 6%); the SIP Growth Calculator does not use inflation at all — it only
ever projects nominal corpus value.

- Goal panel and Lump Sum panel — *Future Cost of This Goal*. A goal costed in today's rupees costs
  more by the time it is due, so the required SIP/lump sum is solved against the inflated figure, not
  the entered one:

$$FV_{inflated} = Goal \times (1+f)^{years}$$

Note `f` is applied annually over `years`, not monthly over `n` — inflation is quoted as an annual
rate and the corpus is only ever converted once, at the horizon.

## Return-rate cap

All three Expected Annual Return sliders are capped at **12% p.a.** (`max="12"`). This is a compliance
constraint, not a UI preference: an AMFI-registered distributor projecting higher figures reads as an
implied performance claim. Do not raise the cap. Each rate slider carries the note "Capped at 12% p.a.
— illustrations must not imply higher expected returns."

## Three-tab component

A single `Calculators` component with tab switching between three panels:

1. **SIP Growth Calculator** — inputs: Monthly Investment (₹500–₹200,000 slider), Expected Annual Return (4–12%, step 0.5), Investment Horizon (1–30 years). Outputs: Total Invested, Estimated Returns, Total Value. No inflation input — this panel projects nominal corpus value only. CTA "Structure Your SIP Plan" → `/schedule`.
2. **Target Goal Planner** — inputs: Target Wealth Goal (₹1L–₹2Cr), Expected Annual Return (4–12%), Time to Reach Goal (1–30 years), Expected Inflation Rate (0–10%). Outputs: Goal in Today's Money, Future Cost of This Goal, Required Monthly Investment. CTA "Start This Goal Plan" → `/schedule`.
3. **Lump Sum Planner** — inputs: Target Wealth Goal (₹1L–₹2Cr), Expected Annual Return (4–12%), Time to Reach Goal (1–30 years), Expected Inflation Rate (0–10%). Outputs: Goal in Today's Money, Future Cost of This Goal, Required Lump Sum Investment. CTA "Plan Your Lump Sum Investment" → `/schedule`.

The Goal Planner and Lump Sum Planner share the same input shape and inflation treatment — they only
differ in whether the inflated future cost is solved against a monthly SIP annuity or a single upfront
lump sum.

All monetary values are formatted with `toLocaleString('en-IN')` for Indian digit grouping (lakhs/crores).

## Reference values (for build verification)

At SIP defaults (₹10,000/month, 12%, 10 years): Total Invested ₹12,00,000, Estimated Returns ≈
₹11,23,391, Total Value ≈ ₹23,23,391.

At Goal defaults (₹50,00,000 goal, 12%, 10 years, 6% inflation): Future Cost of This Goal ≈
₹89,54,238, Required Monthly SIP ≈ ₹38,540.

At Lump Sum defaults (₹50,00,000 goal, 12%, 10 years, 6% inflation): Future Cost of This Goal ≈
₹89,54,238 (same inflated-target formula as the Goal panel), Required Lump Sum Investment ≈ ₹27,13,088.

Setting inflation to 0% on the Goal panel is the useful cross-check: it must fall back to the
pre-inflation figures — Future Cost ₹50,00,000 and Required Monthly SIP ₹21,520. The same check applies
to the Lump Sum panel: Future Cost ₹50,00,000 and Required Lump Sum ≈ ₹15,14,974 (₹50,00,000 discounted
at 12% p.a., monthly compounding, over 10 years).

(An earlier revision of this page quoted ₹21,521 for the Goal panel's 0%-inflation figure. The
component has always produced ₹21,520 — the raw value is 21520.27 — so the doc was off by a rupee, not
the code.)

## Implementation notes

- The rate sliders bottom out at 4%, so `i` never reaches zero in practice, but the defensive `i === 0` guard stays on every panel. Inflation *can* be 0, and that path is safe: `Math.pow(1, years)` is exactly 1, so the adjustment becomes an identity operation rather than needing a guard of its own.
- `updateSIP()`, `updateGoal()` and `updateLumpsum()` are each called once at the end of the script. The markup ships with the default figures baked in for the no-JS case, and this keeps them correct if a browser restores previous slider positions on reload.
- The results panel must carry a "these figures are illustrative, not a guarantee of returns" disclaimer per [regulatory-compliance](regulatory-compliance.md) — the source spec code omits this, but the site's compliance rules require it near any numeric projection.

Related: [page-solutions](page-solutions.md) · [regulatory-compliance](regulatory-compliance.md)
