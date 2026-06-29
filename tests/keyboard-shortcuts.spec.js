const { test, expect } = require('@playwright/test');

test('keyboard-shortcuts: ? opens help overlay; Escape closes it; Shift+Space does not advance', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Why we procrastinate' }).click();
  await expect(page.locator('#reader')).toBeVisible();
  await expect(page.locator('.chunk-card')).toBeVisible();

  // Record current bite number so we can verify Shift+Space did not advance it.
  const before = await page.locator('.reader-progress-meta').textContent();

  // Shift+Space must NOT advance the reader.
  await page.keyboard.press('Shift+Space');
  await expect(page.locator('.reader-progress-meta')).toHaveText(before);

  // ? opens the help overlay.
  await page.keyboard.press('?');
  await expect(page.locator('#shortcutsHelp')).toBeVisible();

  // Escape closes it.
  await page.keyboard.press('Escape');
  await expect(page.locator('#shortcutsHelp')).toBeHidden();
});
