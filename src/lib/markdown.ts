/**
 * Markdown rendering for Knowledge Corner articles.
 *
 * Runs at build time (article pages) and in the browser (admin editor preview),
 * so the author sees byte-identical output to what ships.
 *
 * Security model: raw HTML in the source is dropped, not escaped and not
 * sanitised after the fact. Overriding the `html` renderer to return '' means
 * `<script>`, `<iframe>`, `onerror=` and friends never enter the output string
 * in the first place, which removes the need for a sanitiser dependency and the
 * class of bugs that come with sanitiser configuration. Admin authors are
 * trusted people, but a trusted author who pastes from a compromised source is
 * still a real path onto a regulated site.
 */

import { marked, type Tokens } from 'marked';

const renderer = new marked.Renderer();

// Raw HTML blocks and inline HTML are discarded outright.
renderer.html = () => '';

// External links open in a new tab and carry rel hygiene. Internal links (which
// start with '/' or '#') are left as ordinary same-tab navigation.
renderer.link = ({ href, title, tokens }: Tokens.Link) => {
  const text = renderer.parser.parseInline(tokens);
  const safeHref = String(href ?? '');
  const isExternal = /^https?:\/\//i.test(safeHref);
  const isSafe = isExternal || safeHref.startsWith('/') || safeHref.startsWith('#');
  // javascript:, data: and friends are dropped to plain text.
  if (!isSafe) return text;
  const attrs = [
    `href="${safeHref.replace(/"/g, '&quot;')}"`,
    title ? `title="${String(title).replace(/"/g, '&quot;')}"` : '',
    isExternal ? 'target="_blank" rel="noopener noreferrer nofollow"' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<a ${attrs}>${text}</a>`;
};

// The page supplies its own <h1>, so author headings start one level down and
// the document keeps a single top-level heading.
renderer.heading = ({ tokens, depth }: Tokens.Heading) => {
  const text = renderer.parser.parseInline(tokens);
  const level = Math.min(depth + 1, 6);
  return `<h${level}>${text}</h${level}>\n`;
};

marked.setOptions({ gfm: true, breaks: false, renderer });

export function renderMarkdown(source: string): string {
  if (!source) return '';
  return marked.parse(source, { async: false }) as string;
}
