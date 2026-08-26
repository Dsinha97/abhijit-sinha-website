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

## Global framework (every page)

1. **Sticky regulatory top banner** — topmost bar, above main nav. See [regulatory-compliance](regulatory-compliance.md).
2. **Main header & navigation** — sticky on scroll, brand mark + primary links + CTA. See [site-architecture](site-architecture.md).
3. **Floating quick-contact** — WhatsApp trigger, bottom-right. See [contact-channels](contact-channels.md).
4. **Statutory footer** — risk warning, disclaimer, grievance links, registration metadata. See [regulatory-compliance](regulatory-compliance.md).

## Active nav state

The current page's nav link gets a persistent visual indicator, distinct from hover: a 2px accent underline on desktop, a 4px accent left-border + tinted background on mobile. Styling lives entirely in `aria-[current=page]:` Tailwind variants in `Header.astro`, so anything that sets `aria-current="page"` on a nav link — the server-rendered `isActiveNavItem()` for real routes, or the homepage's `#about` scroll-spy script in `BaseLayout.astro` for the one hash-based nav item — gets the correct look for free. `isActiveNavItem()` deliberately excludes hash-only entries (`/#about`) on its own pass, since a same-page anchor isn't a separate route and matching it by pathname would light up two nav items at once on first paint; see [site-architecture](site-architecture.md#nav-active-state-scroll-spy) for how About's highlight is actually driven.

**Gotcha for anyone touching this:** comparing `Astro.url.pathname` against a nav `href` needs two independent normalizations, not one — `import.meta.env.BASE_URL` isn't guaranteed to have a trailing slash, and Astro's static output gives nested pages a trailing slash that the homepage doesn't have. Skipping either produces a `//solutions` or `/solutions/` that silently never matches `/solutions`. See the comment above `isActiveNavItem` in `Header.astro` for the exact fix.

Related: [site-architecture](site-architecture.md) · [regulatory-compliance](regulatory-compliance.md)
