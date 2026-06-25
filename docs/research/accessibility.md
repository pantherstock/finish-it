# accessibility — Research Brief

## What it is
Accessibility (a11y) means ensuring Finish It works for users who rely on keyboards, screen readers, or other assistive technologies — not just mouse/touch users. For a reading app, this is especially important: the core value proposition is focused, distraction-free reading, and that experience should be available to everyone. A screen reader user who can't navigate chunks or hear quiz feedback gets nothing from the app at all.

## Best practices (top 5)
- **Manage focus on screen transitions.** When `go()` switches screens, keyboard and screen reader users have no idea the content changed. Move focus to the top heading or main landmark of the new screen immediately after switching. Without this, focus stays on whatever was last clicked — often a button that no longer exists in the visible flow.
- **Label icon-only controls.** The quit button (`←`), the delete button (`×`), and the brand div (`onclick="go('home')"`) have no accessible names. A screen reader announces them as "button" with no context. Every interactive element needs an `aria-label` or visible text.
- **Associate the textarea with a label.** The main input has a placeholder and a `.hint` span but no `<label>` element linked via `for`/`id`. Screen readers won't announce the field's purpose when it receives focus.
- **Announce dynamic content with `aria-live`.** The toast (bottom notification), quiz feedback nudge, and quiz answer reveal all update silently. A screen reader user never hears "that's it." or "not quite — now you'll remember it." Wiring an `aria-live="polite"` region to announce these changes is the minimum fix.
- **Preserve semantic HTML for interactive elements.** Most controls in the app correctly use `<button>` — good. The `.brand` div with `onclick` is the main exception: it should be a `<button>` (or `<a>`) so it gets keyboard focus, Enter/Space handling, and a role automatically.

## Relevant patterns / APIs
- **`element.focus()`** — move focus programmatically after a screen transition. Call it on the new screen's first heading or on the screen container itself (with `tabindex="-1"` to make it focusable without adding it to the tab order).
- **`aria-label="Back to shelf"`** — accessible name for icon-only buttons; applied directly on the `<button>` element.
- **`<label for="input">` / `aria-label` on `<textarea>`** — links the visible hint text to the input so screen readers read it on focus.
- **`aria-live="polite"` region** — a visually-hidden `<div>` present at page load; update its `textContent` whenever the toast fires or the quiz gives feedback. Screen readers announce changes automatically. Must exist at load time — dynamically injecting the region causes screen readers to miss it.
- **`tabindex="-1"`** — makes an element focusable via script without adding it to the natural tab order. Right for focus targets on screen transitions (headings, screen containers).
- **`role="status"` or `role="alert"`** — supplements `aria-live`; `status` is polite (doesn't interrupt), `alert` is assertive (interrupts immediately). Use `status` for the toast, `alert` for quiz wrong-answer feedback.

## What to avoid
- **Don't use `display: none` for content that should be accessible.** Finish It correctly hides inactive screens with `display: none` (via `.screen` / `.screen.active`) — these screens are genuinely hidden and this is correct behaviour.
- **Don't add `tabindex="0"` to the `.brand` div.** Fix the root problem instead: make it a `<button>` or `<a>` so it gets keyboard behaviour natively.
- **Don't stuff multiple concerns into one `aria-live` region.** A single region is fine for the toast. Give quiz feedback its own region so both can fire simultaneously without clobbering each other.
- **Don't rely on placeholder text as a label.** Placeholders disappear on input and are not reliably announced by all screen readers. The `<label>` element is the correct mechanism.
- **Don't add ARIA where native semantics already exist.** The existing `<button>` and `<section>` elements don't need extra roles — adding redundant ARIA is noise.

## Sources
- [JavaScript accessibility — web.dev Learn](https://web.dev/learn/accessibility/javascript)
- [CSS and JavaScript accessibility best practices — MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/CSS_and_JavaScript)
- [ARIA and HTML — web.dev](https://web.dev/learn/accessibility/aria-html)
- [Developing a Keyboard Interface — W3C WAI ARIA APG](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [WCAG 2.2 — W3C](https://www.w3.org/TR/WCAG22/)
