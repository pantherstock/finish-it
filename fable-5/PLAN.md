# Finish It — the `fable-5` rebuild

A re-implementation of `index.html`, plus this plan. Everything lives in this folder;
nothing outside it was touched. Open `fable-5/index.html` in a browser — still one
static file, no build step, no dependencies, no keys.

---

## 1. Where the roadmap stands (review)

The repo's roadmap (`plan/roadmap.md`) splits into **dev-process** work (review
pipeline, observability, multi-persona QA — all about the automation loop) and
**app** work. The app column has exactly two items:

1. **Add LLM capabilities** — smarter extraction, semantic chunking, real
   comprehension questions, adaptive bite sizing. Blocked on a Cloudflare Worker
   proxy (the *no-browser-side-LLM-keys* rule).
2. **Deploy as a Worker/Function** — the home for that proxy plus server-side
   article fetch.

The product brief (`plan/learn-anything-brief.md`) is blunter about what's weak. Its
"faked / heuristic — make-or-break upgrade targets" are:

- **Chunking** — word-count packing, "coherent-ish, but not semantic."
- **Recall questions** — single cloze type, "functional, sometimes awkward."
- **Extraction cleanup** — regex rules, "better than nothing."

The brief's answer is "replace all three with Claude," which is right long-term but
needs the Worker. **This rebuild takes a different cut: push every one of those three
engines as far as deterministic, client-side logic can go, and leave a clean seam so
the Claude version drops in later without touching the UI.** The result should feel
like a different app even before any LLM is involved.

## 2. What the rebuild changes

### Engine (the three upgrade targets)

**Extraction v2** (`cleanMarkdown` → block parser)
- Parses Jina markdown into typed blocks (`heading` / `paragraph`) instead of a flat
  string, so document *structure* survives cleaning.
- Wider boilerplate net (nav, share rows, bylines, cookie banners, "min read" chrome,
  footnote markers like `[1]`/`[citation needed]`), link-density filtering, and
  leading/trailing cruft shaving — all kept, extended, and applied per-block.
- Fetch gets a 20 s abort timeout so a hung link can't wedge the Begin button.

**Chunking v2** (structure-aware)
- Chunks pack whole paragraphs toward a target size but **respect section
  boundaries**: a heading closes the previous chunk early rather than straddling it,
  and the section title rides along as a small-caps *kicker* on the chunk where the
  section starts. Bites now follow the author's structure, not just a word counter.
