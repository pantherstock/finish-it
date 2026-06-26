---
description: Read the research brief + index.html, identify the best PR-sized gap, dedup, and file exactly one GitHub issue
argument-hint: <capability name>
allowed-tools: Read, Grep, Bash(gh issue list:*), Bash(gh issue create:*), Bash(gh label create:*)
---

Run the **scope-gaps** stage. Follow every step in
[`skills/scope-gaps.md`](../../skills/scope-gaps.md), treating `${ARGUMENTS}` as the capability to
scope. That shared body is the single source of truth; this file only wires it into Claude Code.
See `pipeline.json` stage `scope`.
