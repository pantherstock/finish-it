# Finish It

Finish what you start. One read at a time.

Paste a link or some text, read it without distraction, and watch your
"finished today" streak grow. A small app for beating the open-tab graveyard.

## Run it

It's a single static file — open `index.html` in a browser, or serve the
folder with any static host.

## Deploy

Hosted as a static site on Cloudflare Pages: https://finish-it.simyilin.workers.dev/

## Working on it

New here (human or agent)? Start with **[AGENTS.md](AGENTS.md)** (how the code is
laid out and how to make a change), then **[FEATURES.md](FEATURES.md)** (what the app
does) and **[TEST-EVIDENCE.md](TEST-EVIDENCE.md)** (the checklist to verify before a PR).

## How it's maintained

An autonomous QA → fix loop with GitHub as the orchestrator — a human gate before
anything ships:

```
Run /qa-tester [persona]   (a local agent + Playwright MCP drive the live app)
        │  explores in character, dedups, files an issue + `agent-found` label
        ▼
GitHub issue (labeled)  ──label added fires the Action──►  Auto-fixer assigns GitHub Copilot
                                                              │  Copilot edits index.html, opens a PR
                                                              ▼
                              Review + merge (human gate) → issue auto-closed → Cloudflare redeploys
```

The full stage map (triggers, agents, caps, how to re-run any stage) lives in
[`pipeline.json`](pipeline.json); the human walkthrough is in [AGENTS.md](AGENTS.md).
