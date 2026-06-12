---
description: One-prompt entry point — research a capability, scope the gap, queue the issue, hand off to CI
argument-hint: <capability name>
allowed-tools: WebSearch, WebFetch, Write, Read, Glob, Grep, Bash(curl:*), Bash(gh issue list:*), Bash(gh issue create:*)
---

You are the front-half of the capability factory for **Finish It**.
Your job: turn a capability name into a queued GitHub issue, then stop.
CI (the auto-fixer) takes it from there — do not wait for it.

**Capability:** ${ARGUMENTS}

---

## Phase 1 — Research

Check if `docs/research/${ARGUMENTS}.md` already exists.

- **If it exists:** read it, confirm it is substantive (not a stub), and skip to Phase 2.
- **If it does not exist:** execute the research workflow:
  1. Run 2–3 `WebSearch` calls with different angles on implementing `${ARGUMENTS}` in a client-side web app.
  2. Fetch the 2–3 most relevant sources with `WebFetch`.
  3. Write a concise brief to `docs/research/${ARGUMENTS}.md` following this structure:
     - **What it is** — one paragraph in the context of a reading app
     - **Best practices (top 3–5)** — concrete, implementable
     - **Relevant patterns / APIs** — browser APIs that fit the single-file constraint
     - **What to avoid** — anti-patterns for this capability
     - **Sources** — markdown links
  4. Ping Discord with a 3-bullet summary:
     ```bash
     curl -s -X POST "$DISCORD_WEBHOOK_URL" \
       -H "Content-Type: application/json" \
       -d "{\"content\": \"Research done: **${ARGUMENTS}**\n- <bullet 1>\n- <bullet 2>\n- <bullet 3>\n\`docs/research/${ARGUMENTS}.md\` written.\"}"
     ```

---

## Phase 2 — Scope & queue

Execute the gap-scoping workflow:

1. Read `docs/research/${ARGUMENTS}.md` and `index.html` in full.
2. For each best practice in the brief, identify whether Finish It already implements it.
3. Dedup against open issues:
   ```bash
   gh issue list --state open --label agent-found --limit 100 --json number,title,body
   ```
   If an open issue already covers the same gap, skip filing — report which issue covers it.
4. If no duplicate exists, file exactly one PR-sized, client-side-only issue:
   ```bash
   gh issue create \
     --label agent-found \
     --label "capability:${ARGUMENTS}" \
     --label enhancement \
     --title "<short, specific title>" \
     --body "<body>"
   ```
   Issue body must include: **Gap**, **Relevant research** (quoting the brief), **Acceptance check** (observable, in DevTools or the UI), **Implementation notes** (specific functions/lines in `index.html`, gotchas).

---

## Handoff

Once the issue is filed (or a duplicate is found), your job is done.

Report back:
- Phase 1: brief already existed / written fresh
- Phase 2: filed issue #N — `<title>` / skipped (dup of #N)
- One line: "CI picks up the `agent-found` label and opens a PR. You review and merge."

Do not wait for CI. Do not open a PR yourself.
