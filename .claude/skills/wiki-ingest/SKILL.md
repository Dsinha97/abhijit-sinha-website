---
name: wiki-ingest
description: Update docs/wiki/ from what changed since the last ingest — reads docs/wiki/.pending-ingest (or falls back to git log since docs/wiki/log.md's last entry), updates or creates the right topic pages, cross-links them, logs it, runs a quick tidy pass, and reports what needs attention. Use when asked to "ingest", "wiki-ingest", "update the wiki", or after shipping a change whose reasoning is not obvious from the diff.
---

# Wiki ingest

Runs the INGEST + a quick TIDY pass defined in
[docs/wiki/AGENTS.md](../../../docs/wiki/AGENTS.md) — **read that file first**, it is
the operating contract; this skill is the trigger and the mechanics.

Ported from the FPL App project. One thing is deliberately inverted here: in that
repo `roadmap.md` outranks the wiki, whereas in this one `docs/wiki/` is the
authoritative reference and `docs/sources/` is provenance only. Shipped code is
what outranks the wiki. `AGENTS.md` explains this — don't apply the FPL rule.

## Steps

1. **Find what changed.**
   - If `docs/wiki/.pending-ingest` exists and is non-empty, read it — one path
     per line, written by `scripts/hooks/post-commit`.
   - Otherwise fall back to a `git log` since the last dated entry in
     `docs/wiki/log.md`, **widened by a day**:
     ```bash
     git log --since="<last log.md date> -1 day" --name-only --oneline -- docs/sources CLAUDE.md README.md src supabase astro.config.mjs
     ```
     The `-1 day` is not padding. `--since="2026-09-02"` silently returned
     nothing here for commits made at 10:00 that same day, so anchoring exactly
     on the log date can miss the very commits you are ingesting. Over-reporting
     is harmless — step 2 filters — while under-reporting loses the change.
   - If neither yields anything, say so and stop — nothing to ingest.

2. **Filter to what is actually wiki-worthy.** This repo's watched paths include
   `src/`, so a raw diff list will contain plenty that does not belong in a
   knowledge base. Ingest a change when it alters **behaviour, a decision, a
   constraint, or a rule** — a compliance rule, a data-model change, a page's
   content or sections, a design-system value, a deployment or domain step, a bug
   whose cause is non-obvious and would otherwise be rediscovered the hard way.
   Skip pure refactors, formatting, dependency bumps, and copy tweaks that change
   no meaning. When unsure, ask rather than padding the wiki.

3. **For each kept change**, follow `AGENTS.md`'s INGEST job: update the existing
   page for that topic (never a near-duplicate), create a page only for a
   genuinely new topic and add it to `docs/wiki/index.md` under the right
   section, and cross-link both directions.

   Route by topic — `page-*.md` for a specific page's content, `design-system.md`
   for visual/layout rules, `regulatory-compliance.md` for anything statutory,
   `data-model.md` / `admin-dashboard.md` for Supabase and `/admin`,
   `deployment-domain.md` for hosting, `mobile-viewport-pitfalls.md` for layout
   traps that don't reproduce on desktop, `calculators.md` for the maths.

4. **Append one line per logical change to `docs/wiki/log.md`**, dated
   `YYYY-MM-DD`, newest at the end of the list (match the file's existing style).

5. **If the change creates a rule a future agent must not violate**, add it to
   the root `CLAUDE.md` too, in the matching section. The wiki is read on demand;
   `CLAUDE.md` is read every session. This is the difference between a rule that
   holds and a rule that gets rediscovered by breaking it.

6. **Clear `docs/wiki/.pending-ingest`** — truncate it, don't delete the file.

7. **Quick TIDY pass** — not a full audit: does anything you just wrote
   contradict another page or the shipped code? Any claim you added that is
   already stale? List findings, don't auto-fix beyond step 3.

8. **Report**: what was updated or created, and a short "needs your attention"
   note if step 7 found anything.

## Ground rules

Inherited from `docs/wiki/AGENTS.md` and the root `CLAUDE.md`:

- Only `docs/wiki/` pages (and `CLAUDE.md` for rule changes) get written. Never
  edit `docs/sources/`; never move, rename or delete anything without sign-off.
- Never delete wiki content — correct a wrong claim in place, with a note.
- Plain markdown only.
- Never write a behavioural claim as verified without checking it against the
  running site, a build, or the database.
- Never introduce a regulatory identifier that differs from `src/data/site.ts`,
  and keep unconfirmed figures visibly marked as placeholders.
- Nothing from `Important Docs/` goes into the wiki beyond identifiers already
  public in `site.ts`.
