---
name: "ship"
description: "One-prompt entry point — research a capability, scope the gap, queue the issue, hand off to CI"
---

# ship

Run the **ship** front-half (research → scope → queue). Follow every step in
[`skills/ship.md`](../../../skills/ship.md), treating the user's argument as the capability. That
shared body is the single source of truth; this file only wires it into the Copilot CLI. See
`pipeline.json` stages `research` + `scope`.
