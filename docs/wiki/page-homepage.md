# Page: Homepage (`/`)

Source: [homepage.md](../sources/homepage.md). Shares the framework in [site-architecture](site-architecture.md).

## Sections, in order

1. **Hero banner** — `banner.png` (≥768px) / `banner-mobile.jpeg` (<768px). Pillars: Goal-Based Investing, Risk-Managed Portfolios, Disciplined Wealth Creation, Long-Term Financial Growth. Primary CTA "Schedule a 15-Minute Intro Call" → `/schedule`; secondary link "Explore Investment Solutions" → `/solutions`.
2. **Investment philosophy** — `Buffet-quote.jpeg` with callout on discipline and structured asset allocation over market timing.
3. **About Abhijit Sinha** (`id="about"`) — two columns:
   - Left: `profile-pic.jpg`, name, credentials box (Commerce Graduate, MBA Finance, 35 years AM industry experience, former Head of Sales Management at a leading Indian AMC, ARN-367596).
   - Right: first-person bio (four paragraphs — career history, sales-management background, distributor mission, investing philosophy). CTA "Schedule a Conversation" → `/schedule`.
4. **Distribution solutions summary** — four product cards: Equity / Hybrid / Debt / Liquid & Overnight Schemes, plus the Regular Plan mandatory note (see [regulatory-compliance](regulatory-compliance.md)).
5. **Direct written inquiry** (`id="contact"`) — dual action: (A) banner linking to `/schedule`, (B) inline form (Name, Email, Mobile, Investment Goal, Mode: SIP/Lump Sum, Submit). See [contact-channels](contact-channels.md) for the form-handling approach.
6. **Statutory footer** — shared, see [regulatory-compliance](regulatory-compliance.md).

## Note on source duplication

The homepage source file also contains a full `/schedule` blueprint appended at the end (sections numbered "3." and beyond) — that content has been treated as the authoritative source for [page-schedule](page-schedule.md) instead, since a dedicated `schedule.md` source also exists and the two are consistent.

Related: [site-architecture](site-architecture.md) · [page-solutions](page-solutions.md) · [page-schedule](page-schedule.md)
