---
name: "install-pipeline"
description: "Scaffold the Finish It capability pipeline (CI workflows + labels + local skills) into a target repo"
---

# install-pipeline

Install the **Finish It capability pipeline** into a target repository. Follow every step in
[`skills/install-pipeline.md`](../../../skills/install-pipeline.md), treating the user's argument
as the target repo path (default: the current working directory). That shared body is the single
source of truth; this file only wires it into the Copilot CLI. See `plugin.json` and `README.md`.
