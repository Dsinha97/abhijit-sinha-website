/**
 * TEMPORARY on-device layout probe for the mobile horizontal-scroll report.
 *
 * Inert unless the URL carries ?diag=1, so it costs a query-string check on
 * every page view and nothing else. It exists because the overflow does not
 * reproduce in desktop emulation at any width, survives `overflow-x: clip` on
 * the root, and is not caused by the shared chrome (/diag, which carries the
 * chrome and no page content, does not scroll). That leaves per-page content
 * as the suspect, which means the measurement has to happen on the real page
 * on the real device.
 *
 * DELETE THIS FILE and its import in BaseLayout.astro once the cause is known.
 */

function describe(el: Element): string {
  const cls = String((el as HTMLElement).className || '')
    .slice(0, 70)
    .replace(/\s+/g, '.');
  return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
}

function report(panel: HTMLElement): void {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const vv = window.visualViewport;
  const lines: string[] = [];

  lines.push('path ' + location.pathname);
  lines.push('clientWidth ' + vw + '  innerWidth ' + window.innerWidth);
  lines.push('html.scrollWidth ' + de.scrollWidth + '  body ' + document.body.scrollWidth);
  lines.push('scrollX ' + Math.round(window.scrollX) + ' / max ' + (de.scrollWidth - vw));
  lines.push('visualVP ' + (vv ? Math.round(vv.width) + ' scale ' + vv.scale.toFixed(2) : 'n/a'));
  lines.push('html overflow-x ' + getComputedStyle(de).overflowX);
  lines.push('screen ' + screen.width + '  dpr ' + window.devicePixelRatio);

  // Which basis does each anchoring strategy actually follow on this device?
  // clientWidth and innerWidth disagree here, and the fix depends on knowing
  // whether vw units and a fixed element's containing block track the honest
  // 411 or the inflated 876.
  const vwProbe = document.createElement('div');
  vwProbe.style.cssText = 'position:absolute;top:0;left:0;height:1px;width:100vw;visibility:hidden';
  const fixedProbe = document.createElement('div');
  fixedProbe.style.cssText = 'position:fixed;top:0;left:0;right:0;height:1px;visibility:hidden';
  const fixedVwProbe = document.createElement('div');
  fixedVwProbe.style.cssText =
    'position:fixed;top:0;left:0;width:100vw;height:1px;visibility:hidden';
  document.body.append(vwProbe, fixedProbe, fixedVwProbe);
  lines.push('100vw ' + Math.round(vwProbe.getBoundingClientRect().width));
  lines.push('fixed inset-x-0 ' + Math.round(fixedProbe.getBoundingClientRect().width));
  lines.push('fixed 100vw ' + Math.round(fixedVwProbe.getBoundingClientRect().width));
  vwProbe.remove();
  fixedProbe.remove();
  fixedVwProbe.remove();

  // Document coordinates, so a scrolled page still reports true edges. Fixed
  // elements are included and flagged rather than filtered - whether one of
  // them is responsible is precisely the open question.
  // What IS filtered is anything inside a scroll container: the carousel cards
  // stick out by design and are clipped by their own track, and 80-odd lines
  // of them would bury the one element that actually matters.
  const found: Array<[number, string]> = [];
  let clipped = 0;
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const right = Math.round(r.right + window.scrollX);
    if (right <= vw + 1) continue;

    let inClipper = false;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (getComputedStyle(p).overflowX !== 'visible') {
        inClipper = true;
        break;
      }
    }
    if (inClipper) {
      clipped += 1;
      continue;
    }

    const pos = getComputedStyle(el).position;
    found.push([right, right + 'px ' + (pos === 'static' ? '' : '[' + pos + '] ') + describe(el)]);
  }
  found.sort((a, b) => b[0] - a[0]);

  lines.push('');
  lines.push('OVERFLOWING ' + found.length + ' (+' + clipped + ' safely clipped):');
  lines.push(found.length ? found.slice(0, 12).map((f) => f[1]).join('\n') : '  none');

  panel.textContent = lines.join('\n');
}

function init(): void {
  if (!/[?&]diag=1(&|$)/.test(location.search)) return;

  // left + 100vw, never `right`/`inset-x`: this probe's own chrome must not
  // reproduce the bug it is measuring. See WhatsAppButton.astro.
  const panel = document.createElement('pre');
  panel.style.cssText = [
    'position:fixed',
    'left:0',
    'width:100vw',
    'box-sizing:border-box',
    'top:0',
    'z-index:2147483647',
    'margin:0',
    'padding:8px',
    'max-height:60vh',
    'overflow:auto',
    'background:#0F172A',
    'color:#fff',
    'font:11px/1.35 ui-monospace,monospace',
    'white-space:pre-wrap',
    'word-break:break-word',
  ].join(';');
  panel.setAttribute('data-diag-panel', '');

  const btnRow = document.createElement('div');
  btnRow.style.cssText =
    'position:fixed;left:0;width:100vw;bottom:96px;z-index:2147483647;display:flex;justify-content:flex-end;padding-right:8px;box-sizing:border-box;pointer-events:none';
  const btn = document.createElement('button');
  btn.textContent = 'Re-measure';
  btn.style.cssText =
    'pointer-events:auto;min-height:44px;padding:0 14px;border-radius:8px;border:0;background:#0F172A;color:#fff;font:600 13px system-ui';
  btn.addEventListener('click', () => report(panel));
  btnRow.append(btn);

  document.body.append(panel, btnRow);
  report(panel);
  window.addEventListener('load', () => report(panel));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

export {};
