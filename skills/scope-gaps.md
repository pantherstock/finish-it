# Skill body — scope-gaps

Harness-agnostic body for the `scope-gaps` stage. Per-harness entry points
(`.claude/commands/scope-gaps.md`, `.agents/skills/scope-gaps/SKILL.md`) only carry frontmatter
and point here. See `pipeline.json` stage `scope`.

---

You are a PM/scoping agent for **Finish It**, a focused-reading web app.

**Capability to scope:** ${ARGUMENTS}

## Codebase context (read this before anything else)

Finish It is a **single static `index.html`** (~880 lines). No framework, no build step.

Key landmarks you'll need:
- **`const DB`** — localStorage interface; user data stored under key `finishit`
- **`let state`** — in-memory app state (articles, days/streak)
- **`function go(name)`** — screen router; four screens: `home`, `reader`, `finish`, `calendar`
- **`async function startFromInput()`** — entry point for URL + pasted-text flow
- **`async function fetchArticle(url)`** — fetches via `https://r.jina.ai/<url>`; the main async risk surface
- **`function cleanMarkdown(md)`** — regex-based boilerplate stripper; historically buggy
- **`function makeQuestion()`** / **`buildQuestions()`** — comprehension question generator
- **`const WORDS_PER_CHUNK = 105`** — chunk size constant

Do NOT touch `plan/`. Do NOT add npm packages or a build step.

## Steps

### 1. Read the research brief
```
docs/research/${ARGUMENTS}.md
```
Extract the top best practices and the specific APIs/patterns recommended.

### 2. Read the codebase
Read `index.html` in full. For each best practice from the brief, ask:
- Does Finish It already do this? (grep for the relevant API or pattern)
- If not, is it implementable inside `index.html` without new infra?
- What is the smallest PR-sized change that would add meaningful value?

Focus on gaps that are:
- **Client-side only** (no new backend/Worker needed for the first pass)
- **Surgical** — a senior engineer can finish in one PR, touching ≤50 lines
- **Verifiable as ONE Playwright assertion** — the acceptance check must be expressible
  as a single deterministic, offline test (see step 4). If you can't write the assertion,
  the gap isn't scoped tightly enough — tighten it or pick another.

### 3. Dedup against open issues
```bash
gh issue list --state open --label agent-found --limit 100 --json number,title,body
```
Read every open `agent-found` issue. If an issue already describes the same gap (match on the
underlying problem, not exact wording), **stop — do not file a duplicate.**

### 4. File exactly one issue
Pick the single most valuable, PR-sized gap. First ensure the capability label exists, then file
the issue:

```bash
gh label create "capability:${ARGUMENTS}" --color "0075ca" --force

gh issue create \
  --label agent-found \
  --label "capability:${ARGUMENTS}" \
  --label enhancement \
  --title "<short, specific title>" \
  --body "<body — see template below>"
```

**Issue body template:**
```
## Gap
One paragraph: what's missing and why it matters for this capability.

## Relevant research
Direct quotes or pointers from `docs/research/${ARGUMENTS}.md` that support this gap.

## Acceptance check
- [ ] Concrete, observable thing that proves the feature works (e.g. "open DevTools → Application → Local Storage → `finishit_obs` key exists and contains a JSON array after triggering an error")

## Acceptance test (Playwright)
The auto-fixer writes this file **verbatim** to the path below and must NOT modify it — it is
the deterministic gate for this issue, so it has to fail on today's code and pass once the fix
lands. Author it to the test convention in `AGENTS.md` ("Test convention"): one acceptance
check → one assertion; **no live network** (mock `r.jina.ai` with `page.route`, seed
`localStorage` with `page.addInitScript`); reach the app with `page.goto('/')` (baseURL is set).
Mirror the patterns already in `tests/smoke.spec.js`.

**File:** `tests/${ARGUMENTS}.spec.js`
\`\`\`js
const { test, expect } = require('@playwright/test');

test('${ARGUMENTS}: <what the acceptance check proves>', async ({ page }) => {
  // seed storage / mock network here only if the assertion needs it
  await page.goto('/');
  // ...drive the UI to the behavior the gap adds...
  await expect(/* the observable signal */).toBeVisible();
});
\`\`\`

## Implementation notes
- Specific functions / lines in `index.html` to touch
- Any gotchas from the research brief (e.g. "use separate key — don't write to `finishit`")
- Keep changes inside `index.html` (plus the acceptance test); no other new files unless clearly needed
```

**Worked example** of an `## Acceptance test` block (capability `keyboard-shortcuts`), so the
shape is concrete — note the mocked network and the single, observable assertion:
\`\`\`js
const { test, expect } = require('@playwright/test');

test('keyboard-shortcuts: ArrowRight advances to the next bite', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Why we procrastinate' }).click();
  await expect(page.locator('.chunk-card')).toBeVisible();

  const first = await page.locator('.chunk-card').innerText();
  await page.keyboard.press('ArrowRight');

  // The observable signal: the visible bite text changed after the keypress.
  await expect(page.locator('.chunk-card')).not.toHaveText(first);
});
\`\`\`

### 5. Report back
- The issue number and title filed
- One sentence on why you chose this gap over alternatives you considered
- Confirm the `## Acceptance test` block is present, fails on today's code, and follows the
  no-live-network convention (mocks `r.jina.ai`, seeds `localStorage`)
- Confirm: re-running this skill would file nothing (the issue now exists)
