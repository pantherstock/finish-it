# Finish It

Finish what you start. One read at a time.

Paste a link or some text, read it without distraction, and watch your
"finished today" streak grow. A small app for beating the open-tab graveyard.

## Run it

It's a single static file — open `index.html` in a browser, or serve the
folder with any static host.

## Deploy

Hosted as a static site on Cloudflare Pages: https://finish-it.simyilin.workers.dev/

## How it's maintained

An autonomous QA → fix loop with GitHub as the orchestrator — a human gate before
anything ships:

```
Run /qa-tester [persona]   (Claude Code + Playwright MCP drive the live app)
        │  explores in character, dedups, files an issue + `agent-found` label
        ▼
GitHub issue (labeled)  ──label added fires the Action──►  Auto-fixer (claude-code-action)
                                                              │  edits index.html, opens a PR
                                                              ▼
                              Review + merge (human gate) → issue auto-closed → Cloudflare redeploys
```
