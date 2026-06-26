---
description: One-prompt entry point — research a capability, scope the gap, queue the issue, hand off to CI
argument-hint: <capability name>
allowed-tools: WebSearch, WebFetch, Write, Read, Glob, Grep, Bash(curl:*), Bash(gh issue list:*), Bash(gh issue create:*), Bash(gh label create:*)
---

Run the **ship** front-half (research → scope → queue). Follow every step in
[`skills/ship.md`](../../skills/ship.md), treating `${ARGUMENTS}` as the capability. That shared
body is the single source of truth; this file only wires it into Claude Code. See `pipeline.json`
stages `research` + `scope`.
