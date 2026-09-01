/**
 * Minimal charting for the metrics page.
 *
 * No chart library and no CDN: a strict CSP on /admin should be possible later
 * without reworking this, and everything is built with createElementNS /
 * textContent so no label can ever be parsed as markup.
 *
 * Three primitives cover every chart the dashboard needs. Horizontal bars are
 * plain divs rather than SVG — they reflow responsively for free and read
 * better at this data volume than a pie or donut would.
 */

import { el } from './dom';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

export type SeriesPoint = { label: string; a: number; b?: number };

/** Line chart of a daily series. `a` is drawn filled, `b` as a second line. */
export function lineChart(host: HTMLElement, points: SeriesPoint[]): void {
  host.replaceChildren();

  if (points.length === 0) {
    host.append(el('p', { class: 'py-8 text-center text-sm text-slate-500' }, 'No data yet.'));
    return;
  }

  const W = 640;
  const H = 180;
  const PAD = { top: 10, right: 8, bottom: 22, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const max = Math.max(1, ...points.map((p) => Math.max(p.a, p.b ?? 0)));
  const x = (i: number) =>
    PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'w-full',
    role: 'img',
    'aria-label': `Daily trend over ${points.length} days, peak ${max}`,
  });

  // Horizontal guides with value labels.
  for (const frac of [0, 0.5, 1]) {
    const v = Math.round(max * frac);
    const yy = y(v);
    svg.append(
      svgEl('line', {
        x1: String(PAD.left), x2: String(W - PAD.right),
        y1: String(yy), y2: String(yy),
        stroke: '#e2e8f0', 'stroke-width': '1',
      }),
    );
    const label = svgEl('text', {
      x: String(PAD.left - 6), y: String(yy + 3),
      'text-anchor': 'end', 'font-size': '9', fill: '#94a3b8',
    });
    label.textContent = String(v);
    svg.append(label);
  }

  const path = (key: 'a' | 'b') =>
    points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p[key] ?? 0).toFixed(1)}`)
      .join(' ');

  // Filled area under the primary series.
  svg.append(
    svgEl('path', {
      d: `${path('a')} L${x(points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`,
      fill: '#0F172A', 'fill-opacity': '0.07',
    }),
    svgEl('path', {
      d: path('a'), fill: 'none', stroke: '#0F172A',
      'stroke-width': '2', 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
    }),
  );

  if (points.some((p) => p.b !== undefined)) {
    svg.append(
      svgEl('path', {
        d: path('b'), fill: 'none', stroke: '#1D4ED8',
        'stroke-width': '2', 'stroke-dasharray': '4 3', 'stroke-linecap': 'round',
      }),
    );
  }

  // Hover targets carrying a native tooltip — no JS tooltip machinery needed.
  points.forEach((p, i) => {
    const dot = svgEl('circle', {
      cx: x(i).toFixed(1), cy: y(p.a).toFixed(1), r: '7',
      fill: 'transparent',
    });
    const title = svgEl('title');
    title.textContent =
      p.b === undefined
        ? `${p.label}: ${p.a}`
        : `${p.label}: ${p.a} views, ${p.b} visitors`;
    dot.append(title);
    svg.append(dot);
  });

  // First and last date labels only; a dense axis is unreadable at this width.
  for (const i of points.length > 1 ? [0, points.length - 1] : [0]) {
    const t = svgEl('text', {
      x: String(x(i)), y: String(H - 6), 'font-size': '9', fill: '#94a3b8',
      'text-anchor': i === 0 ? 'start' : 'end',
    });
    t.textContent = points[i].label;
    svg.append(t);
  }

  host.append(svg);
}

export type BarRow = { label: string; value: number; sub?: string; href?: string };

export function barList(host: HTMLElement, rows: BarRow[], emptyText = 'No data yet.'): void {
  host.replaceChildren();

  if (rows.length === 0) {
    host.append(el('p', { class: 'py-6 text-sm text-slate-500' }, emptyText));
    return;
  }

  const max = Math.max(1, ...rows.map((r) => r.value));
  const list = el('ul', { class: 'space-y-2' });

  for (const r of rows) {
    const pct = Math.max(2, Math.round((r.value / max) * 100));
    list.append(
      el(
        'li',
        { class: 'relative overflow-hidden rounded-lg border border-slate-200 bg-white' },
        el('div', {
          class: 'absolute inset-y-0 left-0 bg-slate-900/[0.06]',
          style: `width:${pct}%`,
        }),
        el(
          'div',
          { class: 'relative flex items-center gap-3 px-3 py-2' },
          el(
            'span',
            { class: 'min-w-0 flex-1' },
            el('span', { class: 'block truncate text-sm text-slate-800' }, r.label),
            r.sub ? el('span', { class: 'block truncate text-xs text-slate-500' }, r.sub) : null,
          ),
          el('span', { class: 'shrink-0 text-sm font-semibold text-slate-900' }, String(r.value)),
        ),
      ),
    );
  }

  host.append(list);
}

export function stackedBar(host: HTMLElement, rows: BarRow[]): void {
  host.replaceChildren();

  const total = rows.reduce((n, r) => n + r.value, 0);
  if (total === 0) {
    host.append(el('p', { class: 'py-6 text-sm text-slate-500' }, 'No data yet.'));
    return;
  }

  const shades = ['bg-slate-900', 'bg-slate-600', 'bg-slate-400'];
  const bar = el('div', { class: 'flex h-3 w-full overflow-hidden rounded-full bg-slate-100' });
  const legend = el('ul', { class: 'mt-3 space-y-1.5' });

  rows.forEach((r, i) => {
    const pct = (r.value / total) * 100;
    const shade = shades[i % shades.length];
    bar.append(el('div', { class: shade, style: `width:${pct}%`, title: `${r.label}: ${r.value}` }));
    legend.append(
      el(
        'li',
        { class: 'flex items-center gap-2 text-sm' },
        el('span', { class: `inline-block h-2.5 w-2.5 rounded-full ${shade}` }),
        el('span', { class: 'flex-1 text-slate-700' }, r.label),
        el('span', { class: 'text-slate-500' }, `${r.value} (${Math.round(pct)}%)`),
      ),
    );
  });

  host.append(bar, legend);
}
