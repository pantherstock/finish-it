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

## The automation loop (how this repo maintains itself)

Two entry points feed the same downstream pipeline:

```
                    ┌─ /research <cap>  ──┐
                    │   writes brief       ├─ /scope-gaps <cap> ─┐
                    │                     │   files one issue     │
/ship <cap> ────────┘ (does both in one) ─┘                      │
                                                                  ▼
/qa-tester [persona] ────────────────────────────────► GitHub issue
 drives live app via Playwright MCP                    label: agent-found
 files deduped bug reports                             label: capability:X (if from /ship)
                                                                  │
                                          on label added ◄────────┘
                                                  │
                                                  ▼
                                         auto-fixer.yml (CI)
                                          claude-code-action
                                          fix + open PR
                                                  │
                               ┌──────────────────┼──────────────────┐
                               ▼                  ▼                  ▼
                        quality-gate.yml    review.yml         (fix-loop: WIP)
                        html-validate       adversarial         re-push if gate
                        Playwright smoke    reviewer            fails (≤3 tries)
                        → Discord on pass   → PR comment
                                            advisory only
                               └──────────────────┬──────────────────┘
                                                  │
                                        human reviews + merges
                                                  │
                                                  ▼
                                        Cloudflare Workers deploy
                                     (auto on merge to main)
```

### Skills / commands

| Command | What it does |
|---------|-------------|
| `/ship <cap>` | Research capability + scope one PR-sized issue + queue to CI (one-shot) |
| `/research <cap>` | Write `docs/research/<cap>.md` brief + ping Discord |
| `/scope-gaps <cap>` | Read brief + index.html, file one deduped issue |
| `/qa-tester [persona]` | Drive live app as a persona, file deduped `agent-found` issues |

### CI workflows

| Workflow | Trigger | Job |
|----------|---------|-----|
| `auto-fixer.yml` | issue labeled `agent-found` | Fix + open PR (max 40 turns, loops on gate failure) |
| `quality-gate.yml` | PR touches `index.html` | html-validate + Playwright smoke; pings Discord on pass |
| `review.yml` | PR touches `index.html` | Adversarial critique against research brief; **advisory only** |

### Design decisions worth knowing

- **Adversarial review is advisory, not a gate.** It posts a PR comment for the human
  reviewer to act on. Making it a hard gate risks false-positive blocks and circular
  auto-fix loops (the same model reviewing its own fix).
- **The fix-loop inside `auto-fixer.yml` is a polling hack** (`gh pr checks --watch`
  blocks the runner). The plan is to split it into a separate event-driven `fix-loop.yml`
  triggered by `workflow_run` — that work is in progress (chunk 4).
- **`capability:X` labels are auto-created** by `/scope-gaps` and `/ship` with
  `gh label create --force` before filing the issue.

## Gotchas worth knowing

- **Comprehension questions are auto-generated** (`makeQuestion` / fill-in-the-blank
  from salient words). They can be awkward — that's known, not a bug per se.
- **Extraction is regex-based** (`cleanMarkdown`, `BOILER`). Most past bugs live here
  (citation markup, link artifacts). Test extraction changes on a real article URL.
- The auto-fixer goes **green-but-does-nothing** if its Bash tools aren't allowlisted
  (look for `permission_denials_count > 0`). Don't strip those tools.
