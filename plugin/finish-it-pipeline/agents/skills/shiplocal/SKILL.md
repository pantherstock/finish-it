---
name: "shiplocal"
description: "Run the full capability loop locally (research/scope + local auto-fix/gate/review + PR)"
---

# shiplocal

Run the **shiplocal** local fallback (research → scope → local auto-fix → local
gate/fix-loop → local adversarial review → PR). Follow every step in
[`skills/shiplocal.md`](../../../skills/shiplocal.md), treating the user's argument as
the capability. That shared body is the single source of truth; this file only wires
it into the Copilot CLI.
