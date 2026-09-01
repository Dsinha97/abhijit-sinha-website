/**
 * Small DOM helpers shared by the admin pages.
 *
 * The rule these exist to enforce: lead rows are attacker-controlled. Anyone on
 * the internet can submit the public contact form, and that text is then
 * rendered inside an authenticated admin page. Every value that came from the
 * database goes in as `textContent`, never as `innerHTML`. `el()` makes the
 * safe path the convenient one.
 */

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | undefined> = {},
  ...children: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined) continue;
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) {
    if (child === null || child === undefined) continue;
    // Strings become text nodes. There is no path here that parses markup.
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function $<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function show(node: HTMLElement | null, visible: boolean, display = 'block'): void {
  if (!node) return;
  node.style.display = visible ? display : 'none';
  node.classList.toggle('hidden', !visible);
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'never';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

/** Normalises an Indian mobile number to wa.me form. Returns null when it does
 *  not look like a usable number, so the UI can hide the action instead of
 *  offering a link that goes nowhere. */
export function waNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function toast(message: string, kind: 'ok' | 'error' = 'ok'): void {
  const existing = document.getElementById('admin-toast');
  existing?.remove();
  const node = el(
    'div',
    {
      id: 'admin-toast',
      role: 'status',
      class: `fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm shadow-lg ${
        kind === 'ok' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
      }`,
    },
    message,
  );
  document.body.append(node);
  setTimeout(() => node.remove(), kind === 'error' ? 8000 : 3500);
}
