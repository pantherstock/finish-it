# Research: Performance

## What it is

For Finish It, "performance" means how fast the page becomes usable and how smoothly it runs —
First/Largest Contentful Paint (how soon the reader sees text), Cumulative Layout Shift (text
not jumping as fonts/assets load), and a responsive main thread. The app is a single static
`index.html` served from Cloudflare, so the usual heavy levers (bundling, code-splitting, image
pipelines, SSR) don't apply. The dominant cost on first load is the **two external Google Fonts
families** (Fraunces + Newsreader); after that the app is small enough that DOM/JS cost is
negligible. So performance work here is mostly about the critical render path — getting text on
screen without waiting on the font CDN — not micro-optimizing JS.

> Note: page-load *metrics logging* into the observability ring buffer already shipped (issue #16).
> This capability is about *improving* load performance, not measuring it — keep the two distinct.

## Best practices (top 3–5)

1. **Don't let the web-font stylesheet block render.** A `<link rel="stylesheet">` to the Google
   Fonts CSS is render-blocking: the browser won't paint until it downloads. Load it
   asynchronously (preload-as-style + `media="print" onload="this.media='all'"` swap, with a
   `<noscript>` fallback) so the page paints immediately in the system fallback and the webfont
   swaps in when ready. This is the single highest-impact change for this app's FCP/LCP.
2. **Keep `font-display: swap`.** Already present in the font URL — it shows fallback text
   immediately instead of invisible text (FOIT). Keep it; pair it with a sensible system fallback
   in `font-family` (already done: `"Newsreader", Georgia, serif` / `"Fraunces", serif`).
3. **Mind the CLS tradeoff of async fonts.** Async-loading the CSS means the swap can happen a
   little later, and a custom serif replacing a system serif reflows text (CLS). For this app the
   fallbacks are already serifs (modest metric difference). If CLS becomes visible, the textbook
   mitigation is `size-adjust` / `ascent-override` on a `@font-face` — but that requires
   self-hosting the font, which collides with the single-file constraint, so it's out of scope for
   a first pass.
4. **Batch DOM writes; avoid read-after-write layout thrashing.** The app already builds markup as
   one `innerHTML` string per render (`renderReader`, `renderShelf`, `renderCalendar`) — that's the
   right pattern. Don't regress it into per-element appends interleaved with layout reads.
5. **Preconnect sparingly, only to origins on the critical path.** Already correct: two preconnects
   to `fonts.googleapis.com` and `fonts.gstatic.com`. Don't add more.

## Relevant patterns / APIs

- **Async stylesheet pattern** (no JS framework needed):
  ```html
  <link rel="preload" as="style" href="<fonts-css-url>">
  <link rel="stylesheet" href="<fonts-css-url>" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="<fonts-css-url>"></noscript>
  ```
- **`font-display: swap`** — already in the Google Fonts URL query string.
- **`requestAnimationFrame`** — for any future scroll/animation work; batch visual updates to one
  frame. Not currently needed.
- **Lighthouse / DevTools Performance panel** — "Eliminate render-blocking resources" and the
  FCP/LCP markers are how you verify the change.

## What to avoid

- **Leaving the font CSS render-blocking** — the current state; the gap this capability targets.
- **Self-hosting fonts or adding a build step** to chase `size-adjust` — violates the single-file,
  no-toolchain constraint for a marginal CLS gain.
- **Removing `font-display: swap`** — would reintroduce FOIT (invisible text on slow connections).
- **Over-preconnecting / preloading every font weight** — competes for bandwidth; preconnect only
  critical origins.
- **Refactoring the render functions into per-node DOM ops** — would introduce the layout
  thrashing the current `innerHTML`-string approach avoids.
- **Conflating this with observability** — #16 already logs perf metrics; don't re-add measurement.

## Sources

- [Best practices for fonts — web.dev](https://web.dev/patterns/web-vitals-patterns/fonts)
- [How to Load Fonts in a Way That Fights FOUT — CSS-Tricks](https://css-tricks.com/how-to-load-fonts-in-a-way-that-fights-fout-and-makes-lighthouse-happy/)
- [Preload Web Fonts for Better Core Web Vitals — DebugBear](https://www.debugbear.com/blog/preload-web-fonts)
- [How To Fix Forced Reflows And Layout Thrashing — DebugBear](https://www.debugbear.com/blog/forced-reflows)
