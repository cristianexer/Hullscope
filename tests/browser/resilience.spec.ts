import { test, expect } from '@playwright/test';

test('a failed geometry download offers a usable text catalogue', {tag:'@smoke'}, async ({page}) => {
  await page.route('**/models/ever-ace.lod*.glb', route => route.abort());
  await page.goto('#/vessel/ever-ace');
  await page.getByRole('button', {name: 'Open text catalogue', exact: true}).click();
  await expect(page.getByRole('dialog')).toContainText('Ever Ace — text catalogue');
  await page.getByRole('textbox', {name: 'Search text catalogue'}).fill('piston');
  await expect(page.getByRole('dialog').getByText('Cylinder 1 piston crown', {exact: true}).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', {name: 'Browse the fleet'}).click();
  await page.getByRole('textbox', {name: 'Search fleet'}).fill('Sparky');
  await page.locator('.fleet-card').click();
  await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded', 'sparky', {timeout: 30000});
});

test('an unavailable WebGL context preserves keyboard-accessible knowledge', {tag:'@smoke'}, async ({page}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof getContext>) {
      if (String(args[0]).includes('webgl')) return null;
      return getContext.apply(this, args);
    } as typeof getContext;
  });
  await page.goto('#/vessel/sparky');
  await page.getByRole('button', {name: 'Open text catalogue', exact: true}).click();
  await expect(page.getByRole('dialog')).toContainText('Sparky — text catalogue');
  await page.getByRole('textbox', {name: 'Search text catalogue'}).fill('battery');
  await expect(page.getByRole('dialog')).toContainText('Battery');
  await expect(page.getByRole('button', {name: 'Close dialog'})).toBeVisible();
});
