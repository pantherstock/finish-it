# CLAUDE.md

The full agent guide lives in **AGENTS.md** (single source of truth, shared with the
CI auto-fixer and any other agent). Read it first:

@AGENTS.md

## Claude Code specifics

- **`/qa-tester [persona]`** — drive the live app via Playwright MCP and file deduped
  `agent-found` issues. The flagship workflow here.
- Companion files: `FEATURES.md` (what the app does), `TEST-EVIDENCE.md` (the
  verification checklist to run before opening a PR).
- This is a learning project about harness/agent engineering — `plan/` holds the
  roadmap and notes (git-ignored; don't edit from automated runs).
