---
name: ship-check
description: Run the pre-commit/pre-push gate - astro check, production build, compliance grep - and report pass/fail per stage. Use before committing or pushing, or when asked to "run the gate", "check before I push", or "ship check".
---

# Ship Check

This repo has no test suite. The gate is three stages:

```bash
npx astro check && npm run build && node .claude/skills/compliance-check/scripts/check.mjs
```

## How it works

`scripts/check.sh` runs each stage separately, not chained with `&&`, so a failure in an earlier
stage does not hide whether later ones would also fail. It prints a PASS/FAIL line per stage, the
tail of any failing stage, and exits non-zero if any stage failed.

## Usage

1. Run `bash .claude/skills/ship-check/scripts/check.sh` from the repo root.
2. Report the PASS/FAIL line for each stage. The verdict is the exit code, never a line of output.
3. If a stage FAILs, fix it and re-run the whole script. Do not commit or push until all pass.
4. WARN lines from the compliance stage do not fail the gate. Read each one and say whether it is
   a real problem. Do not hide them.

`main` is protected, so passing the gate is followed by a branch and a PR, not a direct push.
For a layout change, also run `responsive-check`. For copy changes, `compliance-check` explains
what the compliance stage does and does not catch.
