# Features — Finish It

What the app does, feature by feature. This is the contract an agent should preserve:
if a change breaks one of these, it's a regression. Pairs with `TEST-EVIDENCE.md`
(the runnable proof that each still works). All logic lives in `index.html`.

## Home / input
- Paste an **article link** or **raw text** into one box; **Begin →** starts a read.
- Links are fetched client-side via `r.jina.ai` and cleaned (`cleanMarkdown`);
  pasted text is used as-is. Empty input does nothing.
- **Sample chips** start a built-in reading (`SAMPLES`) with one click.
- A **shelf** lists saved/in-progress reads; each can be reopened or deleted.
- A **"This month" calendar** preview links to the full calendar.

## Reader
- Text is split into ~105-word **chunks** (`chunkText`) ≈ 60s of reading each.
- One chunk shows at a time; **Next →** advances, **prev** reviews earlier chunks.
- A small **"plant"** grows with progress (`renderPlant`) as ambient feedback.
- **Comprehension check:** some chunks end in an auto-generated fill-in-the-blank
  question (`makeQuestion`). Pick an option →
  - correct → ✓ on the answer, "that's it."
  - wrong → ✗ on your pick, ✓ on the right one, "not quite — now you'll remember it."
  - **Continue →** appears only after you answer.
- **"↩ look back at the passage"** peeks at the source text without leaving the quiz.
- **"I've read this →"** finishes the read.

## Finish
- A **recap** + **streak** count; doors back to the **shelf** or the **calendar**.
- Completing a read marks **today** done (`todayKey`) and persists it.

## Calendar
- Month grid (`renderCalendar`) marking each day a read was finished — the streak view.

## Persistence
- Everything is saved to `localStorage` key **`finishit`** (`DB` / `persist`).
  Reads, progress, and finished-days survive refresh; there's no server/account.
