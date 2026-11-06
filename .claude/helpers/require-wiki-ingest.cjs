#!/usr/bin/env node
/*
 * PreToolUse (Bash, PowerShell) guard: refuse `gh pr create` until /wiki-ingest
 * has run on the branch.
 *
 * Why: in this repo docs/wiki/ is the authoritative reference, and it documents
 * shipped behaviour. A PR merged without an ingest leaves the wiki describing a
 * site that no longer exists. A hook cannot run a skill, so it blocks and says
 * what to do.
 *
 * The test: /wiki-ingest always appends to docs/wiki/log.md, so a branch whose
 * diff against origin/main includes that file has been ingested. Passes without
 * it when:
 *   - every changed file is under docs/ (a docs-only PR, often the ingest
 *     itself), or
 *   - no changed file is under the paths the wiki documents (see WATCHED), or
 *   - a commit message on the branch contains [skip-ingest].
 * Anything unexpected (not a git repo, no origin/main) fails open: a guard that
 * breaks PR creation for an unrelated reason is worse than no guard.
 *
 * WATCHED mirrors scripts/hooks/post-commit. Keep the two in step.
 */
const { execFileSync } = require('node:child_process');

const WATCHED = /^(docs\/sources\/|src\/|supabase\/|scripts\/|CLAUDE\.md|README\.md|astro\.config\.mjs|vercel\.json)/;
const allow = () => process.exit(0);

let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    return allow();
  }

  const command = payload?.tool_input?.command ?? '';
  if (!/\bgh\s+pr\s+create\b/.test(command)) return allow();

  const cwd = payload.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const git = (...args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

  let changed, messages;
  try {
    const base = git('merge-base', 'HEAD', 'origin/main');
    changed = git('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean);
    messages = git('log', '--format=%B', `${base}..HEAD`);
  } catch {
    return allow();
  }

  if (changed.length === 0) return allow();
  if (changed.includes('docs/wiki/log.md')) return allow();
  if (changed.every((file) => file.startsWith('docs/'))) return allow();
  const watched = changed.filter((file) => WATCHED.test(file));
  if (watched.length === 0) return allow();
  if (messages.includes('[skip-ingest]')) return allow();

  const reason =
    'Run /wiki-ingest before opening this PR: this branch changes ' +
    `${watched.length} file(s) the wiki documents (for example ${watched[0]}) but docs/wiki/log.md ` +
    'is unchanged, so the wiki has not recorded it. Commit the ingest to this branch, then retry. ' +
    'If the change genuinely needs no wiki entry, add [skip-ingest] to a commit message on the branch and say why.';

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
  allow();
});
