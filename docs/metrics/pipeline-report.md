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

## Round 0 — Baseline · <run date> · commit <sha at run>

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
re-used every round). N=5: each cap once, then re-run the two cleanest client-side caps
(closing the prior issue first, to exercise dedup/idempotency).

| run | cap | issue→PR? | first-try green? | fix attempts | human edits? | review verdict | success? | notes |
|-----|-----|-----------|------------------|--------------|--------------|----------------|----------|-------|
|  1  | keyboard-shortcuts |     |        |        |        |        |        |       |
|  2  | performance        |     |        |        |        |        |        |       |
|  3  | reading-progress   |     |        |        |        |        |        |       |
|  4  | keyboard-shortcuts (re-run) | |  |        |        |        |        |       |
|  5  | performance (re-run)        | |  |        |        |        |        |       |

**Headline:** success rate _/5 · auto-fixer yield _% · first-try green _% ·
mean fix attempts _ · human-edit rate _% · cost/merged-PR ~_ turns.

**Failure modes seen:** <which stage broke, how often>
