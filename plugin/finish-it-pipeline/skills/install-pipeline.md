# Skill body — install-pipeline

Harness-agnostic body for the `install-pipeline` skill — the part of the plugin that
bootstraps the **CI half** of the capability pipeline into a target repository. The local
skills (`research`, `scope-gaps`, `scope-gaps-local`, `ship`, `shiplocal`, `qa-tester`)
**are** this plugin; this skill installs the GitHub-side stages they hand off to
(`auto-fix → quality-gate → fix-loop → review`) plus the routing labels, templates, and
drift guard. Per-harness entry points only carry frontmatter and point here.

---

You are the installer for the **Finish It capability pipeline** plugin. Your job: copy
this plugin's payload into a target repo, create the routing labels, and print the human
checklist — then stop. You scaffold; a human sets secrets and merges. Never auto-merge.

**Target repo:** `${ARGUMENTS}` (default: the current working directory)

Resolve **PLUGIN** = the directory that contains this skill's `skills/` folder (the plugin
root). Resolve **TARGET** = the target repo path. Everything below copies `PLUGIN/… → TARGET/…`.

## Phase 1 — Preflight
1. Confirm TARGET is a git repo: `git -C "$TARGET" rev-parse --show-toplevel`. Abort if not.
2. `gh auth status` — confirm a token with repo write; record the repo
   (`gh repo view --json nameWithOwner`).
3. **Never clobber silently.** If any destination file already exists, list the collisions
   and ask before overwriting (the local skills may already be present in TARGET).

## Phase 2 — Install the local skills (the plugin's own skills)
Copy the harness-agnostic bodies and the per-harness wiring:
- `PLUGIN/skills/*.md`      → `TARGET/skills/`
- `PLUGIN/agents/skills/*`  → `TARGET/.agents/skills/`   (Copilot CLI entry points)
- For Claude Code, also generate `TARGET/.claude/commands/<name>.md` for each skill — a thin
  stub (frontmatter + one line pointing at `../../skills/<name>.md`). Skip if the user only
  wants Copilot CLI.

## Phase 3 — Install the CI half (the part that can't be a plugin)
GitHub Actions only runs workflows under the repo-root `.github/workflows/`, which is why
these must be **installed**, not loaded from a plugin:
- `PLUGIN/templates/.github/workflows/*.yml`          → `TARGET/.github/workflows/`
- `PLUGIN/templates/.github/copilot-instructions.md`  → `TARGET/.github/`
- `PLUGIN/templates/.github/PULL_REQUEST_TEMPLATE.md` → `TARGET/.github/`
- `PLUGIN/templates/.github/ISSUE_TEMPLATE/bug.yml`   → `TARGET/.github/ISSUE_TEMPLATE/`
- `PLUGIN/templates/pipeline.json`                    → `TARGET/pipeline.json`
- `PLUGIN/scripts/validate-pipeline.js`               → `TARGET/scripts/`

If TARGET's app entry is not `index.html` or its tests are not under `tests/`, update the
`paths:` filters in `quality-gate.yml` + `review.yml` and the `index.html` references in
`auto-fixer.yml` / `copilot-setup-steps.yml` to match (see `plugin.json` → `params`).

## Phase 4 — Routing labels (idempotent)
```bash
gh label create agent-found       --color 1d76db --description "Routes to auto-fixer.yml" --force
gh label create agent-found-local --color 0e8a16 --description "Routes to the local shiplocal back-half" --force
gh label create enhancement       --color a2eeef --force
```
`capability:<cap>` labels are auto-created later by `scope-gaps` / `ship`.

## Phase 5 — Verify
- `node TARGET/scripts/validate-pipeline.js` — every `pipeline.json` ref must exist.
- If it reports a missing ref, either create a stub for it or trim that entry from the
  installed `pipeline.json` so the drift guard passes. Common cases in a fresh target:
  Claude `harnessEntries` you skipped (Copilot-only install), and
  `observability.metricsReport` (`docs/metrics/pipeline-report.md`) — drop an empty stub or
  remove the field.

## Phase 6 — Human checklist (print; do NOT perform)
The plugin cannot carry secrets or toggle org settings. Tell the user to:
1. Add repo secret **`COPILOT_AGENT_PAT`** — a fine-grained user PAT (metadata: read; actions,
   contents, issues, pull requests: read & write) owned by the Copilot-seat holder. The default
   `GITHUB_TOKEN` cannot assign Copilot or wake it with an `@copilot` mention.
2. (Optional) Add **`DISCORD_WEBHOOK_URL`** for gate/research pings, or delete the `notify` job
   from `quality-gate.yml`.
3. Enable **Copilot coding agent** for the repo + the PAT owner.

## Done when
- Local skills present under `TARGET/skills` + `TARGET/.agents/skills` (+ `.claude/commands` if requested).
- CI workflows + `pipeline.json` + `validate-pipeline.js` installed; drift guard green.
- Labels created; human checklist printed.
- Report: files written, labels created, and the exact secrets the human must set. Then stop.
