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

```
/qa-tester [persona]  →  GitHub issue (label: agent-found)  →  Auto-fixer (CI)  →  PR  →  human merge  →  Cloudflare deploy
 (Playwright MCP)         dedup before filing                  claude-code-action    review gate
```

- `/qa-tester` (`.claude/commands/qa-tester.md`) drives the live app as a persona and
  files **deduped** issues. Always dedup before filing — idempotency matters.
- The auto-fixer (`.github/workflows/auto-fixer.yml`) fires when the `agent-found`
  label is *added*, and opens a PR. It runs in "agent mode" and must branch/commit/PR
  itself — that's why its `--allowedTools` includes `Bash(git:*),Bash(gh:*)`.

## Gotchas worth knowing

- **Comprehension questions are auto-generated** (`makeQuestion` / fill-in-the-blank
  from salient words). They can be awkward — that's known, not a bug per se.
- **Extraction is regex-based** (`cleanMarkdown`, `BOILER`). Most past bugs live here
  (citation markup, link artifacts). Test extraction changes on a real article URL.
- The auto-fixer goes **green-but-does-nothing** if its Bash tools aren't allowlisted
  (look for `permission_denials_count > 0`). Don't strip those tools.
