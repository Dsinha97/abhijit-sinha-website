/**
 * Refreshes src/data/knowledge.snapshot.json from Supabase.
 *
 * Run locally after a publishing session, then commit the result:
 *
 *   npm run sync:knowledge
 *
 * Deliberately NOT part of `npm run build`. Vercel builds must be deterministic
 * and must never try to write into the repo. The snapshot exists so that a
 * build during a Supabase outage ships the last known-good content instead of
 * silently 404ing every live article — which is why it needs to be committed
 * rather than generated on the fly.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'src', 'data', 'knowledge.snapshot.json');

// Minimal .env reader: this script runs outside Vite, so import.meta.env is not
// available and the project has no dotenv dependency to lean on.
function readEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* no .env locally is fine if the vars are already exported */
  }
  return env;
}

const env = readEnv();
const base = (env.PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
const key = env.PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!base || !key) {
  console.error('sync:knowledge — PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY not set.');
  process.exit(1);
}

async function get(query) {
  const res = await fetch(`${base}/rest/v1/${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`PostgREST ${res.status} for ${query}`);
  return res.json();
}

try {
  const [posts, videos, links] = await Promise.all([
    get(
      'posts?select=slug,title,excerpt,body_markdown,published_at,updated_at,tags,seo_description&published=eq.true&order=published_at.desc',
    ),
    get(
      'videos?select=id,title,description,video_url,sort_order&published=eq.true&order=sort_order.asc,created_at.desc',
    ),
    get(
      'resource_links?select=id,title,url,source_name,note,sort_order&published=eq.true&order=sort_order.asc,created_at.desc',
    ),
  ]);

  const snapshot = {
    _comment:
      'Last known-good Knowledge Corner content, committed so a Supabase outage degrades to stale content rather than to a green build that 404s every live article. Regenerate with `npm run sync:knowledge`. Never hand-edit.',
    generated_at: new Date().toISOString(),
    posts,
    videos,
    links,
  };

  writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(
    `sync:knowledge — wrote ${posts.length} article(s), ${videos.length} video(s), ${links.length} link(s) to src/data/knowledge.snapshot.json. Commit this file.`,
  );
} catch (err) {
  // Never overwrite a good snapshot with nothing: leaving the previous file in
  // place is strictly safer than truncating it on a transient network error.
  console.error(`sync:knowledge failed — snapshot left unchanged. ${err.message}`);
  process.exit(1);
}
