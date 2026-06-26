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
**Stages 1–2 run locally in your agent terminal (Claude Code or Copilot CLI). Stages 3–4 run in GitHub Actions CI.**

```
[local]  Stage 1 — /research <cap>    →  docs/research/<cap>.md
                                          (best practices, APIs, what to avoid)

[local]  Stage 2 — /scope-gaps <cap>  →  GitHub issue (+ an executable
                                          acceptance test in the body)
                                          labels: agent-found + capability:<cap>
                                                       │
                                           label added fires CI ▼

[CI]     Stage 3 — auto-fixer.yml     →  assigns the issue to the GitHub Copilot cloud
                                          agent, which writes the acceptance test verbatim
                                          + fixes index.html + opens a PR

[CI]     Stage 4 — quality-gate.yml   →  html-validate + Playwright smoke → Discord on pass
                   fix-loop.yml       →  pings @copilot to re-patch if gate fails (≤ 3 tries)
                   review.yml         →  Copilot code review (advisory PR comments)
                                                       │
                                           human reviews + merges ▼

                                          Cloudflare auto-redeploys
```

**`/ship <cap>`** is a shortcut that runs stages 1 and 2 in one command.

Each skill is one harness-agnostic body in **`skills/<name>.md`** (the single source of truth),
wired into each harness by a thin stub: Claude Code `.claude/commands/<name>.md`, Copilot CLI
`.agents/skills/<name>/SKILL.md`. Edit behaviour in `skills/`, not the stubs.

**Alternative entry point:** `/qa-tester [persona]` drives the live app via Playwright MCP
and files `agent-found` issues directly, bypassing stages 1–2.

### The machine-readable map

**`pipeline.json`** is the source of truth for *how the stages wire together* — each stage's
`type`, `trigger`, the file that implements it, inputs/outputs, the agent + auth it uses, caps, and how
to invoke it standalone (for re-runs or intermediate interjection). It holds pointers + metadata
only; the logic stays in the referenced `skills/*.md` and `.github/workflows/*.yml`. Run
`node scripts/validate-pipeline.js` to confirm nothing has drifted (every referenced path exists).

The CI workflows it maps: `auto-fixer.yml` (agent-found issue → **assigns the GitHub Copilot cloud
agent**, which writes the issue's acceptance test verbatim + fixes `index.html` → PR),
`quality-gate.yml` (html-validate + Playwright smoke + the issue's acceptance test, on PRs touching
`index.html` or `tests/**`, pings Discord on pass), `fix-loop.yml` (pings `@copilot` to re-patch on
gate failure, ≤3 tries), `review.yml` (advisory Copilot code review). `copilot-setup-steps.yml`
preinstalls the gate toolchain in Copilot's environment so it can self-verify a fix before pushing.

### Pipeline auth (Copilot)

The three agent stages drive the **GitHub Copilot cloud agent**, which needs a *user* token: the
default Actions `GITHUB_TOKEN` is a server-to-server token and can't assign Copilot or wake it with
an `@copilot` mention. Create a **fine-grained PAT** owned by the account holding the Copilot seat,
with **Read** access to *metadata* and **Read & write** to *actions, contents, issues, pull
requests* (classic equivalent: the `repo` scope), and add it as the repo secret
**`COPILOT_AGENT_PAT`**. Copilot coding agent must also be enabled for the repo and that account.
Repo-wide agent guidance lives in `.github/copilot-instructions.md`.

### Design decisions worth knowing

- **Review is advisory, not a gate.** `review.yml` requests **Copilot code review**, which posts
  advisory PR comments. Making it a hard gate risks false-positive blocks and circular auto-fix
  loops — and since Copilot is now also the *fixer*, the reviewer is the same model family, so it
  is deliberately kept advisory. The deterministic gate is the real correctness signal. (A
  brief-aware adversarial reviewer — a Copilot agent task reading `docs/research/<cap>.md` — is a
  possible follow-up chunk.)
- **`capability:X` labels are auto-created** by `/scope-gaps` and `/ship` with
  `gh label create --force` before filing the issue.
- **Acceptance checks are executable (C2).** `/scope-gaps` emits each acceptance check as a
  Playwright assertion in the issue body; the fixer (now the **GitHub Copilot cloud agent**) writes
  it verbatim onto its branch (it does *not* go on `main`, so it can't poison other PRs' gates) and
  must make `index.html` satisfy it. The deterministic gate then enforces the spec and `fix-loop.yml`
  converges any miss. Because the test + fix instructions live in the *issue body*, the contract is
  agent-agnostic — swapping the engine from Claude to Copilot needed **no** change to `scope-gaps`.

## Gotchas worth knowing

- **Comprehension questions are auto-generated** (`makeQuestion` / fill-in-the-blank
  from salient words). They can be awkward — that's known, not a bug per se.
- **Extraction is regex-based** (`cleanMarkdown`, `BOILER`). Most past bugs live here
  (citation markup, link artifacts). Test extraction changes on a real article URL.
- The auto-fixer goes **green-but-does-nothing** if `COPILOT_AGENT_PAT` is missing/expired or
  Copilot coding agent isn't enabled for the repo + PAT owner — the assignment API rejects the
  default `GITHUB_TOKEN`. The workflow now hard-errors in these cases instead of passing silently.
  (The prior Claude failure mode was an expired `CLAUDE_CODE_OAUTH_TOKEN` returning `is_error` on
  turn 1 at $0 cost — same symptom, different cause.)
