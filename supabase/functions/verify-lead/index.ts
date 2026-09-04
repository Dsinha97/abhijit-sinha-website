// verify-lead — bot gate in front of the lead form.
//
// The browser POSTs here instead of straight to `submit-lead`. This function
// checks the Cloudflare Turnstile token (plus honeypot, dwell time, field
// caps and a per-IP rate limit), then forwards the submission server-to-server
// to `submit-lead`, which remains the only writer to `leads` and the only
// sender of the notification email.
//
//   browser --(FormData + cf-turnstile-response)--> verify-lead
//           --(FormData)--> submit-lead --> leads + email
//
// `submit-lead` is deliberately NOT redeployed: its live version is the only
// working lead path on the site and its source is not in this repo. Putting the
// gate in front keeps it untouched and keeps the rollback trivial — repoint
// PUBLIC_FORM_ENDPOINT at submit-lead and the form behaves exactly as before.
//
// NOTE: the CORS/origin logic here is duplicated from track/submit-lead rather
// than shared, for the same reason: extracting it would mean redeploying
// submit-lead. Duplication is the cheaper risk.

const DEFAULT_ORIGINS = [
  'https://abhijitsinha.in',
  'https://www.abhijitsinha.in',
  'http://localhost:4321',
  'http://localhost:3000',
];
const VERCEL_PREVIEW = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Fields the gate consumes; they must not reach submit-lead, which has no
// idea about them and would store them as junk.
const GATE_FIELDS = ['cf-turnstile-response', 'form_dwell_ms', 'website'];

// A human filling four fields takes longer than this. Anything faster is
// either a script or a paste-and-fire, and is dropped silently.
const MIN_DWELL_MS = 2500;

// Mirrored by `maxlength` attributes in src/components/ContactForm.astro.
// Change both together.
const FIELD_CAPS: Record<string, number> = {
  name: 120,
  email: 200,
  mobile: 20,
  investment_goal: 120,
  service_category: 60,
  mode: 20,
  message: 2000,
  form_name: 80,
  source_page: 200,
};

const MAX_BODY_BYTES = 16 * 1024;

// The wording a bot sees. Identical to a real success: a filled honeypot or a
// sub-threshold dwell must teach an attacker nothing.
const SUCCESS_MESSAGE =
  'Thank you — your message has been sent. We will get back to you shortly.';

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

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// In-isolate rate limiter, same shape as track's. Resets on cold start, which
// is acceptable: it exists to blunt floods, not to be authoritative. This is
// the gap submit-lead leaves open — its own limit is 3/hour per EMAIL, so a
// bot that varies the address is throttled by nothing.
const hits = new Map<string, { n: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS = 5;

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
  return cur.n > MAX_SUBMISSIONS;
}

function submitLeadUrl(): string {
  const explicit = Deno.env.get('SUBMIT_LEAD_URL');
  if (explicit) return explicit;
  const base = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/+$/, '');
  return base + '/functions/v1/submit-lead';
}

async function verifyTurnstile(
  token: string,
  ip: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');

  // Fail OPEN when the secret was never configured, fail CLOSED when it is set
  // and the check does not pass. The asymmetry is deliberate: an unconfigured
  // or mis-set secret must never take the site's only lead channel offline,
  // but once Turnstile is live a missing or bad token is a rejection.
  if (!secret) {
    console.warn('[verify-lead] TURNSTILE_SECRET_KEY unset — forwarding unverified');
    return { ok: true };
  }
  if (!token) return { ok: false, reason: 'missing-token' };

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (data.success) return { ok: true };
    return { ok: false, reason: (data['error-codes'] ?? ['unknown']).join(',') };
  } catch (err) {
    return { ok: false, reason: 'siteverify-unreachable:' + (err as Error).name };
  }
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

  const headers = { ...cors, 'content-type': 'application/json', 'Cache-Control': 'no-store' };
  const json = (status: number, payload: Record<string, unknown>) =>
    new Response(JSON.stringify(payload), { status, headers });
  const fail = (status: number, error: string) => json(status, { ok: false, error });
  // Looks exactly like a real success, and forwards nothing.
  const silentOk = () => json(200, { ok: true, message: SUCCESS_MESSAGE });

  if (Number(req.headers.get('content-length') ?? '0') > MAX_BODY_BYTES) {
    return fail(413, 'That message is too long. Please shorten it and try again.');
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, 'We could not read that submission. Please try again.');
  }

  // Honeypot — hidden from real users, bots tend to fill every field.
  const honeypot = form.get('website');
  if (typeof honeypot === 'string' && honeypot.trim() !== '') return silentOk();

  const dwell = Number(form.get('form_dwell_ms') ?? '0');
  if (!Number.isFinite(dwell) || dwell < MIN_DWELL_MS) return silentOk();

  for (const [field, cap] of Object.entries(FIELD_CAPS)) {
    const value = form.get(field);
    if (typeof value === 'string' && value.length > cap) {
      return fail(400, 'The ' + field.replace(/_/g, ' ') + ' field is too long (max ' + cap + ' characters).');
    }
  }

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  // Hashed and held in memory only — the IP is never written anywhere, which
  // is the same posture as the analytics session_hash.
  if (overLimit(await sha256Hex('verify-lead:' + ip))) {
    return fail(429, 'Too many submissions from this connection. Please try again in a little while.');
  }

  const token = form.get('cf-turnstile-response');
  const verdict = await verifyTurnstile(typeof token === 'string' ? token : '', ip);
  if (!verdict.ok) {
    console.warn('[verify-lead] turnstile rejected:', verdict.reason);
    return fail(403, 'We could not verify that you are human. Please reload the page and try again.');
  }

  const forwarded = new FormData();
  for (const [key, value] of form.entries()) {
    if (GATE_FIELDS.includes(key)) continue;
    if (typeof value === 'string') forwarded.set(key, value);
  }

  try {
    const upstream = await fetch(submitLeadUrl(), {
      method: 'POST',
      // submit-lead checks Origin against its own allowlist, so the visitor's
      // origin is passed through rather than dropped.
      headers: { Accept: 'application/json', ...(origin ? { Origin: origin } : {}) },
      body: forwarded,
      signal: AbortSignal.timeout(10_000),
    });

    // Relayed verbatim so submit-lead's own validation wording and its 3/hour
    // per-email limit still reach the visitor.
    const text = await upstream.text();
    return new Response(text || JSON.stringify({ ok: upstream.ok }), {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    console.error('[verify-lead] forward to submit-lead failed:', (err as Error).message);
    return fail(502, 'Something went wrong on our side. Please try again or reach out via WhatsApp/phone.');
  }
});
