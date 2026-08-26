# Site Architecture

Route map, navigation, and the shared framework every page mounts. Sources: [design-overview.md](../sources/design-overview.md), [homepage.md](../sources/homepage.md), [seo-tools.md](../sources/seo-tools.md), [whatsapp-contact.md](../sources/whatsapp-contact.md).

## Routes

| Route | Purpose | Wiki page |
|---|---|---|
| `/` | Landing page: hero, philosophy, about, solutions summary, contact | [page-homepage](page-homepage.md) |
| `/#about` | Anchor within homepage | [page-homepage](page-homepage.md) |
| `/solutions` | Asset-class/goal-aligned scheme categories + calculators | [page-solutions](page-solutions.md) |
| `/disclosures` | Commission structure & statutory disclosures | [page-disclosures](page-disclosures.md) |
| `/investor-services` | RTA links, servicing, grievance redressal | [page-investor-services](page-investor-services.md) |
| `/schedule` | 1:1 meeting booking | [page-schedule](page-schedule.md) |
| `/privacy-policy` | Privacy policy | [legal-copy](legal-copy.md) |
| `/terms` | Terms of use | [legal-copy](legal-copy.md) |

## Shared framework (present on every page)

1. **Regulatory strip** — Oxford Navy `#0F172A`. Left: "AMFI-Registered Mutual Fund Distributor \| ARN-367596". Right: "NISM Series V-A Certified".
2. **Header** — logo (`logo.jpg` in spec; actual asset is `logo.png`) linked to `/`; center nav Home / About / Solutions / Disclosures / Investor Services; right CTA "Schedule a Meeting" → `/schedule`; mobile hamburger menu. The current nav item gets a visible indicator (underline on desktop, left accent bar on mobile) plus `aria-current="page"` — see [design-system](design-system.md#active-nav-state) for the mechanism.

Both the strip and header live inside one wrapper (`#site-header` in `BaseLayout.astro`) that shrinks — smaller nav height, smaller logo, tighter strip padding/type — once the page scrolls past ~32px, via a `data-scrolled` attribute toggled from a plain scroll listener. The regulatory strip is never hidden while scrolled, only shrunk, to keep the AMFI/ARN proof visible per the design system's proof-first rule.
3. **`<slot/>`** — page content.
4. **Footer** — statutory risk warning box, distributor disclaimer, CAMS/KFintech/SEBI SCORES 2.0 links, office/registration metadata, copyright. Full text in [regulatory-compliance](regulatory-compliance.md).
5. **Floating WhatsApp button** — bottom-right, all viewports, collapsed to just the icon and expanding to show the label on hover/focus. See [contact-channels](contact-channels.md).

This maps directly to an Astro `BaseLayout.astro` wrapping `RegulatoryStrip` + `Header` + page slot + `Footer` + `WhatsAppButton`, with `SEO.astro` in the `<head>` — see [seo-and-metadata](seo-and-metadata.md).

### Overlay header (homepage only)

`BaseLayout` takes an `overlayHeader` prop, set only by `index.astro`. It changes exactly one thing: whether `#site-header` is `sticky top-0` (every other page) or `fixed inset-x-0 top-0` (homepage). Once scrolled even slightly, a "stuck" sticky element and a fixed one are visually identical — a fixed header only differs at scroll position zero, where it reserves no space at all, letting the homepage's hero banner run all the way to the top of the page instead of starting below the header's height. No padding-compensation is needed elsewhere on the page for this: since a pinned header always overlaps whatever's currently scrolled beneath it regardless of `sticky` vs `fixed`, nothing about how later sections render actually changes.

The same prop is forwarded to `RegulatoryStrip`/`Header` as `overlay`, which only changes their *resting* (pre-scroll) background to a translucent one — the post-scroll "solid" state (`group-data-[scrolled]:...`) is identical either way, so scrolling any distance snaps both back to looking like every other page.

### Nav active-state scroll-spy

`isActiveNavItem` in `Header.astro` only ever highlights real routes server-side — `/#about` is deliberately excluded there, since matching by pathname alone would light up both Home and About together on the homepage. A small script in `BaseLayout.astro` covers the rest: an `IntersectionObserver` on `#about` flips `aria-current="page"` between the Home and About nav links (found via `data-nav-href`, present on all four desktop+mobile instances) as the section enters/leaves view. It no-ops entirely on pages without `#about`. Active-item *styling* is driven purely by `aria-[current=page]:` Tailwind variants in `Header.astro`, so this script only ever has to toggle one attribute rather than juggle classes itself.

## Asset naming discrepancy

The specs reference `logo.jpg` / `banner.jpg`, but the actual files in `Images/` are `logo.png` / `banner.png`. Any implementation must use the real `.png` filenames — this note exists so that discrepancy isn't silently reintroduced from the source docs.

Related: [design-system](design-system.md) · [seo-and-metadata](seo-and-metadata.md) · [contact-channels](contact-channels.md)
