# Contact Channels

How a visitor reaches Abhijit across the site. Sources: [whatsapp-contact.md](../sources/whatsapp-contact.md), [homepage.md](../sources/homepage.md), [schedule.md](../sources/schedule.md), [investor-services.md](../sources/investor-services.md).

## Channels

| Channel | Detail | Where it appears |
|---|---|---|
| Floating WhatsApp button | `wa.me/918976539234`, prefilled message "Hello Abhijit, I would like to know more about mutual fund investments and SIPs." | Every page, bottom-right, fixed position |
| Direct email | `support@abhijitsinha.in` | Footer, `/schedule`, `/disclosures` |
| Direct phone | `+91-8976539234` (Mon–Fri 10am–6pm IST) | Footer, `/schedule` |
| Homepage inquiry form | Name, Email, Mobile, Investment Goal, Mode (SIP/Lump Sum) | `/` `#contact` |
| Investor Services request form | Name, Email, Mobile, Folio (optional), Service Category dropdown, Message | `/investor-services` |
| Scheduler | Booking UI, tool TBD (Cal.com / Calendly / Google Calendar) | `/schedule` — see [page-schedule](page-schedule.md) |
| LinkedIn | `distributor.linkedin` in `site.ts`, opens in a new tab | `/` `#about`, under the profile credentials card |

## WhatsApp button component

Standard SVG icon, `aria-label` for screen readers, visible focus ring, 44–48px touch target, opens `wa.me` link in a new tab. Phone number and default message are props, not hardcoded — sourced from site config. Collapsed to an icon-only circle by default at every breakpoint; the "Chat on WhatsApp" label expands on `hover`/`focus-visible` (both, so keyboard users get the same reveal). The accessible name comes from the anchor's `aria-label` regardless of whether the label text is visible.

## Form submission handling (not specified in source docs)

The specs describe form *fields* but not a backend — the handling below is an implementation decision layered on top of them, not something the specs prescribe.

Both forms POST to the Supabase `submit-lead` edge function (`PUBLIC_FORM_ENDPOINT`), which validates the submission, stores it in the `leads` table, and emails a copy. See [data-model.md](data-model.md) for the endpoint contract and [admin-dashboard.md](admin-dashboard.md) for the inbox that reads it. When `PUBLIC_FORM_ENDPOINT` is empty, `ContactForm.astro` still degrades to its original disabled/informational state.

**The folio-number field was removed** from the Investor Services form. Folio numbers are financial identifiers, and collecting them through a web form means storing sensitive account data at rest for no operational gain; they are collected over WhatsApp or phone once contact is established. The form copy now says so explicitly, and Privacy Policy §5.1 asks visitors not to enter account identifiers. Do not reintroduce the field without a retention policy and a matching disclosure.

## Unconfirmed mailboxes

`support@abhijitsinha.in` is live and is the distributor's primary address (`distributor.email` in `src/data/site.ts`). `contact@abhijitsinha.in` and `compliance@abhijitsinha.in` are referenced in the disclosures/investor-services specs but are not yet provisioned — until they are, all mail routes to `support@abhijitsinha.in`.

Related: [regulatory-compliance](regulatory-compliance.md) · [page-schedule](page-schedule.md) · [page-investor-services](page-investor-services.md)
