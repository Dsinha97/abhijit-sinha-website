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
