# Page: Schedule (`/schedule`)

Sources: [schedule.md](../sources/schedule.md) (primary), corroborated by the appended blueprint in [homepage.md](../sources/homepage.md). Title: "Schedule a Meeting \| Abhijit Sinha (ARN-367596)".

## Layout

Two-column:

- **Left — meeting context:** headline "Plan Your Investment Journey with Clarity"; key discussion points (Goal Mapping, Risk Profile Assessment, Portfolio Review, Process Clarity); meeting details card (15–20 min, Google Meet or phone call, host bio, no mandatory prep) — since 2026-09-06 this card also carries **Office**, **Office Hours** and a "Get directions" link out to the Google Business Profile.
- **Right — interactive booking:** date/time picker, IST timezone notice, intake fields (Name, Email, Mobile, Meeting Preference, optional Goal Note), "Confirm Booking" action.

## Scheduler tool decision

The scheduler is **Calendly** (`https://calendly.com/abhijitsinha-support/30min`), set through the single `scheduler` config field in `src/data/site.ts`; the component stays provider-agnostic so a later move to Cal.com or Google Calendar Appointment Schedules remains a one-line edit. With `provider: 'none'` the right column falls back to the styled placeholder using the direct-contact channels below.

The embed is **click-to-load**: `SchedulerEmbed.astro` renders a facade and only creates the iframe once the visitor presses "Load booking calendar", so no request reaches Calendly on page view. That is the same treatment the Knowledge Corner gives YouTube, and it is what Privacy Policy §5.4 promises — do not add a preconnect, prefetch or provider script tag to the page.

## Alternative direct contact section

"Prefer a written inquiry or direct call?" — grid of Direct Email (`support@abhijitsinha.in`), Direct Phone (`+91-8976539234`, Mon–Sat 10am–7pm IST), and a link back to the homepage `#contact` form.

## Office and the Google Business Profile (2026-09-06)

The logistics card gained the office address and hours, and the closing band gained a "Leave a review on Google" line beside the existing email/phone sentence — the listing has no reviews, so this is the page's local-credibility ask.

Both Google links are **plain anchors, not embeds**. That is the same contract the Calendly facade above keeps, for the same reason: nothing may reach a third party on page view. It also means the page needs no `vercel.json` CSP entry — adding a map iframe here would need `frame-src https://www.google.com` and would break the promise in one move. See [contact-channels](contact-channels.md) and [security-hardening](security-hardening.md).

## Footer

Shared statutory footer plus: "Need immediate assistance? Email ... or call ...", registered details (ARN, email, phone, copyright, and the full office address).

Related: [contact-channels](contact-channels.md) · [page-homepage](page-homepage.md) · [regulatory-compliance](regulatory-compliance.md) · [seo-and-metadata](seo-and-metadata.md)
