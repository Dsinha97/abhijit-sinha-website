/**
 * Build-time content fetch for the Knowledge Corner.
 *
 * This module runs during `astro build`, in Node, on Vercel. Three rules shape
 * every decision in it:
 *
 * 1. **It must never throw.** A build that fails because Supabase blinked is a
 *    site outage caused by a CMS outage, which is exactly the coupling the
 *    static architecture exists to avoid.
 * 2. **It must never silently return empty.** That is the subtler hazard: an
 *    empty result produces a *green* build that quietly 404s every article URL
 *    that was live a minute ago. Hence the committed snapshot fallback — the
 *    last known-good content ships rather than nothing.
 * 3. **No `@supabase/supabase-js`.** Plain `fetch` against PostgREST keeps the
 *    build dependency-free and gives straightforward timeout cancellation. The
 *    client library is browser-only, imported from admin code alone.
 *
 * See docs/wiki/admin-dashboard.md.
 */

import snapshot from '../data/knowledge.snapshot.json';

export type KcPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  body_markdown: string;
  published_at: string | null;
  updated_at: string | null;
  tags: string[];
  seo_description: string | null;
};

export type KcVideo = {
  id: number;
  title: string;
  description: string | null;
  video_url: string;
  sort_order: number;
};

export type KcLink = {
  id: number;
  title: string;
  url: string;
  source_name: string;
  note: string | null;
  sort_order: number;
};

export type KcContent = {
  posts: KcPost[];
  videos: KcVideo[];
  links: KcLink[];
  /** Where the content came from. Surfaced in build logs, never to visitors. */
  source: 'live' | 'snapshot' | 'empty';
};

const TIMEOUT_MS = 8000;

/** Matches the DB CHECK on posts.slug. Re-validated because the snapshot tier
 *  is a plain JSON file and has never been through Postgres. */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const EMPTY: KcContent = { posts: [], videos: [], links: [], source: 'empty' };

async function fetchTable<T>(base: string, key: string, query: string): Promise<T[]> {
  const res = await fetch(`${base}/rest/v1/${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`PostgREST ${res.status} for ${query}`);
  const json = await res.json();
  if (!Array.isArray(json)) throw new Error(`Unexpected payload shape for ${query}`);
  return json as T[];
}

function validPosts(rows: KcPost[]): KcPost[] {
  return rows.filter((p) => p && typeof p.slug === 'string' && SLUG_RE.test(p.slug) && p.title);
}

function fromSnapshot(): KcContent {
  const snap = snapshot as unknown as Partial<KcContent>;
  const posts = validPosts((snap.posts ?? []) as KcPost[]);
  const videos = (snap.videos ?? []) as KcVideo[];
  const links = (snap.links ?? []) as KcLink[];
  if (!posts.length && !videos.length && !links.length) return EMPTY;
  return { posts, videos, links, source: 'snapshot' };
}

// Memoised: the index page, every [slug] page and the sitemap all call this,
// and a build should hit Supabase exactly once.
let cached: Promise<KcContent> | null = null;

export function getKnowledge(): Promise<KcContent> {
  if (!cached) cached = load();
  return cached;
}

async function load(): Promise<KcContent> {
  const base = (import.meta.env.PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!base || !key) {
    console.warn('[knowledge] Supabase env vars not set — using committed snapshot.');
    return fromSnapshot();
  }

  try {
    const [posts, videos, links] = await Promise.all([
      fetchTable<KcPost>(
        base,
        key,
        'posts?select=slug,title,excerpt,body_markdown,published_at,updated_at,tags,seo_description&published=eq.true&order=published_at.desc',
      ),
      fetchTable<KcVideo>(
        base,
        key,
        'videos?select=id,title,description,video_url,sort_order&published=eq.true&order=sort_order.asc,created_at.desc',
      ),
      fetchTable<KcLink>(
        base,
        key,
        'resource_links?select=id,title,url,source_name,note,sort_order&published=eq.true&order=sort_order.asc,created_at.desc',
      ),
    ]);

    return { posts: validPosts(posts), videos, links, source: 'live' };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[knowledge] Supabase unreachable (${reason}) — using committed snapshot.`);
    return fromSnapshot();
  }
}

/** One reading item, from either source. Articles written here and curated
 *  third-party links share a section, so they need a common shape — but `kind`
 *  is preserved so the card can keep them visually distinct, which is a
 *  compliance requirement, not a presentational preference. */
export type ReadingItem = {
  kind: 'own' | 'external';
  id: string;
  title: string;
  /** Slug for own articles, absolute URL for external ones. */
  href: string;
  description: string | null;
  sourceName: string | null;
  publishedAt: string | null;
  tags: string[];
  /** Sort key only. */
  sortAt: number;
};

/** Merges posts and resource_links into a single newest-first list. */
export function toReadingItems(content: KcContent): ReadingItem[] {
  const own: ReadingItem[] = content.posts.map((p) => ({
    kind: 'own',
    id: `post-${p.slug}`,
    title: p.title,
    href: p.slug,
    description: p.excerpt,
    sourceName: null,
    publishedAt: p.published_at,
    tags: p.tags ?? [],
    sortAt: p.published_at ? new Date(p.published_at).getTime() : 0,
  }));

  const external: ReadingItem[] = content.links.map((l) => ({
    kind: 'external',
    id: `link-${l.id}`,
    title: l.title,
    href: l.url,
    description: l.note,
    sourceName: l.source_name,
    publishedAt: null,
    tags: [],
    // Curated links carry no publication date, so they order by the admin's
    // explicit sort_order, interleaved after dated articles.
    sortAt: -l.sort_order,
  }));

  return [...own, ...external].sort((a, b) => b.sortAt - a.sortAt);
}
