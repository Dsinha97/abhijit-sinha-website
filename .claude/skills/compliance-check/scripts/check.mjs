#!/usr/bin/env node
/*
 * Compliance gate for the Abhijit Sinha site. Read-only. Run from the repo root:
 *   node .claude/skills/compliance-check/scripts/check.mjs
 *
 * Exit 1 on any FAIL. WARN lines are for human review and do not fail the run.
 * Mirrors CLAUDE.md "Compliance rules"; if a rule there changes, change it here.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const results = { FAIL: 0, WARN: 0, PASS: 0 };
const say = (level, msg) => {
  results[level]++;
  console.log(`${level}: ${msg}`);
};

function walk(dir, exts, out = []) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return out;
  for (const name of readdirSync(abs)) {
    const rel = join(dir, name);
    const st = statSync(join(ROOT, rel));
    if (st.isDirectory()) walk(rel, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(rel);
  }
  return out;
}
const posix = (p) => p.split(sep).join('/');

// 1. Locked identifiers must exist in site.ts exactly as CLAUDE.md records them.
const site = read('src/data/site.ts');
const locked = [
  ['ARN', "arn: 'ARN-367596'"],
  ['EUIN', "euin: 'E703717'"],
  ['NISM certification', 'NISM Series V-A'],
  ['principal address', 'Sector 35E, Kharghar, Navi Mumbai, Panvel, Maharashtra 410210'],
  ['phone', "phone: '+91-8976539234'"],
  ['email', "email: 'support@abhijitsinha.in'"],
];
for (const [label, needle] of locked) {
  if (site.includes(needle)) say('PASS', `locked identifier present in site.ts: ${label}`);
  else say('FAIL', `locked identifier changed or missing in site.ts: ${label} (expected ${needle})`);
}

// 2. Footer must render both statutory notices from site.ts, unconditionally.
const footer = read('src/components/Footer.astro');
for (const key of ['riskWarning', 'regularPlanNotice']) {
  if (footer.includes(`statutory.${key}`)) say('PASS', `Footer.astro renders statutory.${key}`);
  else say('FAIL', `Footer.astro no longer renders statutory.${key}`);
}
if (!/subject to market risks/i.test(site)) say('FAIL', 'site.ts risk-warning sentence missing');
if (!/Regular Plans/.test(site)) say('FAIL', 'site.ts Regular Plans notice missing');
const footerBody = footer.split('---').slice(2).join('---');
const gated = /\{[^}]*(Astro\.url|pathname|\?|&&)[^}]*statutory\.(riskWarning|regularPlanNotice)/.test(footerBody);
if (gated) say('FAIL', 'Footer.astro appears to gate a statutory notice behind a condition');

// 3. Banned phrases (parsed from the single list in compliance-lint.ts) across public copy.
const lintSrc = read('src/lib/compliance-lint.ts');
const listBody = lintSrc.match(/BANNED_PATTERNS[^=]*=\s*\[([\s\S]*?)\]/);
const patterns = listBody
  ? [...listBody[1].matchAll(/(['"])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2])
  : [];
if (patterns.length === 0) say('FAIL', 'could not parse BANNED_PATTERNS from src/lib/compliance-lint.ts');
const copyFiles = [
  ...walk('src/pages', ['.astro', '.md', '.mdx']).filter((f) => !posix(f).startsWith('src/pages/admin')),
  ...walk('src/components', ['.astro']),
  ...walk('src/layouts', ['.astro']),
  'src/data/site.ts',
  ...(existsSync(join(ROOT, 'src/data/knowledge.snapshot.json')) ? ['src/data/knowledge.snapshot.json'] : []),
];
let hits = 0;
for (const file of copyFiles) {
  const lines = read(file).split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const p of patterns) {
      const m = new RegExp(p, 'i').exec(line);
      if (m) {
        hits++;
        say('WARN', `banned phrase "${m[0]}" at ${posix(file)}:${i + 1} - confirm it is not advice or a guarantee`);
      }
    }
  });
}
if (hits === 0) say('PASS', `no banned phrases in ${copyFiles.length} copy files (${patterns.length} patterns)`);

// 4. Contact form must not collect folio, PAN or bank details.
const form = read('src/components/ContactForm.astro');
const fields = [...form.matchAll(/<(?:input|textarea|select)\b[^>]*\bname=["']([^"']+)["']/g)].map((m) => m[1]);
const forbidden = fields.filter((n) => /folio|\bpan\b|bank|account|ifsc|aadhaar/i.test(n));
if (forbidden.length) say('FAIL', `ContactForm.astro collects financial identifiers: ${forbidden.join(', ')}`);
else say('PASS', `ContactForm.astro fields carry no financial identifiers (${fields.join(', ') || 'none parsed'})`);

// 5. Inline copies of identifiers outside site.ts (CLAUDE.md: never hardcode them inline).
const inline = [];
for (const file of [...walk('src/pages', ['.astro']), ...walk('src/components', ['.astro']), ...walk('src/layouts', ['.astro'])]) {
  read(file).split(/\r?\n/).forEach((line, i) => {
    if (/367596|E703717|8976539234/.test(line)) inline.push(`${posix(file)}:${i + 1}`);
  });
}
if (inline.length) say('WARN', `identifier typed inline instead of read from site.ts at ${inline.length} place(s): ${inline.slice(0, 12).join(', ')}${inline.length > 12 ? ', ...' : ''}`);
else say('PASS', 'no identifiers hardcoded outside site.ts');

// 6. Sensitive files must not be tracked or copied into build inputs.
if (existsSync(join(ROOT, 'public')) && walk('public', ['.pdf']).length) {
  say('FAIL', `PDF in public/ - Important Docs must never be copied there: ${walk('public', ['.pdf']).map(posix).join(', ')}`);
} else say('PASS', 'no PDFs under public/');

console.log(`\nsummary: ${results.PASS} pass, ${results.WARN} warn, ${results.FAIL} fail`);
process.exit(results.FAIL ? 1 : 0);
