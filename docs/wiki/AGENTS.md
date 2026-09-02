# Operating instructions for docs/wiki/

Governs how any agent (Claude or otherwise) maintains `docs/wiki/`. Scoped to this
folder — it does not override the root `CLAUDE.md`, and where the two disagree,
`CLAUDE.md` wins.

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

## The three jobs

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

### TIDY

Produce a **punch list only**, never auto-fix:

- Pages contradicting each other, or contradicting shipped code.
- Claims gone stale — a "not built" item that now exists, a superseded decision,
  a dated fact that has passed.
- Orphan pages nothing links to.
- Topics that keep coming up with no page of their own.

Present it and stop. Fixes are a follow-up pass.

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
