# Contact Channels

How a visitor reaches Abhijit across the site. Sources: [whatsapp-contact.md](../sources/whatsapp-contact.md), [homepage.md](../sources/homepage.md), [schedule.md](../sources/schedule.md), [investor-services.md](../sources/investor-services.md).

## Channels

| Channel | Detail | Where it appears |
|---|---|---|
| Floating WhatsApp button | `wa.me/919004087549`, prefilled message "Hello Abhijit, I would like to know more about mutual fund investments and SIPs." | Every page, bottom-right, fixed position |
| Direct email | `abhijit.uti@gmail.com` | Footer, `/schedule`, `/disclosures` |
| Direct phone | `+91-9004087549` (Mon–Fri 10am–6pm IST) | Footer, `/schedule` |
| Homepage inquiry form | Name, Email, Mobile, Investment Goal, Mode (SIP/Lump Sum) | `/` `#contact` |
| Investor Services request form | Name, Email, Mobile, Folio (optional), Service Category dropdown, Message | `/investor-services` |
| Scheduler | Booking UI, tool TBD (Cal.com / Calendly / Google Calendar) | `/schedule` — see [page-schedule](page-schedule.md) |

## WhatsApp button component

Standard SVG icon, `aria-label` for screen readers, visible focus ring, 44–48px touch target, opens `wa.me` link in a new tab. Phone number and default message are props, not hardcoded — sourced from site config.

## Form submission handling (not specified in source docs)

The specs describe form *fields* but not a backend. Since this is a static site with no server, form submissions need a hosted form endpoint (e.g. Web3Forms/Formspree) that emails submissions to Abhijit — this is an implementation decision layered on top of the source specs, not something the specs themselves prescribe.

## Unconfirmed mailboxes

`support@abhijitsinha.in`, `contact@abhijitsinha.in`, and `compliance@abhijitsinha.in` are referenced in the disclosures/investor-services specs but no domain mailbox exists yet — until one is set up, all mail routes to `abhijit.uti@gmail.com`.

Related: [regulatory-compliance](regulatory-compliance.md) · [page-schedule](page-schedule.md) · [page-investor-services](page-investor-services.md)
