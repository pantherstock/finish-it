const { test, expect } = require('@playwright/test');

// Walk the reader from the first chunk to the finish screen, handling both
// phases: read ("I've read this →") and quiz (pick an option, Continue →).
// Safety bound of 20 covers any realistic chunk count for these inputs.
async function walkToFinish(page) {
  for (let i = 0; i < 20; i++) {
    if (await page.locator('#finish').isVisible()) break;

    if (await page.locator('.recall').isVisible()) {
      await page.locator('.opt').first().click();
      await expect(page.locator('#contBtn')).toBeVisible();
      await page.locator('#contBtn').click();
    } else {
      await page.getByRole('button', { name: /I've read this/ }).click();
    }
  }
  await expect(page.locator('#finish')).toBeVisible();
}

test('core loop: sample article → read all chunks → finish screen', async ({ page }) => {
  await page.goto('/');

  // Home screen is visible
  await expect(page.locator('#home')).toBeVisible();

  // Start a sample article — deterministic, no network call needed
  await page.getByRole('button', { name: 'Why we procrastinate' }).click();

  // Reader screen appears with the first chunk
  await expect(page.locator('#reader')).toBeVisible();
  await expect(page.locator('.chunk-card')).toBeVisible();

  await walkToFinish(page);
});

test('paste-text flow: pasted prose runs the offline engine to finish', async ({ page }) => {
  // First line ≤80 chars becomes the title; the rest is the body. AI mode is
  // off by default, so this exercises the deterministic chunker/question engine
  // (makeArticle → chunkText → buildQuestions) with zero network.
  const pasted = [
    'Focus and the Lost Art of Finishing',
    '',
    'We rarely struggle to start things; we struggle to finish them. A book opened',
    'with enthusiasm sits half read on the shelf, and the article we meant to study',
    'becomes another tab we never close. The problem is rarely the material itself.',
    'It is the quiet weight of an unfinished thing, which grows heavier the longer it',
    'waits. The remedy is not more willpower but smaller steps, taken often enough',
    'that momentum does the work for us. When the next step is tiny, beginning again',
    'costs almost nothing, and finishing stops feeling like a distant event.',
  ].join('\n');

  await page.goto('/');
  await page.locator('#input').fill(pasted);
  await page.getByRole('button', { name: /Begin/ }).click();

  // The paste branch opens the reader directly (no fetch), titled from line 1.
  await expect(page.locator('#reader')).toBeVisible();
  await expect(page.locator('#readTitle')).toHaveText('Focus and the Lost Art of Finishing');
  await expect(page.locator('.chunk-card')).toBeVisible();

  await walkToFinish(page);
});

test('fetch-failure path: a dead link degrades to a toast, not a broken screen', async ({ page }) => {
  await page.goto('/');

  // Make the Jina reader fetch fail — the URL branch of startFromInput must
  // catch it, toast, re-enable the button, and stay on home (no half-built reader).
  await page.route('**r.jina.ai/**', route => route.abort());

  await page.locator('#input').fill('https://example.com/some-article');
  await page.getByRole('button', { name: /Begin/ }).click();

  // Graceful degradation: the catch path shows the recovery toast…
  await expect(page.locator('#toast')).toHaveText(/Couldn't read that link/);
  // …we never leave home for a broken reader…
  await expect(page.locator('#home')).toBeVisible();
  await expect(page.locator('#reader')).toBeHidden();
  // …and the finally block restores the button so the user can retry.
  await expect(page.locator('#startBtn')).toBeEnabled();
  await expect(page.locator('#startBtn')).toHaveText(/Begin/);
});

test('corrupt localStorage recovery: garbage in finishit boots clean, not blank', async ({ page }) => {
  // Seed invalid JSON under the app's storage key *before* its script runs.
  // DB.load() must swallow the parse error and fall back to defaults rather
  // than throwing during boot (the historically fragile path).
  await page.addInitScript(() => {
    try { localStorage.setItem('finishit', '{ not valid json '); } catch (e) { /* ignore */ }
  });

  await page.goto('/');

  // App booted to a usable home with an empty shelf, despite the corrupt blob.
  await expect(page.locator('#home')).toBeVisible();
  await expect(page.locator('.empty')).toBeVisible();

  // Recovery is real: completing the core loop persists *valid* JSON over the garbage.
  await page.getByRole('button', { name: 'Why we procrastinate' }).click();
  await walkToFinish(page);

  const stored = await page.evaluate(() => localStorage.getItem('finishit'));
  expect(() => JSON.parse(stored)).not.toThrow();
});

test('day-door rollover: finishing opens today and the count increments', async ({ page }) => {
  // The app models a "streak" as per-day doors on the calendar (no break to roll
  // over) — completeArticle increments state.days[today]. We assert the first
  // finish opens today's door, the calendar renders it open, and a second finish
  // the same day flips the door note from "opened" to a running count.
  await page.goto('/');

  // First finish of the day → "door just opened".
  await page.getByRole('button', { name: 'Why we procrastinate' }).click();
  await walkToFinish(page);
  await expect(page.locator('#doorNote')).toContainText(/door just/i);

  // Calendar shows today's cell as open.
  await page.getByRole('button', { name: /See this month/ }).click();
  await expect(page.locator('.cell.open.today')).toBeVisible();

  // Second finish, same day → the count rolls forward ("2 finished").
  // Reload home (state persists in localStorage) and finish a different article.
  await page.goto('/');
  await page.getByRole('button', { name: 'The science of awe' }).click();
  await walkToFinish(page);
  await expect(page.locator('#doorNote')).toContainText(/2 finished/);
});
