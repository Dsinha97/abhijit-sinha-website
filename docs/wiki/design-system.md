# Design System

The visual identity for abhijitsinha.in projects stability, clarity, and institutional trust with a modern, lightweight feel — appropriate for a regulated financial-services distributor. Source: [design-overview.md](../sources/design-overview.md).

## Color palette

| Role | Value | Usage |
|---|---|---|
| Primary (Oxford Navy / Deep Slate) | `#0F172A` | Text, primary buttons, structural anchors, regulatory strip background |
| Surface Neutral (Warm Off-White) | `#F8FAFC`–`#F1F5F9` | Card backgrounds, subtle dividers |
| Background (Crisp White) | `#FFFFFF` | Main page canvas |
| Body Copy (High-Contrast Charcoal) | `#1E293B` | Meets WCAG AA contrast >7:1 |
| Supporting Text (Muted Slate) | `#475569` | Sub-headers, metadata, timestamps |
| Accent (Subdued Royal Blue) | `#1D4ED8` | Links, active tab states |

## Typography

- **Headings:** clean modern sans-serif (Inter, Plus Jakarta Sans, or system sans).
- **Body:** high-readability sans-serif, 55–75ch measure per line.

## Layout & hierarchy rules

- **Proof-first architecture:** credentials/regulatory badges sit beside or above the main heading, never buried at the bottom — this is the throughline connecting every page to [regulatory-compliance](regulatory-compliance.md).
- **Containers:** 8–12px rounded corners, 1px `border-slate-200` outlines, no heavy drop shadows.
- **Mobile touch ergonomics:** minimum 44×44px tap targets with generous padding.

## Reusable modules

These three patterns recur across pages (see [site-architecture](site-architecture.md) for where each is used):

- **Metric/Goal Cards** — 2–3 column cards for related financial categories (Growth, Income, Balanced), uniform border/padding/iconography.
- **Compliance & Disclosure Callouts** — highlighted boxes with a subtle slate/blue border, separating regulatory notices from body copy. See [regulatory-compliance](regulatory-compliance.md).
- **Structured Data Tables** — responsive, striped tables for commission structures, grievance contacts, fund category breakdowns.

## AMC logo tiles

The empanelled-AMC wall on [disclosures](page-disclosures.md) is fourteen third-party logos in one
grid, and third-party marks are the hardest thing on this site to make look deliberate. Three rules
carry it, all of them learned by getting it wrong first:

- **A fixed white tile per mark, `object-contain`, alt text = the AMC's name.** Every one of these
  logos is dark artwork drawn for a light background, so the tile is not decoration — it is the only
  thing that keeps them legible and stops fourteen different canvas colours from showing through.
  The wall was in the navy footer until 2026-09-03, where the tile was doing even more work.
- **Trim each PNG to the mark's own bounds before committing it.** The ICICI source arrived as a
  180×180 canvas that was only 41% logo, so it rendered at half the visual size of its neighbours no
  matter what the CSS said — whitespace inside the file beats any rule outside it. Sources also
  arrive wildly oversized (the Edelweiss SVG rasterised to 11134px wide); cap at 480px.
- **Balance area, not height.** The eye compares how much ink a mark occupies. With aspect ratios
  from 2.0:1 to 5.9:1, a single `max-h` makes the wide marks enormous, so each entry in `site.ts`
  carries its own `maxH` — roughly `max-h-12` at 2:1 down to `max-h-9` past 4:1 — chosen to land
  every mark near 4700px². Re-measure when a logo is replaced.

  **The `max-w-[min(100%,9rem)]` cap on the image is load-bearing.** Those `maxH` values were tuned
  against the footer's fixed 144px-wide tile, where marks past ~4:1 hit the *width* limit before the
  height limit. The grid's tiles are wider than that at desktop, so without the cap those marks stop
  being width-limited and measure ~6500px² against ~4700px² for the compact ones. The cap makes
  every breakpoint behave like the tile the numbers were picked for.

`AmcPartner.logo` is nullable and falls back to a plain wordmark tile. Nothing uses it today, but it
is the graceful degradation for an AMC whose mark is missing or unusable, and it is how Aditya Birla
Sun Life rendered for the few hours before a usable logo was supplied.

A **grid, never a horizontal strip** — see [mobile-viewport-pitfalls](mobile-viewport-pitfalls.md);
nothing on this site scrolls sideways.

## Global framework (every page)

1. **Sticky regulatory top banner** — topmost bar, above main nav. See [regulatory-compliance](regulatory-compliance.md).
2. **Main header & navigation** — sticky on scroll, brand mark + primary links + CTA. See [site-architecture](site-architecture.md).
3. **Floating quick-contact** — WhatsApp trigger, bottom-right. See [contact-channels](contact-channels.md).
4. **Statutory footer** — risk warning, disclaimer, grievance links, registration metadata. See [regulatory-compliance](regulatory-compliance.md).

## Active nav state

The current page's nav link gets a persistent visual indicator, distinct from hover: a 2px accent underline on desktop, a 4px accent left-border + tinted background on mobile. Styling lives entirely in `aria-[current=page]:` Tailwind variants in `Header.astro`, so anything that sets `aria-current="page"` on a nav link — the server-rendered `isActiveNavItem()` for real routes, or the homepage's `#about` scroll-spy script in `BaseLayout.astro` for the one hash-based nav item — gets the correct look for free. `isActiveNavItem()` deliberately excludes hash-only entries (`/#about`) on its own pass, since a same-page anchor isn't a separate route and matching it by pathname would light up two nav items at once on first paint; see [site-architecture](site-architecture.md#nav-active-state-scroll-spy) for how About's highlight is actually driven.

**Gotcha for anyone touching this:** comparing `Astro.url.pathname` against a nav `href` needs two independent normalizations, not one — `import.meta.env.BASE_URL` isn't guaranteed to have a trailing slash, and Astro's static output gives nested pages a trailing slash that the homepage doesn't have. Skipping either produces a `//solutions` or `/solutions/` that silently never matches `/solutions`. See the comment above `isActiveNavItem` in `Header.astro` for the exact fix.

Related: [site-architecture](site-architecture.md) · [regulatory-compliance](regulatory-compliance.md)
