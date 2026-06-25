# Research: Keyboard Shortcuts

## What it is

Keyboard shortcuts let a reader drive Finish It without reaching for the mouse — advancing
through chunks, revealing the peek, submitting a recall answer, moving between screens. For a
focused-reading app this matters more than usual: the whole value proposition is staying in
flow, and a hand leaving the keyboard to click "Next" is exactly the kind of friction the app
exists to remove. Done well, shortcuts are invisible to mouse users and a major speed-up for
keyboard users; done badly, they collide with the browser, assistive tech, or the user's own
typing.

## Best practices (top 3–5)

1. **Don't fire shortcuts while the user is typing.** Guard every handler with a check that the
   event target isn't an `<input>`, `<textarea>`, or `contenteditable` element. In Finish It the
   paste box is a `<textarea>` — a bare `n`/`p` shortcut would otherwise corrupt what the user is
   pasting. This is the single most important rule for this app.
2. **Use `event.key`, prefer modifier or non-letter keys, and respect WCAG 2.1.4.** Single
   *character* shortcuts (a bare letter/number) are a Level-A accessibility risk: they collide
   with screen-reader navigation (e.g. JAWS uses `b` to jump between buttons) and with speech
   input. Safe choices that sidestep 2.1.4 entirely: arrow keys, `Space`, `Enter`, `Esc`, `?`.
   If a bare letter is ever used, it must be disable-able, remappable, or focus-scoped.
3. **Never override browser/OS shortcuts.** Don't bind `Ctrl/Cmd`-combos that the browser owns
   (`Ctrl+S`, `Ctrl+W`, etc.). Call `preventDefault()` **only** when your handler actually
   consumes the key, so default behavior (Tab focus, typing) is preserved otherwise.
4. **Make shortcuts discoverable.** Keyboard users shouldn't have to read docs. A lightweight,
   in-app affordance — a `?`-triggered help overlay listing the keys, or hint text near the
   relevant control — is the standard pattern. Discoverability is itself an accessibility
   requirement, not a nicety.
5. **Keep handlers contextual.** A key should do the screen-appropriate thing (e.g. `→` advances
   a chunk in the reader, but does nothing on the home screen). Route through the existing
   screen state rather than one giant global switch with no context.

## Relevant patterns / APIs

- **`document.addEventListener('keydown', handler)`** — one global listener is fine for a
  single-file app; branch on `e.key` and the current screen.
- **`event.key`** — readable values: `'ArrowRight'`, `'ArrowLeft'`, `' '` (Space), `'Enter'`,
  `'Escape'`, `'?'`. Prefer over the deprecated `keyCode`/`which`.
- **Typing guard:** `if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName) || e.target.isContentEditable) return;`
- **`e.preventDefault()`** to stop the page scrolling when Space/arrows are used as controls —
  but only inside the branch that handles them.
- **A `<dialog>` or a toggled overlay `<div>`** for the help sheet; reuse existing screen/CSS
  conventions rather than introducing a new component style.

## What to avoid

- **Bare single-letter shortcuts with no escape hatch** — fails WCAG 2.1.4 and fights screen
  readers.
- **Listening on `keypress`** — deprecated; use `keydown`.
- **Unconditional `preventDefault()`** — breaks Tab navigation and typing; only prevent the keys
  you actually handle.
- **Firing shortcuts inside the paste `<textarea>`** — the classic bug for this app.
- **Rebinding browser/OS combos** (`Ctrl+S` etc.) — confusing and partly impossible.
- **Hidden, undocumented shortcuts** — if there's no on-screen hint, keyboard-only users can't
  find them.

## Sources

- [Understanding WCAG SC 2.1.4: Character Key Shortcuts — W3C WAI](https://www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts.html)
- [Keyboard: keydown and keyup — javascript.info](https://javascript.info/keyboard-events)
- [Developing a Keyboard Interface — W3C WAI ARIA APG](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [WebAIM: Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
