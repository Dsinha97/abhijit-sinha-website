// publish-site — triggers a Vercel rebuild so newly published Knowledge Corner
// content is rendered into static HTML.
//
// The site is static with no adapter, so content only reaches visitors through
// a build. The deploy-hook URL is itself a bearer credential (anyone with it can
// trigger builds), so it lives as a Supabase secret and never reaches a browser.
//
// The platform's verify_jwt is left off so this function can return readable
// JSON errors instead of an opaque 401; the token is verified explicitly below,
// and a valid token only proves "some Supabase user" — the allowlist check is
// what actually authorises.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const DEFAULT_ORIGINS = [
  'https://abhijitsinha.in',
  'https://www.abhijitsinha.in',
  'http://localhost:4321',
  'http://localhost:3000',
];
const VERCEL_PREVIEW = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

// One build per minute. Saving several items in a row should not queue several
// builds; the last one would win anyway.
const DEBOUNCE_SECONDS = 60;

function allowedOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGINS');
  if (!raw) return DEFAULT_ORIGINS;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function corsFor(origin: string | null): Record<string, string> {
  const ok = origin && (allowedOrigins().includes(origin) || VERCEL_PREVIEW.test(origin));
  return {
    'Access-Control-Allow-Origin': ok ? origin! : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

Deno.serve(async (req: Request) => {
  const cors = { ...corsFor(req.headers.get('origin')), 'Content-Type': 'application/json' };
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: cors });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed.' });

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { ok: false, error: 'Not signed in.' });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user?.email) return json(401, { ok: false, error: 'Not signed in.' });

  // A valid JWT is not authorisation. Re-check the allowlist server-side.
  const { data: allowed } = await admin
    .from('admin_allowlist')
    .select('email')
    .eq('email', user.email.toLowerCase())
    .maybeSingle();
  if (!allowed) return json(403, { ok: false, error: 'Not authorised to publish.' });

  const hook = Deno.env.get('VERCEL_DEPLOY_HOOK_URL');
  if (!hook) {
    return json(503, {
      ok: false,
      error:
        'Publishing is not configured yet. Create a Deploy Hook in Vercel (Settings → Git → Deploy Hooks, branch main) and save its URL as the VERCEL_DEPLOY_HOOK_URL secret in Supabase.',
    });
  }

  const { data: recent } = await admin
    .from('deploy_log')
    .select('triggered_at')
    .order('triggered_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent?.triggered_at) {
    const ageSec = (Date.now() - new Date(recent.triggered_at as string).getTime()) / 1000;
    if (ageSec < DEBOUNCE_SECONDS) {
      return json(200, {
        ok: true,
        skipped: true,
        reason: 'debounced',
        message: `A build was already triggered ${Math.round(ageSec)}s ago and will include this change.`,
      });
    }
  }

  let ok = true;
  let note = 'Deploy hook accepted.';
  try {
    const res = await fetch(hook, { method: 'POST', signal: AbortSignal.timeout(10_000) });
    ok = res.ok;
    if (!ok) note = `Deploy hook returned HTTP ${res.status}.`;
  } catch (e) {
    ok = false;
    note = `Deploy hook request failed: ${e instanceof Error ? e.message : 'unknown error'}`;
  }

  await admin.from('deploy_log').insert({ triggered_by: user.id, ok, note });

  return ok
    ? json(200, { ok: true, message: 'Build triggered. The site updates in about 1–2 minutes.' })
    : json(502, { ok: false, error: note });
});
