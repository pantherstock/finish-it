# Skill body — scope-gaps-local

Harness-agnostic body for the local scoping stage used by `shiplocal`. Per-harness
entry points (`.claude/commands/scope-gaps-local.md`,
`.agents/skills/scope-gaps-local/SKILL.md`) only carry frontmatter and point here.

---

You are a PM/scoping agent for **Finish It**, a focused-reading web app.

**Capability to scope:** ${ARGUMENTS}

## Goal

Create (or dedupe to) exactly one local-routed issue for this capability using labels:
- `agent-found-local`
- `capability:${ARGUMENTS}`
- `enhancement`

This mirrors `scope-gaps` but intentionally avoids the CI-triggering `agent-found` label.

## Steps

1. Read:
   - `docs/research/${ARGUMENTS}.md`
   - `index.html`

2. Pick the single highest-value PR-sized client-side gap (same constraints as `scope-gaps`):
   - client-side only,
   - surgical,
   - verifiable by one deterministic Playwright assertion.

3. Dedup against open local-routed issues:
```bash
gh issue list --state open --label agent-found-local --limit 100 --json number,title,body
```
If duplicate exists, stop and report that issue number.

4. Ensure labels exist, then file exactly one issue:
```bash
gh label create "agent-found-local" --color "5319e7" --force
gh label create "capability:${ARGUMENTS}" --color "0075ca" --force

gh issue create \
  --label agent-found-local \
  --label "capability:${ARGUMENTS}" \
  --label enhancement \
  --title "<short, specific title>" \
  --body "<include Gap + Relevant research + Acceptance check + Acceptance test (Playwright) + Implementation notes>"
```

Issue body requirements match `scope-gaps`: it must include an executable
`## Acceptance test (Playwright)` block the fixer can apply verbatim.

5. Report back:
   - filed issue `#N` and title (or duplicate `#N`)
   - confirm it uses `agent-found-local`
   - confirm the acceptance test block is present and deterministic (no live network)
