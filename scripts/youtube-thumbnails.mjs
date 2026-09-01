/**
 * Astro integration: self-hosts YouTube poster images.
 *
 * The Knowledge Corner promises that nothing is requested from Google until a
 * visitor clicks play, and the Privacy Policy says so in section 5.3. Pointing
 * an <img> at i.ytimg.com would break that on page load, for every video at
 * once, before anyone has chosen anything — which is why the videos table has
 * no thumbnail column.
 *
 * So the fetch happens here instead, on the build server. The image is written
 * into public/ and served from our own origin, so the visitor gets a real
 * thumbnail and still makes zero third-party requests.
 *
 * This runs on `astro:config:setup`, which fires for both `astro dev` and
 * `astro build`. Writing into the build output instead would 404 in local dev,
 * because the dev server serves public/ and never looks at dist/. Files already
 * present are not re-fetched, so a dev server restart costs nothing.
 *
 * Failure is non-fatal by design: a missing file simply leaves the CSS gradient
 * showing through, because VideoCard layers the poster over the gradient rather
 * than replacing it. A YouTube outage must not fail the site build.
 */

import { access, mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_SUBDIR = join('public', 'images', 'video-thumbs');
const TIMEOUT_MS = 8000;

/** Mirrors src/lib/youtube.ts. Kept as plain JS because this file runs in the
 *  Astro config context, outside the TypeScript build. */
function youtubeId(url) {
  if (!url) return null;
  const m =
    url.match(/^https:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,20})/) ??
    url.match(/^https:\/\/youtu\.be\/([A-Za-z0-9_-]{6,20})/);
  return m ? m[1] : null;
}

/**
 * Reads Supabase credentials.
 *
 * `astro:config:setup` runs before Vite has loaded .env into process.env, so a
 * local build would silently find no credentials and skip every poster. On
 * Vercel the variables are real environment variables and are already present,
 * hence process.env first with the file only as a local fallback.
 */
function readEnv(root) {
  const out = {
    url: process.env.PUBLIC_SUPABASE_URL ?? '',
    key: process.env.PUBLIC_SUPABASE_ANON_KEY ?? '',
  };
  if (out.url && out.key) return out;
  try {
    for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const value = m[2].trim().replace(/^["']|["']$/g, '');
      if (m[1] === 'PUBLIC_SUPABASE_URL' && !out.url) out.url = value;
      if (m[1] === 'PUBLIC_SUPABASE_ANON_KEY' && !out.key) out.key = value;
    }
  } catch {
    /* no local .env is fine when the vars are already exported */
  }
  return out;
}

async function fetchPublishedVideos(root) {
  const { url: rawUrl, key } = readEnv(root);
  const base = rawUrl.replace(/\/+$/, '');
  if (!base || !key) throw new Error('Supabase credentials not available');

  const res = await fetch(
    `${base}/rest/v1/videos?select=video_url&published=eq.true`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new Error(`PostgREST ${res.status}`);
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

/** maxres exists only for videos uploaded at 1080p+; hq always exists. */
async function downloadPoster(id) {
  for (const name of ['maxresdefault', 'hqdefault']) {
    try {
      const res = await fetch(`https://i.ytimg.com/vi/${id}/${name}.jpg`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      // YouTube answers 200 with a 120x90 grey placeholder for missing sizes,
      // so size is the reliable signal, not status.
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength < 3000) continue;
      return buf;
    } catch {
      // try the next size
    }
  }
  return null;
}

export default function youtubeThumbnails() {
  return {
    name: 'youtube-thumbnails',
    hooks: {
      'astro:config:setup': async ({ config, logger }) => {
        const root = fileURLToPath(config.root);
        let videos;
        try {
          videos = await fetchPublishedVideos(root);
        } catch (err) {
          logger.warn(`Could not list videos (${err.message}); posters fall back to the gradient.`);
          return;
        }

        const ids = [...new Set(videos.map((v) => youtubeId(v.video_url)).filter(Boolean))];
        if (ids.length === 0) {
          logger.info('No published videos; no posters to fetch.');
          return;
        }

        const outDir = join(root, OUT_SUBDIR);
        await mkdir(outDir, { recursive: true });

        let saved = 0;
        let cached = 0;
        for (const id of ids) {
          try {
            const target = join(outDir, `${id}.jpg`);
            // Already downloaded on a previous run: leave it alone.
            try {
              await access(target);
              cached += 1;
              continue;
            } catch {
              /* not cached, fetch it */
            }
            const buf = await downloadPoster(id);
            if (!buf) {
              logger.warn(`No poster available for ${id}; using the gradient.`);
              continue;
            }
            await writeFile(target, buf);
            saved += 1;
          } catch (err) {
            logger.warn(`Poster for ${id} failed (${err.message}); using the gradient.`);
          }
        }
        logger.info(
          `Video posters: ${saved} downloaded, ${cached} already cached, ${ids.length} total.`,
        );
      },
    },
  };
}
