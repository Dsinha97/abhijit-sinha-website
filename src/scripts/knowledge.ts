/**
 * Knowledge Corner interactivity: the "Show more" description toggles.
 *
 * Progressive enhancement. Without this script descriptions stay clamped to
 * three lines with the full text one click away on the destination page.
 * Nothing here is required to read the content.
 *
 * The carousel code that used to live here went with the carousels themselves:
 * a horizontally scrollable track was the last thing on the landing page that
 * could pan sideways on a phone, and the previews are a plain grid now.
 */

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
