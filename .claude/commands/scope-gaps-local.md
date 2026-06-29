---
description: Read the research brief + index.html, identify one PR-sized gap, dedup, and file exactly one local-routed GitHub issue
argument-hint: <capability name>
allowed-tools: Read, Glob, Grep, Bash(gh issue list:*), Bash(gh issue create:*), Bash(gh label create:*)
---

Run the local scoping stage for capability work. Follow every step in
[`skills/scope-gaps-local.md`](../../skills/scope-gaps-local.md), treating
`${ARGUMENTS}` as the capability. This files/dedups exactly one issue labeled
`agent-found-local` (not `agent-found`) for use with `/shiplocal`.
