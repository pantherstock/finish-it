# Copilot instructions — Finish It

These instructions apply to the **GitHub Copilot cloud agent** when it is assigned an
issue in this repo, and to Copilot code review. The full guide is in
[AGENTS.md](../AGENTS.md) — read it. This file is the short, must-follow contract.

## What this project is

**Finish It** is a focused-reading web app. The **entire app is one file: `index.html`**
(~880 lines: inline `<style>`, markup, and a `<script>` of plain vanilla JS). **No
framework, no build step, no bundler, no `package.json` in the repo by design.** Do not
add one. State lives in `localStorage` under the key `finishit`.

## When you're assigned an `agent-found` issue

The issue body is the spec. It contains exact line numbers, implementation notes, and —
critically — an **`## Acceptance test (Playwright)`** section with a target filename and a
fenced code block. Follow this contract exactly:

1. **Write the acceptance test verbatim.** Create the file at the path given in the issue
   (under `tests/`) with the test body **exactly as written**. Do **not** edit, weaken,
   rename, or "improve" it. It is the objective gate for this fix; your job is to make
   `index.html` satisfy it.
2. **Implement the smallest fix in `index.html`** that makes that test pass and meets the
   issue's acceptance check. Keep it surgical — don't touch unrelated code, don't add
   features that weren't requested, don't reformat.
3. **Never touch `plan/`.** Don't add libraries, a build step, or a `package.json` to the
   repo.
4. **Self-verify before you push** (the toolchain is preinstalled via
   `copilot-setup-steps.yml`):
   ```bash
   python3 -m http.server 8080 &
   until curl -sf http://localhost:8080 > /dev/null; do sleep 1; done
   npx playwright test          # your new test + the core-loop smoke must pass
   npx --yes html-validate index.html
   ```
   Iterate until both are green. A red gate after you push just costs a fix-loop round.
5. **Don't commit tooling.** `node_modules/`, `package.json`, `package-lock.json`,
   `test-results/`, and `playwright-report/` are git-ignored — keep them out of the PR.
   The PR should contain only `index.html` and the new `tests/*.spec.js`.

## Commits & PR

- **Conventional commits**: `fix: short description` (≤72 chars on the first line). Other
  types: `feat`, `ci`, `chore`, `docs`.
- Open one PR. List each acceptance-check item in the body and end with
  `Closes #<issue-number>` so merging closes the issue.

## Where bugs usually live

Extraction is regex-based (`cleanMarkdown`, `BOILER`) and is the historically fragile
surface, along with async fetch (`r.jina.ai`) and `finishit` localStorage recovery. If
your change touches those, test the edge case, not just the happy path. Mock the network
in tests (`page.route('**r.jina.ai/**', …)`); never hit live network in a test.
