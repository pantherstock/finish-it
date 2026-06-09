# Test evidence — Finish It

There's no automated test suite (single static file, no toolchain by design). This is
the **manual / agent-runnable checklist** that stands in for one. Run it before opening
a PR; check the boxes you re-verified and bump "Last verified". An agent can run it via
Playwright MCP; a human can run it by hand in any browser.

How to run: open `index.html` (or the live site) in a fresh browser profile / cleared
`localStorage`, then walk each item. Mirrors `FEATURES.md`.

## Core loop (must always pass)
- [x] Paste raw text → **Begin →** → reader opens and splits into chunks
- [x] **Next →** advances through chunks; the plant grows with progress
- [x] On a comprehension chunk: picking **correct** → ✓ + "that's it.", **Continue →** appears
- [x] On a comprehension chunk: picking **wrong** → ✗ on the pick, ✓ on the right answer
- [x] **I've read this →** → Finish screen shows recap + streak
- [x] Finishing marks **today** on the calendar and increments the streak

## Input variants
- [x] Sample chip starts a read in one click
- [x] A real article **URL** fetches, extracts, and reads cleanly (no citation/link artifacts)
- [x] Empty input → **Begin →** does nothing (no crash)

## Edge cases
- [x] Garbage / paywalled URL → graceful fallback, no hard error
- [x] Very long pasted text → chunks sensibly, reader stays usable
- [x] Refresh mid-read → shelf + progress persist (`localStorage`)
- [x] Delete a read from the shelf → it's removed and stays removed after refresh
- [x] "↩ look back at the passage" peek toggles without losing quiz state

## Last verified
- **2026-06-09** — core loop + edges, manual + Playwright MCP, live site. All passing.

> When you change extraction (`cleanMarkdown`/`BOILER`) or question generation
> (`makeQuestion`), re-run the relevant rows on a **real article URL** — that's where
> regressions have historically appeared.
