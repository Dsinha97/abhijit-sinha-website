# Improvement Backlog

Distilled 2026-09-07 from a competitive-benchmarking document that reviewed
`abhijitsinha.in` against six other distributor and advisory practices.

**The source document is deliberately not in this repo.** It names real,
identifiable competing firms — several of them local to Kharghar and Navi
Mumbai — and pairs them with criticism of their regulatory disclosures:
that one omits registration credentials, that another styles itself a financial
planner "while operating fundamentally as a life insurance agent", that a third
leaves compliance status ambiguous. Publishing that from the public repository
of a competing AMFI-registered distributor would be disparagement of named
competitors under this ARN's own name, which is both an AMFI code-of-conduct
problem and a defamation exposure, and a public git history is not something
you can take back. It stays local and `.gitignore`d; this page carries the
part that is actually useful — what to do about **this** site.

Recommendations are sorted by what they are worth *now*, not by the order the
source made them.

## Already shipped — do not re-propose

The source document predates most of the current site, so a large share of its
recommendations describe work that is done. Recorded here so nobody re-derives
them from a stale copy:

| Recommendation | Status |
| --- | --- |
| ARN, validity dates and statutory risk warning in global footer | Shipped — `Footer.astro`, [regulatory-compliance](regulatory-compliance.md) |
| Investor grievance / escalation matrix with SEBI SCORES | Shipped — `redressalLinks`, [page-disclosures](page-disclosures.md) |
| `FinancialService` + `Person` JSON-LD with a `sameAs` array | Shipped — `SEO.astro`; `sameAs` carries the Google Business Profile and LinkedIn, [seo-and-metadata](seo-and-metadata.md) |
| Floating pre-filled WhatsApp Business trigger | Shipped — `WhatsAppButton.astro`, [contact-channels](contact-channels.md) |
| Calendar scheduler on the consultation path | Shipped — Calendly via `SchedulerEmbed.astro`, [page-schedule](page-schedule.md) |
| **Inflation-adjusted** goal and SIP calculators | Shipped — both panels take an inflation rate and output today's-money figures, [calculators](calculators.md) |
| Research / thought-leadership publication hub | Shipped — Knowledge Corner (articles, videos, curated links), [page-knowledge-corner](page-knowledge-corner.md) |
| Mobile-first viewport, minimal third-party script weight | Shipped, and hard-won — [mobile-viewport-pitfalls](mobile-viewport-pitfalls.md), [security-hardening](security-hardening.md) |
| Solutions framed by investor objective rather than product catalogue | Largely shipped — `/solutions` headings lead with the objective ("Long-Term Wealth Accumulation") and name the scheme category second |

## Recommendations to reject, and why

These are the ones worth writing down, because each is superficially
attractive and would take this site somewhere it must not go.

**A risk-profiling questionnaire that outputs an asset allocation.** The
source proposes a five-question diagnostic returning a "high-level allocation
framework". This is the single most dangerous suggestion in the document, and
it contradicts the document's own analysis two sections earlier: it correctly
states that documented risk profiling and suitability assessment are what
**SEBI Registered Investment Advisers** do, and that MFDs are confined to
scheme suitability guidance incidental to distribution. A tool that takes a
visitor's circumstances and returns an allocation is personalised investment
advice by any reading. It is prohibited by [CLAUDE.md](../../CLAUDE.md) and by
[regulatory-compliance](regulatory-compliance.md). Do not build it.

**Rebranding to "Sinha Capital Advisory" with the title "Principal Advisor".**
Same contradiction, more visible. The document itself lists "independent
financial advice", "wealth management" and "financial planning" as descriptors
an AMFI-registered MFD is prohibited from using — and then recommends a trade
name and a job title built on exactly that word. The registered entity is the
individual **Abhijit Sinha**, ARN-367596; the compliance-locked identifiers in
`CLAUDE.md` are not a branding decision. There is a second, practical problem:
"Sinha Capital Advisory" already resolves to a *different* entity in search
results, so adopting it would worsen the very entity-disambiguation problem the
document raises.

**An HNWI lead form capturing investable net-worth brackets.** Net worth is
sensitive personal financial data. This site deliberately collects no financial
identifiers — the folio field was removed for exactly this reason — and adding
a wealth bracket would mean storing sensitive data at rest, a DPDP liability
with a matching Privacy Policy edit, in exchange for lead qualification a
conversation handles better. See [contact-channels](contact-channels.md).

**An embedded dynamic Google Reviews widget.** Two blockers. The listing has
**zero reviews**, so there is nothing to render. And a live widget means
third-party requests on page load, a CSP edit in `vercel.json`, and the end of
the "nothing loads before the visitor clicks" contract the site keeps for
YouTube and Calendly. The current answer — a plain "Review us on Google" link —
is the right one until reviews exist. See [security-hardening](security-hardening.md).

**A fee and commission "drag" modeller.** Proposed for fee-only practices; this
is a commission-based Regular Plan distributor, so the honest version of this
tool argues against the business model. The transparency goal is already met
more directly and more defensibly by the published Annual Trail Commission
Schedule on `/disclosures`.

## Genuinely open, roughly in priority order

1. **Client login / portfolio portal.** The clearest remaining functional gap
   against better competitors. Would mean linking a wealth-reporting SaaS
   (Investwell, ARN Booster, Wealthy) from the header. Decide first whether one
   is actually in use operationally — a "Client Login" that goes nowhere useful
   is worse than none. If added, it needs a CSP entry and a Privacy Policy line
   about the third party.

2. **Populate the Google Business Profile.** Zero reviews and no phone number
   on the listing. This is the highest-value, lowest-effort item on the page
   and needs no code at all — see [contact-channels](contact-channels.md). Real
   reviews would also unblock the widget rejected above.

3. **Navigation by life stage.** `/solutions` leads with objectives already,
   but the top-level nav is still structural. Distinct pathways for salaried
   accumulators, business owners with liquidity events, and NRIs would let
   visitors self-select. Cheap to try as landing-page content before touching
   `nav` in `site.ts`.

4. **A publishing cadence for the Knowledge Corner.** The hub is built; what is
   missing is regular output. This is an operational commitment rather than an
   engineering task, and it is what actually earns the organic search authority
   the document is chasing.

5. **A founder profile / credentials page.** More depth than the `#about`
   card — capital-markets tenure, the AMC role, NISM certification. Note that
   the certificates in `Important Docs/` are local-only and must not be
   published; their factual contents may be transcribed as text.

6. **Anonymised client case studies.** Genuinely useful social proof, but every
   one has to clear the compliance lint and the acknowledgement gate like any
   other Knowledge Corner post, and must describe *process* rather than
   outcomes — a case study that implies a return is a performance claim.

Related: [regulatory-compliance](regulatory-compliance.md) ·
[seo-and-metadata](seo-and-metadata.md) · [contact-channels](contact-channels.md) ·
[site-architecture](site-architecture.md)
