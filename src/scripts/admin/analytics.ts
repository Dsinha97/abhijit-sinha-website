/**
 * Website metrics page.
 *
 * Reads exclusively through the analytics_* RPCs. Those are security definer
 * with an explicit is_admin() guard, because PostgREST does not expose SQL
 * aggregates directly and a non-admin caller must get an error, not an empty
 * set that could be mistaken for "no traffic".
 */

import { getSupabase } from '../../lib/supabase-client';
import { $, el, toast } from './dom';
import { barList, lineChart, stackedBar, type BarRow, type SeriesPoint } from './charts';

const supabase = getSupabase();
let days = 30;

function range(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

function setTile(id: string, value: number | string): void {
  const node = $(id);
  if (node) node.textContent = String(value);
}

/** Fills every date in the window, so a quiet day reads as a zero rather than
 *  being silently collapsed out of the line. */
function densify(rows: { day: string; pageviews: number; sessions: number }[]): SeriesPoint[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out: SeriesPoint[] = [];
  const start = new Date(range().from);
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start.getTime() + i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const hit = byDay.get(key);
    out.push({
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      a: Number(hit?.pageviews ?? 0),
      b: Number(hit?.sessions ?? 0),
    });
  }
  return out;
}

async function load(): Promise<void> {
  if (!supabase) return;
  const { from, to } = range();
  const args = { p_from: from, p_to: to };

  const [totals, daily, pages, clicks, referrers, devices] = await Promise.all([
    supabase.rpc('analytics_totals', args),
    supabase.rpc('analytics_daily', args),
    supabase.rpc('analytics_top_pages', { ...args, p_limit: 12 }),
    supabase.rpc('analytics_top_clicks', { ...args, p_limit: 12 }),
    supabase.rpc('analytics_referrers', { ...args, p_limit: 8 }),
    supabase.rpc('analytics_devices', args),
  ]);

  const failed = [totals, daily, pages, clicks, referrers, devices].find((r) => r.error);
  if (failed?.error) {
    toast(failed.error.message, 'error');
    return;
  }

  const t = (totals.data as Record<string, number>[] | null)?.[0];
  const sessions = Number(t?.sessions ?? 0);
  setTile('tile-pageviews', Number(t?.pageviews ?? 0).toLocaleString('en-IN'));
  setTile('tile-sessions', sessions.toLocaleString('en-IN'));
  setTile('tile-clicks', Number(t?.clicks ?? 0).toLocaleString('en-IN'));
  setTile(
    'tile-bounce',
    sessions > 0 ? `${Math.round((Number(t?.bounce_sessions ?? 0) / sessions) * 100)}%` : '—',
  );

  const chartHost = $('chart-daily');
  if (chartHost) {
    lineChart(
      chartHost,
      densify((daily.data ?? []) as { day: string; pageviews: number; sessions: number }[]),
    );
  }

  const pagesHost = $('list-pages');
  if (pagesHost) {
    barList(
      pagesHost,
      ((pages.data ?? []) as { path: string; views: number; sessions: number }[]).map<BarRow>(
        (r) => ({
          label: r.path,
          value: Number(r.views),
          sub: `${r.sessions} visitor${Number(r.sessions) === 1 ? '' : 's'}`,
        }),
      ),
      'No page views recorded in this period.',
    );
  }

  const clicksHost = $('list-clicks');
  if (clicksHost) {
    barList(
      clicksHost,
      (
        (clicks.data ?? []) as {
          link_kind: string | null;
          link_label: string | null;
          link_href: string | null;
          clicks: number;
        }[]
      ).map<BarRow>((r) => ({
        label: r.link_label || r.link_href || 'Untitled link',
        value: Number(r.clicks),
        sub: r.link_kind ?? undefined,
      })),
      'No link or button clicks recorded in this period.',
    );
  }

  const refHost = $('list-referrers');
  if (refHost) {
    barList(
      refHost,
      ((referrers.data ?? []) as { ref_host: string; sessions: number }[]).map<BarRow>((r) => ({
        label: r.ref_host,
        value: Number(r.sessions),
      })),
      'No referrers recorded in this period.',
    );
  }

  const devHost = $('chart-devices');
  if (devHost) {
    stackedBar(
      devHost,
      ((devices.data ?? []) as { device: string; sessions: number }[]).map<BarRow>((r) => ({
        label: r.device,
        value: Number(r.sessions),
      })),
    );
  }
}

document.addEventListener('admin:ready', () => {
  const picker = $('range-picker');
  if (picker) {
    for (const option of [7, 30, 90]) {
      const btn = el(
        'button',
        { type: 'button', 'data-days': String(option) },
        `Last ${option} days`,
      );
      btn.addEventListener('click', () => {
        days = option;
        paintPicker();
        void load();
      });
      picker.append(btn);
    }
    paintPicker();
  }

  function paintPicker(): void {
    for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-days]')) {
      const on = Number(btn.dataset.days) === days;
      btn.className = `min-h-[44px] rounded-lg border px-3 text-sm font-medium transition ${
        on
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      }`;
    }
  }

  void load();
});

export {};
