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

Both the strip and header live inside one `sticky top-0` wrapper (`#site-header` in `BaseLayout.astro`) that shrinks — smaller nav height, smaller logo, tighter strip padding/type — once the page scrolls past ~32px, via a `data-scrolled` attribute toggled from a plain scroll listener. The regulatory strip is never hidden while scrolled, only shrunk, to keep the AMFI/ARN proof visible per the design system's proof-first rule.
3. **`<slot/>`** — page content.
4. **Footer** — statutory risk warning box, distributor disclaimer, CAMS/KFintech/SEBI SCORES 2.0 links, office/registration metadata, copyright. Full text in [regulatory-compliance](regulatory-compliance.md).
5. **Floating WhatsApp button** — bottom-right, all viewports. See [contact-channels](contact-channels.md).

This maps directly to an Astro `BaseLayout.astro` wrapping `RegulatoryStrip` + `Header` + page slot + `Footer` + `WhatsAppButton`, with `SEO.astro` in the `<head>` — see [seo-and-metadata](seo-and-metadata.md).

## Asset naming discrepancy

The specs reference `logo.jpg` / `banner.jpg`, but the actual files in `Images/` are `logo.png` / `banner.png`. Any implementation must use the real `.png` filenames — this note exists so that discrepancy isn't silently reintroduced from the source docs.

Related: [design-system](design-system.md) · [seo-and-metadata](seo-and-metadata.md) · [contact-channels](contact-channels.md)
