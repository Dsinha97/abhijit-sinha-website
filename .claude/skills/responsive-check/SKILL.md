---
name: responsive-check
description: Drive the preview browser through the site's standard breakpoint matrix and check each page for sideways scroll, clipped text and misaligned elements. Use when asked to "check responsive layout", "test mobile", "resize check", or before shipping a layout change.
---

# Responsive Check

The breakpoint list lives in `breakpoints.json` so it is not re-derived each time. The site is
light-only, so the matrix runs one colour scheme. Read
[docs/wiki/mobile-viewport-pitfalls.md](../../../docs/wiki/mobile-viewport-pitfalls.md) first: the
site's worst bug did not reproduce in desktop emulation.

## Procedure

1. `preview_start` with `{name: "astro-dev"}`. Never start the server with Bash.
2. For each breakpoint in `breakpoints.json`, call `resize_window`, then navigate to the page under
   test (reload if it is already open).
3. After the page settles, run this with `javascript_tool` and record the result:
   ```js
   ({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth })
   ```
   `overflow: true` is a failure at that breakpoint. List the widest offending elements.
4. Take a `computer` screenshot and look for clipped text, overlap, and a WhatsApp button that is
   off-screen.
5. Check touch targets are at least 44x44px at the mobile breakpoints.
6. Finish with `resize_window` preset `desktop` to clear the emulation.

## Report

State the exact breakpoint and page of each failure and what is wrong. Do not write "looks fine".

## Limits

Emulation does not reproduce the real-phone case where the window measured 876px against a 411px
layout viewport. If the change floats, clips or scrolls anything, say that a real-device check is
still needed.
