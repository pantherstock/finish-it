---
description: Research a capability and write a brief to docs/research/<cap>.md, then ping Discord
argument-hint: <capability name>
allowed-tools: WebSearch, WebFetch, Write, Read, Bash(curl:*)
---

Run the **research** stage. Follow every step in [`skills/research.md`](../../skills/research.md),
treating `${ARGUMENTS}` as the capability to research. That shared body is the single source of
truth; this file only wires it into Claude Code. See `pipeline.json` stage `research`.
