import { test, expect } from '@playwright/test';
import { fleet } from '../../src/data/fleet';

test('yacht discovery preserves the existing Octopus route and geometry', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('#/vessel/octopus');
  await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded', 'octopus');
  await page.getByRole('button', { name: 'Browse the fleet', exact: true }).click();
  await page.getByRole('button', { name: 'Yachts', exact: true }).click();
  await expect(page.getByLabel('Yacht filters', { exact: true })).toBeVisible();
  const expectedYachtCount = process.env.HULLSCOPE_YACHT_PREVIEW === '1'
    ? 21 // the 20-yacht preview collection plus the preserved Octopus entry
    : fleet.filter(v=>v.family.group==='Yachts').length;
  await expect(page.locator('.fleet-card')).toHaveCount(expectedYachtCount);
  if (process.env.HULLSCOPE_YACHT_PREVIEW === '1') {
    await expect(page.locator('.fleet-card').filter({hasText:'Princess'})).toHaveCount(10);
    await expect(page.locator('.fleet-card').filter({hasText:'Sunseeker'})).toHaveCount(10);
  }
  await page.locator('.fleet-card').filter({ hasText: 'Octopus' }).click();
  await expect(page).toHaveURL(/#\/vessel\/octopus/);
  await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded', 'octopus');
});

test('public Hugging Face binary downloads work anonymously across redirects', async ({ page }, testInfo) => {
  test.skip(process.env.HULLSCOPE_NETWORK_TESTS !== '1', 'Explicit live-network compatibility check; not a routine CI dependency.');
  await page.goto('#/vessel/octopus');
  const result = await page.evaluate(async () => {
    const url = 'https://huggingface.co/datasets/setrsoft/climbing-holds/resolve/6d0dcbac32678b1aff073feb752ae77f8b6e4805/0000000001/hold.glb';
    const response = await fetch(url, { credentials: 'omit', mode: 'cors', signal: AbortSignal.timeout(30000) });
    const bytes = await response.arrayBuffer();
    return { status: response.status, mime: response.headers.get('content-type'), bytes: bytes.byteLength, magic: new DataView(bytes).getUint32(0, true), redirected: response.redirected };
  });
  await testInfo.attach('anonymous-hf-download.json', { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
  expect(result.status).toBe(200);
  expect(result.bytes).toBe(1727056);
  expect(result.magic).toBe(0x46546c67);
  expect(result.mime).toContain('model/gltf-binary');
});

test('yacht cards keep thumbnails visible and compact controls separated', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('#/vessel/princess-r35-gen1-2018');
  await page.getByRole('button', { name: 'Browse the fleet', exact: true }).click();
  await page.getByRole('button', { name: 'Yachts', exact: true }).click();
  const thumbnails = page.locator('.fleet-card img.yacht-thumbnail');
  const expectedThumbnails=fleet.filter(vessel=>vessel.yacht).length;
  await expect(thumbnails).toHaveCount(expectedThumbnails);
  for (let index = 0; index < await thumbnails.count(); index++) {
    await thumbnails.nth(index).scrollIntoViewIfNeeded();
  }
  await expect.poll(()=>thumbnails.evaluateAll(images=>images.filter(image=>image instanceof HTMLImageElement&&image.complete&&image.naturalWidth>0).length),{timeout:30000}).toBe(expectedThumbnails);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 787, height: 420 });
  await page.reload();
  const title = page.locator('.mobile-vessel-title');
  const controls = page.locator('.stage-top');
  const titleBox = await title.boundingBox();
  const controlsBox = await controls.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();
  const separate=(a:NonNullable<typeof titleBox>,b:NonNullable<typeof titleBox>)=>a.x+a.width<=b.x+1||b.x+b.width<=a.x+1||a.y+a.height<=b.y+1||b.y+b.height<=a.y+1;
  expect(separate(titleBox!,controlsBox!)).toBe(true);
  const interior=page.getByRole('region',{name:'Explore yacht interiors'});
  await expect(interior).toBeVisible();
  const interiorBox=await interior.boundingBox();
  expect(interiorBox).not.toBeNull();
  expect(separate(interiorBox!,titleBox!)).toBe(true);
  expect(separate(interiorBox!,controlsBox!)).toBe(true);
});

test('representative Princess and Sunseeker authored assets load in the viewer', { tag: '@smoke' }, async ({ page }) => {
  for (const id of ['princess-r35-gen1-2018', 'sunseeker-superhawk-55-gen1-2023']) {
    await page.goto(`#/vessel/${id}`);
    await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded', id);
    await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded-lod', '0');
    await expect(page.locator('[data-scene-status]')).not.toHaveClass(/scene-error/);
  }
});
