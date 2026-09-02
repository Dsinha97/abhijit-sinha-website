# Mobile viewport pitfalls

Written after a horizontal-scroll bug on `/knowledge-corner` that took five
deploys to kill because it does not reproduce in desktop emulation. Read this
before adding anything that floats, clips, or scrolls sideways.

## The symptom

On a phone the whole page pans sideways into a band of empty white. The header
and footer move with it, so it reads as the document scrolling, not a widget.

## The measurement that actually identifies it

`documentElement.clientWidth` is the layout viewport — the number CSS lays out
against, and the honest one. `window.innerWidth` is not the same thing, and on
a real device the two can disagree wildly: a reporting phone returned
**clientWidth 411 against innerWidth 876**, with `html.scrollWidth` pinned to
876 and 465px of horizontal scroll — exactly `876 − 411`.

So the diagnostic is:

```js
const de = document.documentElement;
de.clientWidth;                  // honest layout viewport
window.innerWidth;               // can be much larger; fixed boxes follow THIS
de.scrollWidth - de.clientWidth; // how far the page can pan
```

Then list every element whose `getBoundingClientRect().right + scrollX` exceeds
`clientWidth`, **including `position: fixed` ones**, skipping only those with a
`overflow-x !== visible` ancestor. Filtering fixed elements out as "emulator
noise" is what hid this bug through three rounds of investigation.

The desktop browser pane reproduces the mismatch faithfully
(clientWidth 375 / innerWidth 818). It is not an artifact. Trust it.

## Four causes found, all real

### 1. Fixed elements anchored with `right` / `inset-x-0`

A fixed box resolves its offsets against the **window**, not the layout
viewport. With the window at 876 and the page at 411, `right-6` parked the
floating WhatsApp button at x=852 — far outside the page — and dragged a
horizontal scrollbar along with it.

Probe results from the affected device settle which unit to use:

| anchoring | reported width |
|---|---|
| `100vw` | 411 ✅ |
| fixed `inset-x-0` | 876 ❌ |
| fixed `width: 100vw` | 411 ✅ |

**Rule: float things with `left-0` + `w-screen`, never `right-*` or
`inset-x-*`.** Put `pointer-events-none` on the full-width wrapper and
`pointer-events-auto` on the control, so an invisible strip does not swallow
taps across the bottom of every page. See `WhatsAppButton.astro` and
`PrivacyNotice.astro`.

### 2. `overflow-x: clip` on the root does not save you

It was tried and did nothing, because **the root's overflow does not clip
fixed-position boxes**. It was reverted rather than left in: it fixed nothing
here and would have masked the next overflow bug. (`clip` is still the right
choice over `hidden` if containment is ever genuinely needed — `hidden` makes
the element a scroll container and re-anchors `position: sticky`, which would
break the shrinking header in `BaseLayout.astro`.)

### 3. `sr-only` inside a horizontally scrollable container

Tailwind's `sr-only` is `position: absolute`. With no positioned ancestor its
containing block is the page, so a screen-reader span inside an
`overflow-x-auto` table **escapes the scroll container**, lands at the table's
full width, and scrolls the document. Adding "(opens in a new tab)" markers to
the RTA table on `/investor-services` did exactly that: innerWidth 448 against
clientWidth 375.

**Rule: any element carrying an absolutely positioned descendant inside a
scroll container needs `relative` on it.** The `relative` on the anchor in
`DataTable.astro` is load-bearing — do not tidy it away.

### 4. Horizontally scrollable regions themselves

Even with every element accounted for and the overflow list at zero, the
Knowledge Corner still panned 465px. The last scrollable region was the
carousel track, whose cards ran to ~1486px inside it. Removing it collapsed the
mismatch outright: innerWidth fell to match clientWidth and page scroll went to
zero.

**The carousels are gone deliberately.** The previews are a plain grid — one
column on a phone, two from `sm`, three from `lg` — and the "View all" links
lead to the full listings. If a carousel is ever proposed again, it must be
measured against this bug on a real device first, not restored from git.

Note that `DataTable`'s `overflow-x-auto` survives on `/investor-services` and
`/disclosures`. It was verified not to trigger this on its own — a table 850px
wide inside a 343px box left innerWidth untouched. The trigger in cause 3 was
the escaping `sr-only`, not the scroll container.

## How to investigate the next one

Emulation gets you most of the way, but the decisive evidence came from the
device. A throwaway probe script rendered its readings into a fixed panel on
the page, so a phone with no devtools could report `clientWidth`,
`innerWidth`, scroll extents, what `100vw` resolves to, and the overflow list
from a screenshot. It was deleted once the cause was known. Rebuild it rather
than guessing from a desktop — three of the four causes above were invisible
locally until the device numbers pointed at them.

And when the probe's own UI is fixed-position, anchor it with `left` + `100vw`
too, or it reproduces the bug it is measuring.
