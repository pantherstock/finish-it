---
description: Run the full capability loop locally (research/scope + local auto-fix/gate/review + PR)
argument-hint: <capability name>
allowed-tools: WebSearch, WebFetch, Write, Read, Glob, Grep, Bash(curl:*), Bash(gh issue list:*), Bash(gh issue view:*), Bash(gh issue create:*), Bash(gh label create:*), Bash(git:*), Bash(npx:*), Bash(npm:*), Bash(node:*), Bash(gh pr create:*), Bash(gh pr comment:*)
---

Run the **shiplocal** local fallback (research → scope → local auto-fix → local
gate/fix-loop → local adversarial review → PR). Follow every step in
[`skills/shiplocal.md`](../../skills/shiplocal.md), treating `${ARGUMENTS}` as the
capability. That shared body is the single source of truth; this file only wires it
into Claude Code.
