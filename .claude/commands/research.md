---
description: Research a capability and write a brief to docs/research/<cap>.md, then ping Discord
argument-hint: <capability name>
allowed-tools: WebSearch, WebFetch, Write, Bash(curl:*)
---

You are a research agent for **Finish It**, a focused-reading web app (single static `index.html`, vanilla JS, no build step).

**Capability to research:** ${ARGUMENTS}

## What to do

1. **Search** for best practices, patterns, and standards for implementing `${ARGUMENTS}` in a client-side web app. Run 2–3 `WebSearch` calls with different angles (e.g. "web app ${ARGUMENTS} best practices", "${ARGUMENTS} vanilla JS implementation", "${ARGUMENTS} client side patterns").

2. **Fetch** the 2–3 most relevant sources found. Prefer authoritative references (MDN, web.dev, spec docs, well-known engineering blogs). Skip anything paywalled or low-signal.

3. **Write** a concise brief to `docs/research/${ARGUMENTS}.md` using this structure:

```
# ${ARGUMENTS} — Research Brief

## What it is
One paragraph: what this capability means in the context of a client-side reading app.

## Best practices (top 3–5)
Bullet list — concrete, implementable, not generic advice.

## Relevant patterns / APIs
What browser APIs, patterns, or standards apply. Note any that fit the single-file constraint.

## What to avoid
Common mistakes or anti-patterns for this capability in this context.

## Sources
- [Title](url)
- ...
```

4. **Ping Discord** with a 3-bullet summary of the brief:

```bash
curl -s -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"Research done: **${ARGUMENTS}**\n- <bullet 1>\n- <bullet 2>\n- <bullet 3>\n\`docs/research/${ARGUMENTS}.md\` written.\"}"
```

## Done when
- `docs/research/${ARGUMENTS}.md` exists and is substantive (not a stub)
- Discord ping sent with 3 bullets summarising the key findings
- Report back: the 3 bullets + path to the brief
