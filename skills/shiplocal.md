# Skill body — shiplocal

Harness-agnostic body for the `shiplocal` entry point. Per-harness entry points
(`.claude/commands/shiplocal.md`, `.agents/skills/shiplocal/SKILL.md`) only carry
frontmatter and point here. See `pipeline.json` local fallback entrypoint `shiplocal`.

---

You are the local fallback for the capability factory in **Finish It**.
Your job: run the whole loop locally when cloud-agent CI is unavailable.

**Capability:** ${ARGUMENTS}

---

## Phase 1 — Research

Check if `docs/research/${ARGUMENTS}.md` exists.

- **If it exists:** read it, confirm it is substantive, continue.
- **If missing:** run `skills/research.md` end-to-end with `${ARGUMENTS}`.

---

## Phase 2 — Scope & queue (local route)

Run `skills/scope-gaps-local.md` end-to-end with `${ARGUMENTS}`.

Outcome:
- either a newly filed `agent-found-local` issue, or
- a duplicate open issue to use as the execution spec.

Use that issue number for all remaining phases.

---

## Phase 3 — Local auto-fix (issue → code)

Treat the issue body as the contract:
- copy the `## Acceptance test (Playwright)` block **verbatim** to
  `tests/${ARGUMENTS}.spec.js` (or the exact file path named in the issue),
- implement the smallest `index.html` change set that satisfies the acceptance check.

Keep scope surgical:
- edit only `index.html` + the acceptance test file,
- no dependencies, no build step, no infra changes.

---

## Phase 4 — Local quality gate loop (max 3 tries)

Run this gate locally:

```bash
npx --yes html-validate index.html
npx playwright test
```

Important: Playwright in this repo expects `http://localhost:8080` (`playwright.config.js`).
Start a local static server before running tests, wait for it to respond, then stop it after:

```bash
python3 -m http.server 8080 &
until curl -sf http://localhost:8080 > /dev/null; do sleep 1; done
npx --yes html-validate index.html
npx playwright test
kill %1
```

If gate fails:
1. read the exact failure,
2. patch `index.html` (or acceptance test only if the issue test was copied incorrectly),
3. re-run the gate.

Stop after 3 failed attempts and report blocked with the failing assertion/rule.

---

## Phase 5 — Local adversarial review

Before opening a PR, run an adversarial pass against:
- issue acceptance checks,
- `docs/research/${ARGUMENTS}.md` best practices and "what to avoid".

Look for:
- unmet acceptance items,
- hidden runtime failure paths,
- regressions to `finishit` localStorage handling,
- unrelated scope creep.

Patch once more if needed, then re-run the local gate.

---

## Phase 6 — Queue to GitHub

Open a PR from your fix branch with:
- a concise conventional-commit history,
- PR body ending with `Closes #<issue_number>`.

Do not merge. Hand off to human review.

---

## Report back

Return:
- issue used (`new #N` or `dup #N`),
- local gate status (`green` or `blocked after 3 attempts`),
- PR number/title (if opened),
- one-line handoff: human review + merge to ship.
