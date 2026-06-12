# observability — Research Brief

## What it is
Observability is the ability to understand what's happening inside an app from its external outputs. For a client-side reading app like Finish It, this means capturing errors, performance signals, and key user events (article fetches, chunk navigation, streak updates) directly in the browser — without requiring a backend to be useful. The goal is to go from "something broke for a user" to "here's exactly what happened and why."

## Best practices (top 5)
- **Capture at the global boundary first.** Wire `window.addEventListener('error', ...)` and `window.addEventListener('unhandledrejection', ...)` as the first script in the page. These catch everything else misses — uncaught exceptions and failed async calls alike.
- **Buffer locally, flush lazily.** Don't send on every error. Write to a capped localStorage ring buffer; flush when the app is idle or on `visibilitychange` (tab hidden/closed). This keeps the hot path fast and survives offline.
- **Log context, not just the error.** Each entry should include: timestamp, error message + stack, current screen (`home`/`reader`/`finish`/`calendar`), and the last user action. A bare stack trace is rarely enough to reproduce a bug.
- **Cap the ring buffer.** Limit stored entries (e.g. 50 most recent). localStorage is shared quota — unbounded logging will evict user data.
- **Deterministic gate before LLM review.** Observability data is only useful if it's acted on. Pair with a smoke test that reads the buffer and fails loudly if error rate exceeds a threshold.

## Relevant patterns / APIs
- **`window.onerror(msg, src, line, col, error)`** — synchronous global error hook; fires for script errors. Compatible with every browser, no dependencies.
- **`window.addEventListener('unhandledrejection', e => ...)`** — catches `Promise` rejections that weren't `.catch()`-ed. Essential for Finish It's `fetch`-based article loading.
- **`document.addEventListener('visibilitychange', ...)`** — reliable flush trigger; fires when the user switches tabs or closes the app.
- **`localStorage` ring buffer** — store a JSON array of log entries under a dedicated key (e.g. `finishit_obs`); `shift()` the oldest when over the cap. Fits the single-file, no-build constraint perfectly.
- **`performance.getEntriesByType('navigation')`** — free timing data (DNS, DOM parse, load) from the Navigation Timing API. No instrumentation needed.
- **`console.error` passthrough** — wrap `console.error` to intercept and log to the ring buffer without breaking existing debug output.

## What to avoid
- **Don't log to the same `finishit` localStorage key** that holds user data. Use a separate key (`finishit_obs`) so a bug in observability code can't corrupt streaks or the shelf.
- **Don't block on flush.** Never `await` a network send in the error handler — it can itself throw, creating a loop.
- **Don't capture personal content.** Don't log article text or pasted URLs — just screen names and action types.
- **Don't add an npm package or build step** for this. `window.onerror` + localStorage covers the slice entirely. Park the Worker ingest endpoint as a fast-follow.
- **Don't send on every error in a loop.** A runaway error (e.g. in a `requestAnimationFrame`) can fire thousands of times per second; always deduplicate by message+stack before writing to the buffer.

## Sources
- [Frontend Error Monitoring and Log Collection Practices (DEV Community)](https://dev.to/tianyaschool/frontend-error-monitoring-and-log-collection-practices-1l9i)
- [Frontend Observability: Complete Guide for Web Performance (Iron/Out)](https://www.iron-out.io/frontend-observability/)
- [Observable Frontends: the State of OpenTelemetry in the Browser (Honeycomb)](https://www.honeycomb.io/blog/observable-frontends-opentelemetry-browser)
- [11 Key Observability Best Practices 2026 (Spacelift)](https://spacelift.io/blog/observability-best-practices)
