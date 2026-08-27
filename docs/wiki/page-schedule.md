# Page: Schedule (`/schedule`)

Sources: [schedule.md](../sources/schedule.md) (primary), corroborated by the appended blueprint in [homepage.md](../sources/homepage.md). Title: "Schedule a Meeting \| Abhijit Sinha (ARN-367596)".

## Layout

Two-column:

- **Left — meeting context:** headline "Plan Your Investment Journey with Clarity"; key discussion points (Goal Mapping, Risk Profile Assessment, Portfolio Review, Process Clarity); meeting details card (15–20 min, Google Meet or phone call, host bio, no mandatory prep).
- **Right — interactive booking:** date/time picker, IST timezone notice, intake fields (Name, Email, Mobile, Meeting Preference, optional Goal Note), "Confirm Booking" action.

## Scheduler tool decision

The source specs mention a Cal.com / Calendly placeholder integration, but the tool is **not yet chosen** — it may end up being Cal.com, Calendly, or Google Calendar Appointment Schedules. The implementation should keep this swappable via one config field rather than hardcoding a vendor. Until an account exists, the right column ships as a styled placeholder using the direct-contact channels below.

## Alternative direct contact section

"Prefer a written inquiry or direct call?" — grid of Direct Email (`support@abhijitsinha.in`), Direct Phone (`+91-8976539234`, Mon–Fri 10am–6pm IST), and a link back to the homepage `#contact` form.

## Footer

Shared statutory footer plus: "Need immediate assistance? Email ... or call ...", registered details (ARN, email, phone, copyright, Navi Mumbai).

Related: [contact-channels](contact-channels.md) · [page-homepage](page-homepage.md) · [regulatory-compliance](regulatory-compliance.md)
