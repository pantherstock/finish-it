const { test, expect } = require('@playwright/test');

test('reading-progress: a labeled progressbar is visible on mobile', async ({ page }) => {
  // Mobile width — the desktop `.plant-side` (its only "bite N of M" caption) is
  // hidden at <=768px, so the progress indicator must be net-new here.
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');

  // Sample article = deterministic, no network.
  await page.getByRole('button', { name: 'Why we procrastinate' }).click();
  await expect(page.locator('#reader')).toBeVisible();
  await expect(page.locator('.chunk-card')).toBeVisible();

  // The observable signal: an a11y-exposed reading-progress indicator is visible
  // on mobile (role="progressbar" + accessible name "Reading progress").
  await expect(
    page.getByRole('progressbar', { name: /reading progress/i })
  ).toBeVisible();
});
