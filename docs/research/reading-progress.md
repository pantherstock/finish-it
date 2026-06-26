# reading-progress — Research Brief

## What it is

A reading-progress indicator tells the reader how far through the piece they are and
how much remains. In most articles this is a scroll-linked bar; in **Finish It** the
content is delivered as discrete *bites* (one `.chunk-card` at a time, advanced with
"I've read this →" / arrow keys), so "progress" means **bite N of M through the
reading**, not scroll percentage. Today the only progress signal is the desktop plant's
caption (`plantMeta`: "… · bite N of M") — and it sits inside `.plant-side`, which is
`display:none` on mobile. So mobile readers, and anyone past the plant, get no sense of
how far along they are.

## Best practices (top 3–5)

- **Measure real units, not fake ones.** For a bite-based reader the honest metric is
  `(currentBite) / (totalBites)`. Don't fake a scroll bar over a single short card —
  it would read 0–100% on every bite and mislead.
- **Always visible, never intrusive.** A thin (3–5px) bar pinned to the top of the
  reader, or a small "N of M" label, that updates as bites advance. It should not cover
  text or shift layout when it changes (animate width/transform, not surrounding boxes).
- **Expose progress to assistive tech.** Use `role="progressbar"` with
  `aria-valuemin="0"`, `aria-valuemax`, and a `aria-valuenow` that updates per bite, plus
  an `aria-label` like "Reading progress". A visible "N of M" label helps everyone, not
  just screen-reader users.
- **Respect `prefers-reduced-motion`.** Disable the fill transition under
  `@media (prefers-reduced-motion: reduce)` — the value still jumps to the right place,
  just without the animation.
- **Don't rely on colour alone.** Pair the bar's fill with a textual "N of M" so progress
  is legible to colour-vision-deficient users and meets non-text-contrast guidance.

## Relevant patterns / APIs

- Plain DOM + CSS: a fixed/sticky `<div role="progressbar">` whose width (or a child's
  `transform: scaleX()`) is set from `active.view + 1` over `total` in the existing render
  path (around `plantMeta` at index.html:767). No new library — fits the single-file,
  vanilla-JS constraint.
- `prefers-reduced-motion` media query for the transition; `aria-valuenow`/`aria-label`
  for semantics. Update ARIA only when the value actually changes to avoid redundant
  screen-reader announcements.
- This is **not** a `window.scroll` bar: bites are short cards, so progress is driven by
  the bite index the reader already tracks, not scroll position.

## What to avoid

- **A scroll-percentage bar.** Wrong model for short per-bite cards; it would be noisy and
  dishonest.
- **Desktop-only again.** The whole gap is that the current signal is hidden on mobile —
  the new indicator must be visible at mobile widths (where `.plant-side` is hidden).
- **Layout shift / CLS.** A bar that pushes the text down when it appears or grows hurts
  the calm reading feel; pin it and animate transform/width only.
- **Over-announcing to screen readers.** Re-emitting `aria-valuenow` on every frame or
  unchanged value spams AT — update once per bite change.

## Sources

- [MDN — ARIA: progressbar role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/progressbar_role)
- [web.dev — prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion)
- [WCAG — Non-text Contrast (1.4.11)](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)
