---
name: "qa-tester"
description: "Drive the live Finish It app as a persona and file deduped GitHub issues for every problem found"
---

# qa-tester

Run the **qa-tester** stage. Follow every step in
[`skills/qa-tester.md`](../../../skills/qa-tester.md), treating the user's argument as the persona
for this run (default: a distracted first-timer). That shared body is the single source of truth;
this file only wires it into the Copilot CLI. See `pipeline.json` entry `qa-tester`.
