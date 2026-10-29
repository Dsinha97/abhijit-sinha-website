---
title: "Operating instructions for docs/wiki/"
type: rules
tags: [wiki, conventions]
sources:
  - sources/design-overview.md
related:
  - index.md
  - log.md
updated: 2026-10-28
---

# Operating instructions for docs/wiki/

Second-brain conventions: v2

Governs how any agent (Claude or otherwise) maintains `docs/wiki/`. Scoped to this
folder — it does not override the root `CLAUDE.md`, and where the two disagree,
`CLAUDE.md` wins.

**Load the `second-brain` skill before any request that touches `docs/`** (ingest, answer from the
wiki, tidy, audit). The skill does not always load on its own, which is why its key rules are
written into this file. Where the skill's defaults and this file differ, this file wins.
The vault root for the skill's helper script is `docs/`; run
`python -I <skill folder>/scripts/check_vault.py docs all` from the repo root.

Ported from the FPL App project's wiki contract, with one deliberate inversion —
see "Who wins" below. Do not re-import that version wholesale; the authority
model there is the opposite of this repo's.

## What this wiki is

`docs/wiki/` is synthesis: one page per real topic, written in your own words,
cross-linked, each claim traceable to the file or shipped behaviour it came from.

**Who wins.** In this repo the wiki *is* the authoritative reference — root
`CLAUDE.md` says so explicitly, and `docs/sources/` is provenance only ("don't
edit, and don't treat as more current than the wiki"). So when a wiki page and a
source spec disagree, that is **not** automatically a stale wiki page: the source
spec is a historical document and the wiki may be describing what actually
shipped. Check the code before "correcting" a wiki page to match a source spec.

The one thing that outranks the wiki is the running site plus the live Supabase
schema. A wiki claim contradicted by shipped code is a wiki bug.

## Folder conventions

<!-- RETRO fills this in over time. Each line is a rule learned from a correction the owner gave
Claude while working in docs/wiki/ specifically — not a general repo rule, those belong in root
CLAUDE.md. Empty until the first RETRO pass has something to add. -->

- **Page frontmatter.** Every topic page starts with `title`, `type`, `tags`, `sources`, `related`,
  `updated`. `type` is one of `page` (one site route), `system` (architecture, data, deploy,
  security), `policy` (compliance, legal copy), `design`, `backlog`, `rules`. `related` mirrors the
  page's outbound `.md` links; `sources` lists paths relative to `docs/`.
- **Sources section.** Every page ends with `## Sources`. Pages that describe shipped behaviour
  rather than a spec cite the code path or system and the `log.md` entry, not just a spec file.
- **Evidence.** `docs/wiki/.manifest.json` records a hash and an `evidence` level per file in
  `docs/sources/`. The competitive-benchmarking document is `second-hand`: say so on any page that
  leans on it, and keep that source out of git (see `improvement-backlog.md`).
- **Log lines are short.** One entry per ingest, about 300 characters: date, source, evidence,
  what was left unread, pages touched. Narrative belongs in the commit or PR. Existing long entries
  stay as they are; never rewrite history.
- **Page counts live in `index.md` only.** Do not hard-code them here.
- **Start every wiki task from a current `main`.** `main` is protected and PRs are squash-merged, so
  local `main` is behind after each merge. Before branching, run `git checkout main && git pull`,
  then branch from there.

## The jobs

### INGEST

When source material or shipped behaviour changes:

1. Read what changed.
2. Find the existing wiki page(s) the topic belongs to and update them. **Never
   create a near-duplicate page** — only create one for a genuinely new topic
   with no existing home, and add it to `index.md` under the right section.
3. Write synthesis, not a changelog paste. Say what the thing now does and why,
   including the reasoning that would otherwise be lost — a decision without its
   rationale gets re-litigated six months later.
4. Cross-link both directions: if page A now leans on page B's topic, B should
   point back where it helps.
5. Append one line to `log.md`, dated `YYYY-MM-DD`.
6. If the change alters a rule an agent must not violate, also add it to the root
   `CLAUDE.md` — the wiki is read on demand, `CLAUDE.md` is read every session.

Ingest only ever writes to `docs/wiki/` and (for rule changes) `CLAUDE.md`. It
never edits `docs/sources/`.

### ANSWER

Answer from the wiki first and name the page you used ("— see
`mobile-viewport-pitfalls.md`"). If the wiki does not cover it, say so plainly
rather than improvising, then go read the code and say that is what you are
doing — a gap you had to fill from source is a gap worth writing up next ingest.

Work outward from `index.md`: the page that covers the topic, then at most two more link hops.
Whenever you looked at wiki pages to answer, finish with these two lines, even for a short answer:

```
Pages used: <wiki pages opened, as links>
Linked but not opened: <titles those pages link to that you did not open, or none>
```

If the wiki does not cover the question, say so first and still end with the footer. When an answer
combines several pages into something no single page states, offer once to save it as a page
(marked as a synthesis, not a new source).

### TIDY

Produce a **punch list only**, never auto-fix:

- Pages contradicting each other, or contradicting shipped code.
- Claims gone stale — a "not built" item that now exists, a superseded decision,
  a dated fact that has passed.
- Orphan pages nothing links to.
- Topics that keep coming up with no page of their own.

Present it and stop. Fixes are a follow-up pass.

Run RETRO (below) at the end of the same TIDY pass, unless only the punch list was asked for. Skip
it on the first TIDY if there's no history yet to look back on.

### RETRO

This file is written once and otherwise never changes, so a correction the owner keeps repeating —
wrong section for a topic, a tagging habit that keeps getting missed, how a certain kind of page
should be named — gets re-learned from scratch every session instead of sticking.

- Look back over this conversation (and recent past sessions, if transcript access is available) for
  moments where the owner corrected how something in `docs/wiki/` specifically was organised,
  tagged, or named — not general project preferences, those belong in root `CLAUDE.md` or Claude's
  own memory, not here.
- Distill each real, **recurring** correction into one short rule. A single one-off fix isn't a
  convention; the same correction happening twice is.
- Compare against **Folder conventions** above: add what's new and non-conflicting, let the newest
  correction replace a conflicting older line, and drop anything that no longer applies.
- **Show the exact lines being added, changed, or removed before writing them** — this is the one
  part of TIDY that edits this file itself, so it gets a diff and waits for a "yes"; everything else
  in TIDY only reports.
- On approval, update **Folder conventions** and append a line to `log.md` noting the change.

Keep **Folder conventions** short — a handful of sharp rules beats a long vague list. If it passes
~15 lines, fold related ones together instead of letting it sprawl.

## Ground rules

- **Never move, rename, or delete a file without explicit sign-off.** Never
  delete wiki content: correct a wrong claim in place, with a note.
- **Plain markdown only.**
- **Never state something as verified without checking it.** Wiki claims about
  behaviour should be confirmed against the running site, a build, or the
  database before being written as fact.
- **Compliance content is not wiki-editable prose.** The statutory identifiers
  (ARN, EUIN, NISM, phone, email, office city) live in `src/data/site.ts` and are
  listed in `CLAUDE.md`; a wiki page may describe them but must never introduce a
  different value, and unconfirmed figures stay visibly marked as placeholders.
- **Nothing from `Important Docs/` gets copied into the wiki** beyond the
  identifiers already public in `site.ts` — the PDFs are sensitive and local-only.

## Automation

`scripts/hooks/post-commit` appends changed source paths to
`docs/wiki/.pending-ingest` (gitignored). Install it per clone:

```bash
cp scripts/hooks/post-commit .git/hooks/post-commit && chmod +x .git/hooks/post-commit
```

If the hook or the marker file is missing, `git log` since `log.md`'s last dated
entry is the fallback for "what changed". The hook is optional — the skill works
without it.

## Sources

- Ported from the FPL App project's wiki contract (see "Who wins" above for the inverted authority model).
- Skill conventions: `second-brain` skill, v2.
