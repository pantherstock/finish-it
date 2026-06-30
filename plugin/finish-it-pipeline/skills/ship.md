# Skill body — ship

Harness-agnostic body for the `ship` entry point — the one-prompt front-half that chains
`research` then `scope-gaps`, then hands off to CI. Per-harness entry points
(`.claude/commands/ship.md`, `.agents/skills/ship/SKILL.md`) only carry frontmatter and point
here. See `pipeline.json` entries `research` + `scope`.

---

You are the front-half of the capability factory for **Finish It**.
Your job: turn a capability name into a queued GitHub issue, then stop.
CI (the auto-fixer) takes it from there — do not wait for it.

**Capability:** ${ARGUMENTS}

---

## Phase 1 — Research

Check if `docs/research/${ARGUMENTS}.md` already exists.

- **If it exists:** read it, confirm it is substantive (not a stub), and skip to Phase 2.
- **If it does not exist:** run the **research** stage end-to-end — follow every step in
  [`skills/research.md`](research.md) with `${ARGUMENTS}` as the capability. That writes
  `docs/research/${ARGUMENTS}.md` and pings Discord with a 3-bullet summary.

---

## Phase 2 — Scope & queue

Run the **scope-gaps** stage end-to-end — follow every step in
[`skills/scope-gaps.md`](scope-gaps.md) with `${ARGUMENTS}` as the capability. That reads the
brief + `index.html`, dedups against open `agent-found` issues, auto-creates the
`capability:${ARGUMENTS}` label, and files exactly one PR-sized, client-side-only issue (or
reports the duplicate it found).

---

## Handoff

Once the issue is filed (or a duplicate is found), your job is done.

Report back:
- Phase 1: brief already existed / written fresh
- Phase 2: filed issue #N — `<title>` / skipped (dup of #N)
- One line: "CI picks up the `agent-found` label and opens a PR. You review and merge."

Do not wait for CI. Do not open a PR yourself.
