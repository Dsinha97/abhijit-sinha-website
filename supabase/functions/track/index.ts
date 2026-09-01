// track — first-party, cookieless analytics ingest for abhijitsinha.in
//
// Deliberately stores NO IP address, NO user-agent string, NO geolocation and
// sets NO cookie. The only identifier is session_hash: a salted digest of
// (salt, IST date, ip, ua) truncated to 16 chars. The IST date component makes
// it rotate daily, so a visitor cannot be linked across days, and the inputs
// are never written anywhere. This is what makes the tracker defensible under
// DPDP without a consent banner. See docs/wiki/data-model.md.
//
// NOTE: the CORS/origin logic here is duplicated from submit-lead rather than
// shared. Extracting it would require redeploying submit-lead, which is the
// only working lead path on the site. Duplication is the cheaper risk.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const DEFAULT_ORIGINS = [
  'https://abhijitsinha.in',
  'https://www.abhijitsinha.in',
  'http://localhost:4321',
  'http://localhost:3000',
];
const VERCEL_PREVIEW = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

const BOT =
  /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|lighthouse|pagespeed|monitor|preview|curl|wget|python|axios|go-http|java\/|facebookexternalhit|whatsapp|telegram|slackbot|bingpreview|semrush|ahrefs|mj12|dotbot|petal/i;

const LINK_KINDS = new Set([
  'cta',
  'nav',
  'outbound',
  'whatsapp',
  'tel',
  'mailto',
  'video',
  'resource',
]);

function allowedOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGINS');
  if (!raw) return DEFAULT_ORIGINS;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function corsFor(origin: string | null): Record<string, string> | null {
  if (!origin) return null;
  const ok = allowedOrigins().includes(origin) || VERCEL_PREVIEW.test(origin);
  if (!ok) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function clamp(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\s+/g, ' ').trim();
  if (!s) return null;
  return s.slice(0, max);
}

// Strips query and hash, lowercases, drops a trailing slash. Query strings can
// carry personal data, so they never reach the database.
function normalisePath(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.startsWith('/')) return null;
  let p = raw.split('#')[0].split('?')[0].toLowerCase();
  if (p.length > 1) p = p.replace(/\/+$/, '') || '/';
  if (p.length > 200) return null;
  return p;
}

function deviceFor(width: unknown): 'mobile' | 'tablet' | 'desktop' {
  const w = typeof width === 'number' ? width : 0;
  if (w > 0 && w < 640) return 'mobile';
  if (w >= 640 && w < 1024) return 'tablet';
  return 'desktop';
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// In-isolate rate limiter. Resets on cold start, which is acceptable: it exists
// to blunt floods, not to be authoritative.
const hits = new Map<string, { n: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_EVENTS = 60;

function overLimit(key: string): boolean {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || now > cur.resetAt) {
    hits.set(key, { n: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
    }
    return false;
  }
  cur.n += 1;
  return cur.n > MAX_EVENTS;
}

let cachedSalt: { value: string; at: number } | null = null;

async function getSalt(db: ReturnType<typeof createClient>): Promise<string> {
  if (cachedSalt && Date.now() - cachedSalt.at < 60 * 60 * 1000) return cachedSalt.value;
  const { data } = await db.from('analytics_salt').select('salt').eq('id', true).maybeSingle();
  const value = (data?.salt as string | undefined) ?? 'fallback-salt-unavailable';
  cachedSalt = { value, at: Date.now() };
  return value;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const cors = corsFor(origin);

  if (req.method === 'OPTIONS') {
    return cors
      ? new Response(null, { status: 204, headers: cors })
      : new Response(null, { status: 403 });
  }
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  if (!cors) return new Response(null, { status: 403 });

  const noStore = { ...cors, 'Cache-Control': 'no-store' };
  // Every rejection below returns 204, not an error: bots learn nothing from a
  // silent success, and a visitor must never see analytics fail.
  const drop = () => new Response(null, { status: 204, headers: noStore });

  if (Number(req.headers.get('content-length') ?? '0') > 2048) return drop();

  const ua = req.headers.get('user-agent') ?? '';
  if (BOT.test(ua)) return drop();
  if ((req.headers.get('sec-purpose') ?? '').includes('prefetch')) return drop();

  let body: Record<string, unknown>;
  try {
    // The client sends a text/plain Blob so sendBeacon issues a CORS-simple
    // request. Beacons cannot preflight and application/json is not safelisted,
    // so parsing text (not req.json()) is required here.
    const text = await req.text();
    if (!text || text.length > 2048) return drop();
    body = JSON.parse(text);
  } catch {
    return drop();
  }
  if (!body || typeof body !== 'object') return drop();
  if (body.w === true) return drop(); // navigator.webdriver

  const eventType = body.t === 'click' ? 'click' : body.t === 'pageview' ? 'pageview' : null;
  if (!eventType) return drop();

  const path = normalisePath(body.p);
  if (!path) return drop();
  // The admin panel is never measured.
  if (path === '/admin' || path.startsWith('/admin/')) return drop();

  let refHost: string | null = null;
  if (typeof body.r === 'string' && body.r) {
    try {
      const h = new URL(body.r).hostname.toLowerCase();
      const selfHost = origin ? new URL(origin).hostname.toLowerCase() : '';
      refHost = h && h !== selfHost ? h.slice(0, 100) : null;
    } catch {
      refHost = null;
    }
  }

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  const istDate = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  const saltValue = await getSalt(db);
  // ip and ua are consumed here and never stored.
  const sessionHash = (await sha256Hex(`${saltValue}:${istDate}:${ip}:${ua}`)).slice(0, 16);

  if (overLimit(sessionHash)) return drop();

  const linkKind = typeof body.k === 'string' && LINK_KINDS.has(body.k) ? body.k : null;

  const { error } = await db.from('analytics_events').insert({
    event_type: eventType,
    path,
    ref_host: refHost,
    device: deviceFor(body.d),
    link_kind: eventType === 'click' ? linkKind : null,
    link_label: eventType === 'click' ? clamp(body.l, 60) : null,
    link_href: eventType === 'click' ? clamp(body.h, 300) : null,
    utm_source: clamp(body.us, 60),
    utm_medium: clamp(body.um, 60),
    utm_campaign: clamp(body.uc, 60),
    session_hash: sessionHash,
  });
  if (error) console.error('[track] insert failed:', error.message);

  return new Response(null, { status: 204, headers: noStore });
});
