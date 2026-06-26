# Capability Pipeline — Metrics Report

## How to read this
One success criterion (below), one section per measurement round. Baseline first,
then one section per improvement chunk. Compare the headline success rate across rounds.

## Success criterion
A run succeeds when ALL hold: issue was PR-sized + client-side · auto-fixer opened a PR ·
gate green within ≤1 fix-loop attempt · merged with no manual code edits · review verdict
not negative.

## Metric set
The six headline metrics (see `plan/pipeline-upgrades-session.md` Part 0):

| Metric | What it tells you | Source |
|--------|-------------------|--------|
| End-to-end success rate | north star: % of N runs that reached clean merge, no human code edits | run table |
| Auto-fixer yield | % of filed issues that became a PR | `gh pr list` vs `gh issue list` |
| First-try gate pass rate | % of PRs green with zero fix-loop attempts | `fix-attempt-N` labels absent |
| Fix-loop attempts to green | mean attempts (0–3) the loop needed | count `fix-attempt-N` labels |
| Human-edit rate | % of merged PRs that needed manual code changes | recorded by hand |
| Cost per merged PR | total turns (or tokens) ÷ merged PRs | claude-code-action run logs |

Canary signals to note alongside: `permission_denials_count` (the green-but-nothing canary)
and turns-used vs `--max-turns` per stage.

---

## Round 0 — Baseline · 2026-06-25 · commit 0088a18 (+ PR #29 pending merge)

**What's implemented today (prose):**
The `/ship <cap>` front-half runs locally: `/research` writes a brief to
`docs/research/<cap>.md` and pings Discord; `/scope-gaps` reads the brief + `index.html`,
dedups against open issues, auto-creates the `capability:<cap>` label, and files one
PR-sized `agent-found` issue. The label fires `auto-fixer.yml` (sonnet, 25 turns), which
branches, edits `index.html`, and opens a PR. `quality-gate.yml` (html-validate +
Playwright smoke of the core loop) runs on the PR and pings Discord when green. An
event-driven `fix-loop.yml` (`workflow_run` on gate failure) re-patches up to 3 times,
tracked by `fix-attempt-N` labels, then hands off to a human. `review.yml` posts an
advisory adversarial critique. A human merges; Cloudflare redeploys.

*Known flaky:* the adversarial reviewer (`review.yml`) still hits `error_max_turns`,
especially on large multi-file PRs (diagnosed 2026-06-25 — fix deferred to Round 1). The
event-driven fix-loop is built but lightly exercised end-to-end.

**Protocol:** test set = `keyboard-shortcuts`, `performance`, `reading-progress` (locked;
re-used in later rounds). Planned N=5 (each cap once, then re-run two), but **stopped at N=2**:
both runs failed the same way for the same reason, so the top failure mode was already
unambiguous and the remaining runs (incl. the dedup re-runs) weren't worth the spend for Round 0.
Treat the rate as N=2 — directional, not precise; re-runs resume in the round that tests a fix.

| run | cap | issue→PR? | first-try green? | fix attempts | human edits? | review verdict | success? | notes |
|-----|-----|-----------|------------------|--------------|--------------|----------------|----------|-------|
|  1  | keyboard-shortcuts | ✅ #27 | ✅ | 0 | no (merge as-is) | ⚠️ negative | ❌ | merged as-is by human; **fails criterion on negative review** — gate green first-try but review caught a real Shift+Space scroll-hijack bug the gate missed. Reviewer ran fine (small single-file PR). |
|  2  | performance        | ✅ #29 | ✅ | 0 | no (merge as-is) | ⚠️ negative | ❌ | merged as-is by human; **fails criterion on negative review** — gate green first-try; review negative for **infra not code** reasons: (1) acceptance check named "Playwright-assertable" but no test added [→ Chunk T/C2], (2) brief not committed to main so reviewer can't audit it [2/2 runs], (3) `crossorigin` double-fetch nit. Reviewer ran fine. |

**Headline (N=2):** success rate **0/2** · auto-fixer yield **100%** (2/2 issues → PR) ·
first-try gate green **100%** (2/2, zero fix-loop attempts) · mean fix attempts **0** ·
human-edit rate **0%** (both merged unchanged) · cost/merged-PR **~5–8 auto-fixer turns / $0.13–0.16**
(plus the paid adversarial review, the dominant per-PR LLM cost — confirms why the free
deterministic gate runs first).