- Adaptive bite size — *snack ≈ 70 / standard ≈ 105 / hearty ≈ 150 words* — is a
  user setting (roadmap's "adaptive bite sizing", the deterministic version).
  Applies to new readings; in-flight progress is never invalidated.
- Articles now store their **clean source text**, so re-chunking (and the future
  LLM call) never needs a re-fetch.

**Question engine v2**
- **Two question types**: word cloze and **number recall** (blank a salient figure;
  distractors are plausible perturbations of it). Numbers are what people actually
  misremember — and they make fair, unambiguous questions.
- **Smarter cloze targets**: candidates scored by length, capitalisation
  (proper-noun-ish), concept suffixes (-tion/-ism/-ity), and article-wide rarity;
  the engine tries several candidates until one yields a *fair* question.
- **Fairness guards**: host sentence must be 8–38 words; every occurrence of the
  answer in the prompt gets blanked (no answer leaking); questions that can't meet
  the bar are skipped rather than shipped awkward.
- **Shape-matched distractors**: same capitalisation class, similar length, drawn
  from elsewhere in the same article — so wrong options look genuinely plausible.
- **Recall score**: each reading tracks *recalled X of Y*, shown on the finish
  screen. Retrieval practice now has visible feedback.

### Experience (new since the original)

- **Dusk mode** — a full warm-dark "reading by lamplight" theme (auto-follows the
  OS, or pinned Day/Dusk). A reading app people use at night needed this.
- **Reading settings** — theme, bite size, text size; persisted, in a calm sheet.
- **Keyboard flow** — `space`/`→` advance, `←` review, `1–4` answer, `Enter`
  continue. A whole article is finishable without touching the mouse.
- **Calendar with month navigation** — browse past months (the original could only
  show the current one), plus gentle all-time totals (things finished, words read).
  Still doors, still no streaks, still no guilt.
- **Resume affordance** — the most recent in-progress read surfaces as a distinct
  "still open" card with a progress filament, above the rest of the shelf.
- **Mobile progress filament** — the plant is desktop-only; mobile now gets a slim
  vine-coloured progress thread instead of nothing.
- **Undo on delete** — removing a shelf item offers a 6-second undo in the toast,
  instead of being irreversible.
- **Export / import** — download the whole local state as JSON and restore it;
  the answer to "localStorage is the only copy."
- **Accessibility & motion** — focus-visible styles, `aria-live` feedback,
  dialog semantics on the sheet, and a `prefers-reduced-motion` pass that stills
  every animation.

### Design (same soul, higher fidelity)

The brief locked the vibe — warm paper, Fraunces + Newsreader, terracotta/gold/sage,
"earned calm" — so the rebuild keeps the identity and raises the execution:

- **Editorial print language**: hairline double rules, small-caps kickers, drop caps
  on each bite, numbered option letters — the app reads like a well-set page.
- **A generative SVG vine** replaces the div-based plant: a real curving stem that
  grows by stroke-dashoffset, leaves placed along the actual path (one per bite),
  a travelling bud, and a layered bloom at the end. It animates *between* states
  instead of re-rendering.
- **A composed finish moment**: bloom rings, drifting petals (stilled under
  reduced-motion), the recall score, and the one-line recap — quiet exhale, not
  jackpot.
- **Atmosphere**: paper grain, radial light pools (lamplight pools in dusk),
  staggered hero reveal on load.

## 3. Architecture notes

- **Still one file.** Inline CSS + vanilla JS, ~matching the repo's constraint and
  style. No framework, no toolchain.
- **The LLM seam — now filled**: article preparation funnels through one shape —
  `{ summary, words, chunks:[{text, kicker}], questions }`. `fetchLesson()` asks
  the Worker's `POST /api/lesson` (Claude with a structured-output schema) for
  that shape; on file://, a plain static host, a missing key, a rate limit, or
  any error it returns null and the deterministic `buildLesson()` heuristics
  take over. The reader, vine, quiz, and finish screens never know which engine
  produced the lesson.
- **The Worker** (`worker.js` + `wrangler.jsonc` in this folder) serves the app's
  static files *and* the `/api/lesson` route. `ANTHROPIC_API_KEY` is a Worker
  secret; the model defaults to Sonnet 4.6 per the brief (a `MODEL` var switches
  to Haiku for ~3× cheaper or Opus for max quality). It carries a per-IP daily
  soft limit and a 60K-char input cap so a shared URL can't run up the bill.
- **Storage**: new key `finishit-f5` so it never fights the original app on the same
  origin. On first run it **migrates** an existing `finishit` shelf/calendar
  (read-only — the original's data is left intact).
- **Day keys** stay `y-m-d` (0-based month), compatible with migrated data.

## 4. Deliberately not done

- **No Claude calls from the browser** — the no-client-side-keys rule holds; the
  browser only ever talks to the Worker's `/api/lesson`, and works fully without it.
- **No service worker / PWA** — would mean a second file; the single-file constraint
  wins for now.
- **No accounts, sync, streaks, reminders, TTS** — explicit brief non-goals.
- **No changes outside `fable-5/`** — the live site, QA loop, and docs are untouched.

## 5. How to verify (mirrors TEST-EVIDENCE.md)

1. Open `fable-5/index.html`. Hero, paste box, samples, shelf render; grain visible.
2. Paste a real article URL → Begin: fetches via `r.jina.ai`, kickers appear where
   the article had section headings.
3. Paste raw text → Begin: chunks without fetch; short text is rejected with a toast.
4. Read a sample end-to-end: bites advance (`space` works), the vine grows a leaf per
   bite, questions appear with letter keys `1–4`, wrong picks show ✗ + the right
   answer ✓, "look back at the passage" peeks.
5. Finish: bloom + petals, *recalled X of Y*, recap; calendar door for today opens.
6. Calendar: navigate to a past month and back; future nav is blocked; totals line.
7. Settings: switch Dusk (whole app re-themes), bite size (affects *new* reads),
   text size; export downloads JSON; import restores it.
8. Refresh: shelf, progress, settings, and days all survive.
9. Delete a shelf row → undo from the toast restores it.
10. Narrow viewport: plant hides, the progress filament appears, layout holds.
11. With the Worker deployed + key set: start a read → bites arrive as semantic,
    Claude-written lessons (questions no longer cloze-only). Kill the key (or
    serve statically) → the same flow silently uses the heuristics.

## 6. Deploying this folder as its own Worker

The repo root's Worker already serves this folder statically at
`/fable-5/` (its `assets.directory` is the whole repo) — but that deployment has
no API route. For the LLM engine, deploy this folder as a second Worker:

- **CLI**: `npx wrangler deploy --config fable-5/wrangler.jsonc`, then
  `npx wrangler secret put ANTHROPIC_API_KEY --config fable-5/wrangler.jsonc`.
- **Git-connected** (like the main site): Cloudflare dashboard → Workers →
  Create → import the same GitHub repo → set *Path to Wrangler configuration
  file* to `fable-5/wrangler.jsonc` → add `ANTHROPIC_API_KEY` under Settings →
  Variables → Secrets. It then auto-deploys on every merge to `main`, alongside
  the original site, at its own `finish-it-fable5.<account>.workers.dev` URL.

`.assetsignore` keeps `worker.js`, `wrangler.jsonc`, and this plan out of the
served assets.
