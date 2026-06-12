const { test, expect } = require('@playwright/test');

test('core loop: sample article → read all chunks → finish screen', async ({ page }) => {
  await page.goto('/');

  // Home screen is visible
  await expect(page.locator('#home')).toBeVisible();

  // Start a sample article — deterministic, no network call needed
  await page.getByRole('button', { name: 'Why we procrastinate' }).click();

  // Reader screen appears with the first chunk
  await expect(page.locator('#reader')).toBeVisible();
  await expect(page.locator('.chunk-card')).toBeVisible();

  // Walk through every chunk. Safety bound of 20 iterations covers any
  // realistic chunk count for the sample articles (~3–5 chunks each).
  for (let i = 0; i < 20; i++) {
    if (await page.locator('#finish').isVisible()) break;

    if (await page.locator('.recall').isVisible()) {
      // Quiz phase: pick the first option, wait for Continue, advance
      await page.locator('.opt').first().click();
      await expect(page.locator('#contBtn')).toBeVisible();
      await page.locator('#contBtn').click();
    } else {
      // Read phase: advance past the current chunk
      await page.getByRole('button', { name: /I've read this/ }).click();
    }
  }

  // Finish screen must be visible — the core loop completed
  await expect(page.locator('#finish')).toBeVisible();
});
