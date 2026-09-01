# Knowledge Corner (`/knowledge-corner`)

Educational content hub, added 2026-09-01. Three content types, all managed from `/admin/knowledge`,
all with draft/published states.

## Structure

- **Articles** — original posts written in the admin panel as Markdown, rendered to static pages at
  `/knowledge-corner/[slug]` by `getStaticPaths()`. Search engines see the full text.
- **Videos** — YouTube links rendered as click-to-load facades. Nothing is requested from any
  Google domain until the visitor clicks play; the poster is a CSS gradient drawn by this site.
- **Further Reading** — curated links to third-party material, opened in a new tab with
  `rel="noopener noreferrer nofollow"`.

Each section renders an explicit empty state. On day one all three are empty, and that must look
deliberate rather than broken.

## Compliance

This is the highest-risk surface on the site: free-text articles are where distribution-only copy
drifts into personalised advice. Three controls, in order of authority:

1. `posts_publish_requires_ack` CHECK — an article cannot be published without `compliance_ack`.
2. `assert_post_compliance()` trigger — scans title, excerpt and body for prohibited phrasing on
   publish and rejects with the offending phrase named.
3. `src/lib/compliance-lint.ts` — the same list, linted live in the editor, with Publish disabled
   while hits remain. Convenience only; (1) and (2) are what cannot be bypassed.

Every article page and the index render `ComplianceCallout.astro`. Third-party links carry an
explicit non-endorsement statement, repeated in Terms §5.

## Build safety

`src/lib/knowledge.ts` never throws and falls back live → `src/data/knowledge.snapshot.json` → empty.
The snapshot tier is the important one: without it, a Supabase outage produces a **green build that
404s every article URL that was live a minute earlier**. Refresh it with `npm run sync:knowledge`
after publishing, and commit it.

Markdown is rendered at build time by `src/lib/markdown.ts`, which drops raw HTML outright rather
than sanitising after the fact, and degrades `javascript:`/`data:` links to plain text. Verified
against a real build.

## Publishing

Saving in the admin panel writes to Supabase but does not change the live site — it is static. The
**Publish to site** button calls the `publish-site` edge function, which triggers a Vercel Deploy
Hook. Content appears in about one to two minutes. Repeat presses within 60s are debounced.

Related: [admin-dashboard](admin-dashboard.md) · [data-model](data-model.md) ·
[regulatory-compliance](regulatory-compliance.md)