**Failure modes seen:**

- **Negative adversarial review — 2/2 runs (the only failure stage).** Every other stage was
  perfect: issues filed clean and PR-sized, auto-fixer opened a PR every time, the deterministic
  gate passed first-try every time with zero fix-loop attempts, no human code edits needed. The
  loop's *mechanics* are reliable; the **quality bar** is where it fails.
- **Root cause — the deterministic gate is too shallow.** The Playwright smoke only walks the
  happy path (paste→read→answer→finish→streak), so it never catches edge cases or enforces an
  issue's acceptance checks. Everything real therefore lands on the LLM reviewer, whose negative
  verdict then defines the success metric. Two faces of the same gap:
  - *Run 1 (code):* review caught a genuine bug (`Shift+Space` scroll-hijack) the gate sailed past.
  - *Run 2 (infra):* the auto-fixer wrote correct code, but the acceptance check it was told was
    "Playwright-assertable" had no actual test, so the reviewer couldn't green-light it.
- **Secondary, confirmed 2/2 — the research brief never reaches CI.** `/ship` writes
  `docs/research/<cap>.md` locally and it's never committed to `main`, so the auto-fixer/reviewer
  (which branch from `main`) can't read it; the reviewer downgrades and audits only the issue's
  inline quotes. A small, well-scoped pipeline fix.
- **Reviewer max-turns did NOT recur.** Both reviews completed cleanly — consistent with the
  2026-06-25 diagnosis that `error_max_turns` is confined to large multi-file PRs, not the small
  scoped PRs the pipeline normally produces. Supports keeping the Round 1 reviewer fix narrow.

**→ What Round 1+ should target (in priority order):**
1. **Chunk T / C2 — executable acceptance checks** (deepen the gate; make acceptance items real
   Playwright assertions). Directly attacks the only failure stage. Highest leverage.
2. **Commit the brief so CI can read it** (small fix; closes the 2/2 secondary finding).
3. **The deferred reviewer max-turns fix** — still worth doing for large PRs, but the baseline
   shows it is *not* what's capping the success rate.

---

## Round 1 — Chunk C2 landed (executable acceptance checks) · 2026-06-26 · PR #45

**What changed:** `/scope-gaps` now emits each acceptance check as a Playwright assertion in the
issue body; `auto-fixer.yml` writes that test **verbatim** onto its branch and must make
`index.html` satisfy it; `quality-gate.yml` also triggers on `tests/**`. The reviewer's old
*comment* about an unmet acceptance check becomes an objective gate red/green that `fix-loop.yml`
converges — no same-model-reviews-its-own-fix loop (the C1 trap C2 was chosen over). Files:
`.claude/commands/scope-gaps.md`, `.github/workflows/auto-fixer.yml`,
`.github/workflows/quality-gate.yml`, `AGENTS.md`.

**Design choice:** the emitted test rides the **fix branch** (issue body → auto-fixer), not
`main`, so a not-yet-implemented assertion can't poison other concurrent PRs' gates.

**Pre-merge validation (local, deterministic — no CI spend):** installed Playwright as CI does,
served `index.html`, and ran the suite.
- Baseline smoke suite: **5/5 pass** (unchanged — C2 touches no `index.html`/`tests/`).
- C2 mechanics demo — dropped in a throwaway emitted-style spec (since deleted): the gate
  **auto-discovered it with no `playwright.config` change**, passed the assertion for an existing
  behavior, and **failed the assertion for a not-yet-built feature** (a text-size control), exiting
  non-zero — exactly the red that triggers `fix-loop.yml`. Confirms the C2 path enforces an
  acceptance check end-to-end (gate discovery + red/green) ahead of the live round.

**Not yet measured:** the full Round-1 success-rate row is intentionally pending. It requires C2
**on `main`** (both `/scope-gaps` and the auto-fixer branch from `main`), so it will be taken from
the first real post-merge `/ship` on the locked test set (`keyboard-shortcuts`, `performance`,
`reading-progress`), resuming the N count. Expected movers vs. Round 0: review verdict → pass,
first-try gate pass rate, human-edit rate, and end-to-end success rate.
