/**
 * Knowledge Corner interactivity: carousel arrows and "Show more" toggles.
 *
 * Both are progressive enhancement. Without this script the carousel tracks are
 * still scrollable by touch, trackpad and keyboard, and descriptions stay
 * clamped to three lines with the full text one click away on the destination
 * page. Nothing here is required to read the content.
 */

// ---------------------------------------------------------------- carousels

function cardStep(track: HTMLElement): number {
  const first = track.querySelector<HTMLElement>(':scope > *');
  if (!first) return track.clientWidth;
  const gap = Number.parseFloat(getComputedStyle(track).columnGap || '16') || 16;
  // Scroll by whole cards so a card never ends up half in view.
  return first.getBoundingClientRect().width + gap;
}

function syncArrows(track: HTMLElement): void {
  const id = track.id;
  const prev = document.querySelector<HTMLButtonElement>(`[data-carousel-prev="${id}"]`);
  const next = document.querySelector<HTMLButtonElement>(`[data-carousel-next="${id}"]`);
  if (!prev || !next) return;

  // The track carries horizontal padding, so its resting scrollLeft at the very
  // start is the padding value, not zero - comparing against 0 would leave the
  // "scroll left" arrow enabled on a track already at its start.
  const padLeft = Number.parseFloat(getComputedStyle(track).paddingLeft) || 0;
  // Fractional layout widths mean scrollLeft rarely lands exactly on the
  // maximum, hence the tolerance on the other end too.
  const maxScroll = track.scrollWidth - track.clientWidth;
  const overflows = maxScroll > padLeft + 2;

  // Only the responsive class is toggled - `hidden` stays on the button for
  // good. Removing it would drop the arrow back to a button's default
  // inline-block below the sm breakpoint, where `sm:flex` does not apply: the
  // arrows are translated half their width past the track edge, so on a phone
  // they poked out beyond the viewport and gave the whole page a horizontal
  // scrollbar. `hidden sm:flex` is the pairing used elsewhere (Header.astro).
  for (const btn of [prev, next]) {
    btn.classList.toggle('sm:flex', overflows);
  }
  prev.disabled = track.scrollLeft <= padLeft + 2;
  next.disabled = track.scrollLeft >= maxScroll - 2;
}

/**
 * Animates scrollLeft by hand rather than relying on `behavior: 'smooth'`.
 *
 * The important part is the fallback, not the easing. Anything frame-driven -
 * native smooth scrolling included - is suspended when the document is hidden
 * and can be throttled in power-saving modes, which would leave the arrows
 * silently doing nothing. BaseLayout.astro already carries the same lesson
 * about rAF for the sticky header. So the destination is computed up front and
 * assigned outright whenever animation cannot be trusted to run; the animation
 * is a nicety layered on top, never the thing that makes scrolling work.
 */
function animateScroll(track: HTMLElement, delta: number): void {
  if (delta === 0) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const from = track.scrollLeft;
  const to = Math.max(0, Math.min(from + delta, track.scrollWidth - track.clientWidth));

  if (reduceMotion || document.hidden || to === from) {
    track.scrollLeft = to;
    syncArrows(track);
    return;
  }

  const DURATION = 350;
  const start = performance.now();
  // easeOutCubic: quick to start, settles gently.
  const ease = (x: number) => 1 - (1 - x) ** 3;

  let started = false;
  const frame = (now: number) => {
    started = true;
    const progress = Math.min(1, (now - start) / DURATION);
    track.scrollLeft = from + (to - from) * ease(progress);
    if (progress < 1) requestAnimationFrame(frame);
    else syncArrows(track);
  };
  requestAnimationFrame(frame);

  // If the first frame never arrives - a backgrounded tab, an aggressively
  // throttled renderer - jump to the destination rather than stay put.
  setTimeout(() => {
    if (!started) {
      track.scrollLeft = to;
      syncArrows(track);
    }
  }, DURATION + 100);
}

function initCarousels(): void {
  const tracks = document.querySelectorAll<HTMLElement>('[data-carousel]');

  for (const track of tracks) {
    syncArrows(track);
    track.addEventListener('scroll', () => syncArrows(track), { passive: true });

    // The step must be clamped to the distance actually remaining. A smooth
    // scrollBy past the end is not clamped by the browser - it is dropped, and
    // the track does not move at all. With three cards visible and a partial
    // card left over, a full card-width step overshoots on the final press and
    // the arrow silently stops working.
    const step = (direction: 1 | -1) => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const remaining =
        direction === 1 ? maxScroll - track.scrollLeft : track.scrollLeft;
      return direction * Math.max(0, Math.min(cardStep(track), remaining));
    };

    const id = track.id;
    document
      .querySelector<HTMLButtonElement>(`[data-carousel-prev="${id}"]`)
      ?.addEventListener('click', () => animateScroll(track, step(-1)));
    document
      .querySelector<HTMLButtonElement>(`[data-carousel-next="${id}"]`)
      ?.addEventListener('click', () => animateScroll(track, step(1)));

    // Card widths are percentage-based, so the overflow state changes with the
    // viewport, not just with content.
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => syncArrows(track)).observe(track);
    }
  }
}

// -------------------------------------------------------------- show more

function initClamps(): void {
  for (const wrap of document.querySelectorAll<HTMLElement>('[data-clamp]')) {
    // initClamps runs twice - once now, once after webfonts settle - so a
    // clamp already wired must not pick up a second click listener.
    if (wrap.dataset.clampReady === 'true') continue;

    const text = wrap.querySelector<HTMLElement>('[data-clamp-text]');
    const toggle = wrap.querySelector<HTMLButtonElement>('[data-clamp-toggle]');
    if (!text || !toggle) continue;

    // Measured, not guessed: the same string wraps to two lines on a desktop
    // card and five on a phone, so character count is the wrong test.
    const overflows = text.scrollHeight > text.clientHeight + 1;
    if (!overflows) continue;

    // The display utility is added here rather than baked into the markup.
    // Tailwind's preflight hides [hidden] with a rule of the same specificity
    // as a utility class, and utilities ship later in the stylesheet - so a
    // button carrying both `hidden` and `inline-flex` is never actually
    // hidden, and this measurement would decide nothing.
    toggle.hidden = false;
    toggle.classList.add('inline-flex', 'items-center');
    wrap.dataset.clampReady = 'true';
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      text.classList.toggle('line-clamp-3', expanded);
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.textContent = expanded ? 'Show more' : 'Show less';
    });
  }
}

function init(): void {
  initCarousels();
  initClamps();
}

// Fonts change line height, and a clamp measured against a fallback face can
// misjudge whether the text overflows. Re-measure once webfonts settle.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
document.fonts?.ready.then(initClamps).catch(() => {});
