/**
 * First-party, cookieless page and click tracking.
 *
 * Mounted once from BaseLayout.astro as a bundled module, so it is deferred and
 * never blocks parse or render. It sets no cookie and performs no
 * fingerprinting; the only identifier is computed server-side in the `track`
 * edge function and rotates daily. The single thing written to browser storage
 * is the visitor's own opt-out choice, from the privacy notice.
 * See docs/wiki/data-model.md.
 */

import { hasOptedOut } from './privacy-choice';

type Payload = {
  t: 'pageview' | 'click';
  p: string;
  r?: string;
  d?: number;
  k?: string;
  l?: string;
  h?: string;
  w?: boolean;
  us?: string;
  um?: string;
  uc?: string;
};

const ENDPOINT = import.meta.env.PUBLIC_ANALYTICS_ENDPOINT ?? '';

/** Every reason to collect nothing at all, checked before any network use. */
function disabled(): boolean {
  if (!ENDPOINT) return true;
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
  if (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) return true;
  // An explicit opt-out from the privacy notice. Checked before anything else
  // that could produce a request, so choosing it really does stop measurement
  // rather than merely hiding the banner.
  if (hasOptedOut()) return true;
  // Do Not Track is honoured even though this tracker collects no personal
  // data: a visitor who asked not to be measured should not be measured.
  const dnt =
    navigator.doNotTrack ?? (window as { doNotTrack?: string }).doNotTrack ?? null;
  if (dnt === '1' || dnt === 'yes') return true;
  if (navigator.webdriver) return true;
  return false;
}

function send(payload: Payload): void {
  const body = JSON.stringify(payload);
  try {
    // A text/plain Blob keeps this a CORS-simple request. sendBeacon cannot
    // issue a preflight, and application/json is not a safelisted content type,
    // so sending JSON here would make every beacon fail silently.
    const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
    if (navigator.sendBeacon?.(ENDPOINT, blob)) return;
  } catch {
    /* fall through to fetch */
  }
  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      keepalive: true,
      mode: 'cors',
      credentials: 'omit',
    }).catch(() => {});
  } catch {
    /* analytics must never surface an error to a visitor */
  }
}

function utmFields(): Pick<Payload, 'us' | 'um' | 'uc'> {
  const q = new URLSearchParams(location.search);
  const take = (k: string) => (q.get(k) || '').slice(0, 60) || undefined;
  return { us: take('utm_source'), um: take('utm_medium'), uc: take('utm_campaign') };
}

function basePayload(): Pick<Payload, 'p' | 'd' | 'w'> {
  return { p: location.pathname, d: window.innerWidth, w: navigator.webdriver === true };
}

function trackPageview(): void {
  send({ t: 'pageview', ...basePayload(), r: document.referrer || undefined, ...utmFields() });
}

/** Classifies a clicked element. Explicit data-track attributes win; otherwise
 *  the href shape decides. Never reads a form field's value. */
function classify(el: HTMLAnchorElement | HTMLButtonElement): { kind: string; href: string } | null {
  const explicit = el.getAttribute('data-track');
  const href = el instanceof HTMLAnchorElement ? el.getAttribute('href') || '' : '';

  if (explicit) return { kind: explicit, href };

  if (href.startsWith('tel:')) return { kind: 'tel', href };
  if (href.startsWith('mailto:')) return { kind: 'mailto', href };
  if (href.includes('wa.me') || href.includes('api.whatsapp.com')) {
    return { kind: 'whatsapp', href };
  }
  if (/^https?:\/\//i.test(href)) {
    try {
      if (new URL(href).host !== location.host) return { kind: 'outbound', href };
    } catch {
      /* ignore unparseable href */
    }
  }
  if (el.closest('nav')) return { kind: 'nav', href };
  return null;
}

function onClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const el = target.closest('a, button');
  if (!(el instanceof HTMLAnchorElement) && !(el instanceof HTMLButtonElement)) return;

  const hit = classify(el);
  if (!hit) return;

  const label =
    el.getAttribute('data-track-label') ||
    (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) ||
    hit.kind;

  send({
    t: 'click',
    ...basePayload(),
    k: hit.kind,
    l: label,
    h: hit.href ? hit.href.slice(0, 300) : undefined,
  });
}

if (!disabled()) {
  // Deferred to idle so measurement never competes with first paint.
  const idle =
    window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 0));
  idle(() => trackPageview(), { timeout: 2000 } as IdleRequestOptions);

  // Capture phase and passive: the handler must run before a navigation
  // teardown, and must never be able to delay the click itself. sendBeacon is
  // what allows an outbound-link click to survive the navigation it triggers.
  document.addEventListener('click', onClick, { capture: true, passive: true });
}
