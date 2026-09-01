/**
 * Prohibited phrasing for Knowledge Corner articles.
 *
 * This site is distribution-only: copy that reads as personalised advice, a
 * return guarantee, or a specific buy recommendation is a regulatory problem,
 * not a style problem. See docs/wiki/regulatory-compliance.md.
 *
 * This list is the *editor-side* half of a two-layer control. It gives the
 * author immediate feedback while typing. The authoritative half is the
 * assert_post_compliance() trigger in Postgres, which carries the same patterns
 * and cannot be bypassed by any client. Keep the two in sync — if you edit this
 * list, edit the trigger too.
 */
export const BANNED_PATTERNS: string[] = [
  'guaranteed return',
  'assured return',
  'risk[- ]free',
  'no risk',
  'sure[- ]shot',
  'multibagger',
  'double your money',
  'doubling your money',
  'you should invest',
  'i recommend',
  'we recommend',
  'i advise',
  'best fund to buy',
  'will definitely',
  'cannot lose',
  "can't lose",
  'safe as a fixed deposit',
  'safer than a fixed deposit',
];

export type LintHit = { pattern: string; match: string; index: number };

/** Returns every prohibited-phrase hit across the supplied text. */
export function lint(text: string): LintHit[] {
  if (!text) return [];
  const hay = text.toLowerCase();
  const hits: LintHit[] = [];
  for (const pattern of BANNED_PATTERNS) {
    const re = new RegExp(pattern, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(hay)) !== null) {
      hits.push({ pattern, match: m[0], index: m.index });
      if (m.index === re.lastIndex) re.lastIndex += 1;
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

/** Convenience for the editor: lint title + excerpt + body as one document,
 *  matching exactly what the database trigger inspects. */
export function lintPost(title: string, excerpt: string, body: string): LintHit[] {
  return lint(`${title ?? ''} ${excerpt ?? ''} ${body ?? ''}`);
}
