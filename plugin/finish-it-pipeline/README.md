# finish-it-pipeline — the capability pipeline, packaged as a plugin

A **proof-of-concept** that repackages the Finish It capability pipeline (mapped by the
repo's [`pipeline.json`](../../pipeline.json)) as a self-contained, portable **Copilot CLI
plugin**. It bundles the local agent skills and adds one new skill, `install-pipeline`,
that scaffolds the GitHub-Actions half into any target repo.

This folder is **additive and non-destructive**: nothing here changes the live app or the
repo's own pipeline. GitHub Actions only runs workflows under the repo-root
`.github/workflows/`, so the YAML under `templates/` is inert, and `plugin/` is excluded
from the Cloudflare asset bundle via `.assetsignore`.

## What can and can't be a plugin

The pipeline has two kinds of parts, and only one half can *be* a plugin:

| Part | Runs in | Plugin-able? |
|------|---------|--------------|
| Stages 1–2 + `ship` / `shiplocal` / `qa-tester` (`skills/*.md`) | the agent CLI | ✅ this is exactly what plugins package |
| Stages 3–6 (`auto-fixer` / `quality-gate` / `fix-loop` / `review.yml`) | GitHub Actions, fired by labels/PRs | ❌ can't run as plugin code — GitHub stays the runtime |

So this isn't "a plugin that *runs* the loop" — it's **a plugin that *installs* the loop**.
The local skills travel inside the plugin; the CI stages ride along as `templates/` that
the `install-pipeline` skill copies into a target repo's `.github/`.

## Layout

```
finish-it-pipeline/
├── plugin.json                       # self-describing package manifest (analogous to pipeline.json)
├── README.md                         # this file
├── skills/                           # harness-agnostic skill BODIES (vendored — the portable copy)
│   ├── research.md  scope-gaps.md  scope-gaps-local.md
│   ├── ship.md  shiplocal.md  qa-tester.md
│   └── install-pipeline.md           # NEW — scaffolds the CI half into a target repo
├── agents/skills/<name>/SKILL.md     # Copilot CLI entry points (proven format; link ../../../skills/<name>.md)
├── templates/                        # the CI payload the installer writes into a target repo
│   ├── .github/workflows/*.yml       # auto-fixer, quality-gate, fix-loop, review, copilot-setup-steps
│   ├── .github/copilot-instructions.md  PULL_REQUEST_TEMPLATE.md  ISSUE_TEMPLATE/bug.yml
│   └── pipeline.json
└── scripts/validate-pipeline.js      # drift guard, carried for the target
```

The Copilot CLI stubs use the same `../../../skills/<name>.md` relative link as the repo's
own `.agents/skills/` — at the same depth — so they resolve to the plugin's vendored bodies
unchanged, and keep resolving once installed into a target's `.agents/skills/`.

## Install & use (Copilot CLI)

The novel piece is `install-pipeline`. From a Copilot CLI session **in the target repo**:

```
/install-pipeline            # defaults to the current repo
# or, following the body directly:
#   "Follow plugin/finish-it-pipeline/skills/install-pipeline.md, target = <repo path>"
```

It will:
1. Copy `skills/*` → `TARGET/skills/` and `agents/skills/*` → `TARGET/.agents/skills/`.
2. Copy `templates/.github/*`, `pipeline.json`, and `scripts/validate-pipeline.js` into the target.
3. Create the routing labels (`agent-found`, `agent-found-local`, `enhancement`).
4. Run `validate-pipeline.js` and print the **human checklist** (secrets + enable Copilot coding agent).

After that, the normal entry points work in the target repo: `/ship <cap>`, `/research <cap>`,
`/scope-gaps <cap>`, `/shiplocal <cap>`, `/qa-tester [persona]`.

## Honest caveats (it's a PoC)

- **The manifest is descriptive, not executed by the CLI.** Copilot CLI discovers the skills
  from the bundled `agents/skills/*/SKILL.md`; `plugin.json` is the package descriptor + the
  installer's contract (the same role `pipeline.json` plays for the repo). The exact
  marketplace/manifest schema for distribution is intentionally out of scope here.
- **Secrets are human-set.** A plugin can't carry `COPILOT_AGENT_PAT` or `DISCORD_WEBHOOK_URL`,
  and can't enable Copilot coding agent. The installer prints the checklist; a human does it.
- **The CI side is tuned for this app.** The workflows assume a single `index.html` with tests
  under `tests/`. For a different target, the installer rewrites the `paths:`/`index.html`
  references per `plugin.json → params`. A cleaner production form is to publish those
  workflows as a **reusable workflow / composite action** and have the installed workflows
  just `uses:` it — that's the real CI-side analog of a plugin.
- **Vendored bodies are a snapshot.** The repo's `skills/*.md` remain the single source of
  truth; productionizing this plugin means a sync step (or generating the plugin at release).
- **Claude Code wiring is a follow-up.** For Claude, the installer also generates
  `.claude/commands/<name>.md` stubs (or the plugin adds root `commands/*.md` + a
  `.claude-plugin/plugin.json`). This PoC focuses on Copilot CLI.

## Why bother (and when not to)

For *this* single self-maintaining repo, packaging is mostly overhead — the existing
"skill body + thin per-harness stub" layout already gives the harness-agnostic benefit.
The plugin pays off when you want to **reuse or share** the whole loop across repos: one
versioned, installable unit instead of hand-copying `skills/`, `.agents/skills/`, and five
workflows each time.
