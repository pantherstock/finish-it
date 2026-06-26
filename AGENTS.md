# AGENTS.md — working on Finish It

Guide for any coding agent (Claude Code, the CI auto-fixer, others) working in this
repo. Humans welcome too. CLAUDE.md imports this file, so this is the single source
of truth — edit it here, not in two places.

## What this project is

**Finish It** is a focused-reading web app: paste a link or text, read it in
distraction-free chunks, answer a quick recall question, and grow a "finished today"
streak. See `FEATURES.md` for the full feature list.

It is also a **learning vehicle for harness/agent engineering** — the repo runs an
autonomous QA→fix loop (see "The automation loop" below and `plan/`).

## The shape of the code (read this first)

- **The entire app is one file: `index.html`** (~880 lines: inline `<style>`, markup,
  and a `<script>` of plain vanilla JS). No framework, no build step, no bundler.
- **No package.json, no dependencies, no node toolchain.** Don't add one without a
  clear reason — "it's a single static file" is a deliberate constraint.
- State lives in `localStorage` under the key **`finishit`** (see the `DB` object).
- Four screens are `<section class="screen">` blocks toggled by `go(name)`:
  `home`, `reader`, `finish`, `calendar`.
- Article fetching for links goes through `https://r.jina.ai/<url>` (client-side,
  no key) and is cleaned by `cleanMarkdown()`. Pasted text skips the fetch.

## How to run it

It's static — just open `index.html` in a browser, or serve the folder
(`python -m http.server`). Live site: https://finish-it.simyilin.workers.dev
(Cloudflare, auto-redeploys on merge to `main`).

## Commit message format

Use **conventional commits**: `type: short description` (≤72 chars on the first line).

| Type | Use for |
|------|---------|
| `feat` | new feature or skill |
| `fix` | bug fix in `index.html` |
| `ci` | workflow / Actions changes |
| `chore` | config, gitignore, tooling |
| `docs` | research briefs, README, AGENTS.md |

Optional body: explain **why**, not what (the diff shows what). Skip it for small changes.

Examples:
```
feat: add global error boundary with localStorage ring buffer
ci: add quality gate (html-validate + Playwright smoke test)
docs: add observability research brief
```

## How to make a change

1. Edit `index.html` directly. Keep changes **small and surgical** — match the
   surrounding vanilla-JS style (no new libraries, no reformatting unrelated code).
2. **Never touch `plan/`** — those are private planning notes (git-ignored anyway).
3. Verify against `TEST-EVIDENCE.md`: walk the core loop (paste → read → answer →
   finish → streak) plus any edge case your change touches. Update that file's
   "Last verified" line if you re-ran it.
4. Open a PR using the template; end the body with `Closes #N` so merging closes the
   issue. A human reviews and merges — **never auto-merge to the live site.**

## Test convention (the deterministic gate)

The quality gate runs every `*.spec.js` in `tests/` (Playwright) plus html-validate —
free and deterministic, and it runs *before* any paid LLM review. Keep that gate the
primary correctness signal, not the reviewer:

- **One acceptance check → one assertion.** Every `agent-found` issue states an acceptance
  check; express it as a Playwright assertion in `tests/`, not just prose. A check you
  can't assert is a check you can't gate — tighten the issue until you can.
- **Tests live in `tests/`; no workflow change needed.** `npx playwright test` auto-discovers
  spec files. Add core-loop flows to `tests/smoke.spec.js`; group a larger area as
  `tests/<area>.spec.js`.
- **Cover the edge, not just the happy path.** The historically fragile surfaces are
  extraction (`cleanMarkdown`), async fetch (`r.jina.ai`), and `finishit` localStorage
  recovery. Prefer a deterministic test there over trusting the adversarial reviewer to
  catch it — route-mock the network (`page.route('**r.jina.ai/**', …)`) and seed storage
  before boot (`page.addInitScript`).
- **No live network in tests.** Sample articles and pasted text already run the offline
  path; mock `r.jina.ai` rather than hitting it, so the gate stays deterministic.

## The automation loop (how this repo maintains itself)

A **capability** is a named functional area of the app — `observability`, `accessibility`,
`offline`, etc. Running `/ship <cap>` pushes a capability through a four-stage pipeline.
**Stages 1–2 run locally in your Claude Code terminal. Stages 3–4 run in GitHub Actions CI.**

```
[local]  Stage 1 — /research <cap>    →  docs/research/<cap>.md
                                          (best practices, APIs, what to avoid)

[local]  Stage 2 — /scope-gaps <cap>  →  GitHub issue (+ an executable
                                          acceptance test in the body)
                                          labels: agent-found + capability:<cap>
                                                       │
                                           label added fires CI ▼

[CI]     Stage 3 — auto-fixer.yml     →  branch + writes the acceptance test
                                          verbatim + edits index.html + opens PR

[CI]     Stage 4 — quality-gate.yml   →  html-validate + Playwright smoke → Discord on pass
                   fix-loop.yml       →  re-patches index.html if gate fails (≤ 3 tries)
                   review.yml         →  adversarial critique (advisory PR comment)
                                                       │
                                           human reviews + merges ▼

                                          Cloudflare auto-redeploys
```

**`/ship <cap>`** is a shortcut that runs stages 1 and 2 in one command.
Each local command is a skill file in `.claude/commands/`.

**Alternative entry point:** `/qa-tester [persona]` drives the live app via Playwright MCP
and files `agent-found` issues directly, bypassing stages 1–2.

### CI workflows

| Workflow | Trigger | Job |
|----------|---------|-----|
| `auto-fixer.yml` | issue labeled `agent-found` | Write the issue's acceptance test verbatim + fix `index.html` + open PR (max 25 turns) |
| `quality-gate.yml` | PR touches `index.html` or `tests/**` | html-validate + Playwright smoke + the issue's acceptance test; pings Discord on pass |
| `fix-loop.yml` | `quality-gate.yml` completes with failure | Re-patch `index.html`; caps at 3 tries, then hands off to human |
| `review.yml` | PR touches `index.html` | Adversarial critique against research brief; **advisory only** |

### Design decisions worth knowing

- **Adversarial review is advisory, not a gate.** It posts a PR comment for the human
  reviewer to act on. Making it a hard gate risks false-positive blocks and circular
  auto-fix loops (the same model reviewing its own fix).
- **`capability:X` labels are auto-created** by `/scope-gaps` and `/ship` with
  `gh label create --force` before filing the issue.
- **Acceptance checks are executable (C2).** `/scope-gaps` emits each acceptance check as a
  Playwright assertion in the issue body; the auto-fixer writes it verbatim onto its branch
  (it does *not* go on `main`, so it can't poison other PRs' gates) and must make `index.html`
  satisfy it. The deterministic gate then enforces the spec and `fix-loop.yml` converges any
  miss — turning the reviewer's old "comment" into an objective red/green with no
  same-model-reviews-its-own-fix loop.

## Gotchas worth knowing

- **Comprehension questions are auto-generated** (`makeQuestion` / fill-in-the-blank
  from salient words). They can be awkward — that's known, not a bug per se.
- **Extraction is regex-based** (`cleanMarkdown`, `BOILER`). Most past bugs live here
  (citation markup, link artifacts). Test extraction changes on a real article URL.
- The auto-fixer goes **green-but-does-nothing** if its Bash tools aren't allowlisted
  (look for `permission_denials_count > 0`). Don't strip those tools.
