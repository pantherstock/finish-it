---
description: Drive the live Finish It app as a persona and file deduped GitHub issues for every problem found
argument-hint: [persona name or description]
allowed-tools: mcp__playwright__*, Bash(gh issue list:*), Bash(gh issue create:*), Bash(gh issue view:*)
---

Run the **qa-tester** stage. Follow every step in [`skills/qa-tester.md`](../../skills/qa-tester.md),
treating `${ARGUMENTS}` as the persona for this run. That shared body is the single source of truth;
this file only wires it into Claude Code. See `pipeline.json` entry `qa-tester`.
