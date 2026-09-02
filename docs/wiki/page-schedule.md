# Page: Schedule (`/schedule`)

Sources: [schedule.md](../sources/schedule.md) (primary), corroborated by the appended blueprint in [homepage.md](../sources/homepage.md). Title: "Schedule a Meeting \| Abhijit Sinha (ARN-367596)".

## Layout

Two-column:

- **Left — meeting context:** headline "Plan Your Investment Journey with Clarity"; key discussion points (Goal Mapping, Risk Profile Assessment, Portfolio Review, Process Clarity); meeting details card (15–20 min, Google Meet or phone call, host bio, no mandatory prep).
- **Right — interactive booking:** date/time picker, IST timezone notice, intake fields (Name, Email, Mobile, Meeting Preference, optional Goal Note), "Confirm Booking" action.

## Scheduler tool decision

The scheduler is **Calendly** (`https://calendly.com/abhijitsinha-support/30min`), set through the single `scheduler` config field in `src/data/site.ts`; the component stays provider-agnostic so a later move to Cal.com or Google Calendar Appointment Schedules remains a one-line edit. With `provider: 'none'` the right column falls back to the styled placeholder using the direct-contact channels below.

The embed is **click-to-load**: `SchedulerEmbed.astro` renders a facade and only creates the iframe once the visitor presses "Load booking calendar", so no request reaches Calendly on page view. That is the same treatment the Knowledge Corner gives YouTube, and it is what Privacy Policy §5.4 promises — do not add a preconnect, prefetch or provider script tag to the page.

## Alternative direct contact section

"Prefer a written inquiry or direct call?" — grid of Direct Email (`support@abhijitsinha.in`), Direct Phone (`+91-8976539234`, Mon–Fri 10am–6pm IST), and a link back to the homepage `#contact` form.

## Footer

Shared statutory footer plus: "Need immediate assistance? Email ... or call ...", registered details (ARN, email, phone, copyright, Navi Mumbai).

Related: [contact-channels](contact-channels.md) · [page-homepage](page-homepage.md) · [regulatory-compliance](regulatory-compliance.md)
