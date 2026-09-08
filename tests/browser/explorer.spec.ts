import { test, expect, type Page, type Locator } from '@playwright/test';
import { fleet } from '../../src/data/fleet';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, platform, release, arch } from 'node:os';
import { openSystems, chooseOption } from './helpers';
const outputRoot = process.env.HULLSCOPE_BROWSER === 'webkit' ? 'output/playwright/webkit' : 'output/playwright';

async function ready(page: Page, id = 'ever-ace') {
  await page.goto(`#/vessel/${id}`);
  await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded', id, {timeout: 30000});
  await expect(page.locator('canvas')).toBeVisible();
  const labels=page.getByRole('button',{name:'Labels',exact:true});
  if(await labels.getAttribute('aria-pressed')==='false') await labels.click();
  // Allow the authored camera transition to finish before evaluating projected UI.
  await page.waitForTimeout(900);
}

async function withinViewport(page: Page, locator: Locator) {
  await expect(locator).toBeVisible();
  const bounds = await locator.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(-1);
  expect(bounds!.y).toBeGreaterThanOrEqual(-1);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function noPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight}));
  expect(dimensions.scrollWidth, 'document horizontal overflow').toBeLessThanOrEqual(dimensions.width + 1);
  expect(dimensions.scrollHeight, 'document vertical overflow').toBeLessThanOrEqual(dimensions.height + 1);
  await withinViewport(page, page.locator('.explosion-console'));
  await withinViewport(page, page.locator('.camera-tools'));
}

async function modelFitsCanvas(page: Page) {
  // Capture both measurements in the same browser task: separate protocol calls
  // can exhaust the poll deadline on a busy software renderer despite a valid fit.
  await expect.poll(() => page.evaluate(() => {
    const encoded = document.querySelector('[data-scene-status]')?.getAttribute('data-model-bounds');
    const canvas = document.querySelector('canvas')?.getBoundingClientRect();
    if (!encoded || !canvas) return false;
    const [left, top, right, bottom] = JSON.parse(encoded) as number[];
    return [left, top, right, bottom].every(Number.isFinite) && left >= -1 && top >= -1 && right <= canvas.width + 1 && bottom <= canvas.height + 1 && right > left && bottom > top;
  }), {message: 'complete model envelope fits inside the canvas', timeout: 5000}).toBe(true);
}

async function readableLabels(page: Page) {
  const labels = await page.locator('.scene-label').evaluateAll(elements => elements.filter(element => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden';
  }).map(element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {text: element.textContent, x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, fontSize: parseFloat(style.fontSize), filter: style.filter, width: rect.width, nativeWidth: (element as HTMLElement).offsetWidth};
  }));
  const canvas = await page.locator('canvas').boundingBox();
  expect(canvas).not.toBeNull();
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    expect(label.fontSize, `readable text: ${label.text}`).toBeGreaterThanOrEqual(12);
    expect(label.filter, `unblurred text: ${label.text}`).toBe('none');
    expect(Math.abs(label.width - label.nativeWidth), `native pixel scale: ${label.text}`).toBeLessThanOrEqual(1);
    expect(label.x, `label left: ${label.text}`).toBeGreaterThanOrEqual(canvas!.x - 1);
    expect(label.y, `label top: ${label.text}`).toBeGreaterThanOrEqual(canvas!.y - 1);
    expect(label.right, `label right: ${label.text}`).toBeLessThanOrEqual(canvas!.x + canvas!.width + 1);
    expect(label.bottom, `label bottom: ${label.text}`).toBeLessThanOrEqual(canvas!.y + canvas!.height + 1);
    for (const other of labels.slice(i + 1)) {
      const overlaps = label.x < other.right && label.right > other.x && label.y < other.bottom && label.bottom > other.y;
      expect(overlaps, `labels collide: ${label.text} / ${other.text}`).toBe(false);
    }
  }
}

async function openAnatomy(page: Page) { await openSystems(page); }

// Test individual vessel cases separately: failures identify a hull and retain its own trace.
for (const vessel of fleet) {
  test(`${vessel.name}: exterior, cutaway and exploded models`, async ({page}, testInfo) => {
    test.setTimeout(60000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {if(message.type()==='error'&&/shader|webgl|program|framebuffer/i.test(message.text()))errors.push(message.text());});
    page.on('response', response => {if (response.url().includes('/models/') && response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`);});
    await ready(page, vessel.id);
    for (const view of ['Exterior', 'Cutaway', 'Exploded']) {
      await page.getByRole('button', {name: view, exact: true}).click();
      if(view==='Exploded') {
        await page.getByRole('slider').focus();
        await page.keyboard.press('Home');
        for(let i=0;i<6;i++) await page.keyboard.press('PageUp');
        for(let i=0;i<5;i++) await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow','65');
        // Expansion preserves the user's camera; fitting its new bounds is explicit.
        await page.getByRole('button',{name:'Fit whole vessel',exact:true}).click();
      }
      await page.waitForTimeout(900);
      await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded', vessel.id);
      await noPageOverflow(page);
      await modelFitsCanvas(page);
      if(view==='Exterior') await expect(page.locator('.scene-label:visible').first()).toBeVisible();
      await readableLabels(page);
      const screenshot = await page.screenshot({path: `${outputRoot}/fleet/${vessel.id}-${view.toLowerCase()}.png`});
      await testInfo.attach(`${vessel.id}-${view}`, {body: screenshot, contentType: 'image/png'});
    }
    await page.getByRole('button',{name:'Exterior',exact:true}).click();
    const ocean=page.getByRole('button',{name:'Ocean',exact:true});
    if(await ocean.getAttribute('aria-pressed')==='true')await ocean.click();
    for(const angle of ['Stern','Below']){
      await chooseOption(page,'Camera viewpoint',angle);
      await page.waitForTimeout(900);await modelFitsCanvas(page);
      await page.screenshot({path:`${outputRoot}/fleet/${vessel.id}-${angle.toLowerCase()}.png`});
    }
    expect(errors).toEqual([]);
  });
}

test('search, inspect, isolate, nested explosion, reset and sources', {tag:'@smoke'}, async ({page}) => {
  await ready(page);
  await page.getByLabel('Find a component', {exact: true}).fill('Cylinder 1 piston crown');
  await page.locator('.component-row').first().click();
  await expect(page.locator('.component-card h2')).toContainText('Cylinder 1 piston crown');
  await page.getByRole('button', {name: 'Isolate system', exact: true}).click();
  await chooseOption(page,'Disassembly scope','Selected assembly');
  await page.getByRole('slider', {name: 'Disassembly amount'}).focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '100');
  await page.getByRole('button', {name: 'Reset view', exact: true}).click();
  await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '0');
  await page.getByRole('button', {name: 'Reference-informed reconstruction', exact: true}).click();
  await expect(page.getByRole('dialog')).toContainText('Sources and reconstruction notes for Ever Ace');
  await expect(page.getByRole('dialog').getByRole('link').first()).toHaveAttribute('href', /^https:/);
});

test('guided tour, comparison, and fleet navigation', {tag:'@smoke'}, async ({page}) => {
  await ready(page);
  await page.getByRole('button', {name: 'Guided tour', exact: true}).click();
  await expect(page.locator('.tour-card')).toContainText('1 OF 5');
  for (let i = 0; i < 4; i++) await page.locator('.tour-card').getByRole('button', {name: 'Continue'}).click();
  await page.getByRole('button', {name: 'Finish tour'}).click();
  await expect(page.locator('.tour-card')).toHaveCount(0);
  await page.getByRole('button', {name: 'Compare vessels', exact: true}).click();
  await page.getByRole('button', {name: 'Explore at shared scale'}).click();
  await expect(page.locator('.compare-overlay')).toContainText('Sparky');
  await page.getByRole('button', {name: 'Close comparison'}).click();
  await page.locator('.fleet-trigger').click();
  await page.getByLabel('Search fleet').fill('Spartacus');
  await page.locator('.fleet-card').click();
  await expect(page.locator('.vessel-intro h1')).toHaveText('Spartacus');
  await page.goBack();
  await expect(page.locator('.vessel-intro h1')).toHaveText('Ever Ace');
});

const screenSizes = [
  {width: 320, height: 568}, {width: 390, height: 844}, {width: 768, height: 1024},
  {width: 1024, height: 768}, {width: 1440, height: 900}, {width: 1920, height: 1080},
  {width: 844, height: 390},
];
for (const viewport of screenSizes) {
  test(`responsive controls and dialogs at ${viewport.width}×${viewport.height}`, async ({page}, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize(viewport);
    await page.emulateMedia({reducedMotion: 'reduce'});
    await ready(page, 'sparky');
    await noPageOverflow(page);
    await modelFitsCanvas(page);
    await readableLabels(page);
    await openAnatomy(page);
    await page.getByLabel('Find a component', {exact: true}).fill('battery');
    await page.locator('.component-row').first().click();
    await withinViewport(page, page.locator('.inspector'));
    await withinViewport(page, page.getByRole('button', {name: 'Close inspector'}));
    await page.getByRole('button', {name: 'Close inspector'}).click();
    await page.getByRole('button', {name: 'Risk', exact: true}).click();
    await withinViewport(page, page.locator('.inspector'));
    await withinViewport(page, page.getByRole('button', {name: 'Close inspector'}));
    await page.getByRole('button', {name: 'Close inspector'}).click();
    for (const action of ['About Hullscope', 'Text catalogue', 'Compare vessels']) {
      if (action === 'About Hullscope' && !await page.getByRole('button', {name: action, exact: true}).isVisible()) {
        await openAnatomy(page);
        await page.getByRole('button', {name: 'Reference-informed reconstruction', exact: true}).click();
      } else await page.getByRole('button', {name: action, exact: true}).click();
      await withinViewport(page, page.getByRole('dialog'));
      await withinViewport(page, page.getByRole('button', {name: 'Close dialog'}));
      await expect(page.getByRole('dialog')).toHaveAttribute('aria-describedby', /.+/);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await page.keyboard.press('Escape');
    }
    await page.locator('.fleet-trigger').click();
    await withinViewport(page, page.getByRole('dialog'));
    await page.getByLabel('Search fleet').fill('no-vessel-with-this-name');
    await expect(page.getByRole('dialog')).toContainText('No vessels match');
    await page.keyboard.press('Escape');
    await noPageOverflow(page);
    await page.getByRole('button', {name: 'Reset view', exact: true}).click();
    await modelFitsCanvas(page);
    await testInfo.attach('responsive-overview', {body: await page.screenshot({path: `${outputRoot}/responsive/${viewport.width}x${viewport.height}.png`}), contentType: 'image/png'});
  });
}

test('very long, tall and broad vessels fit narrow and short viewports', async ({page}) => {
  test.setTimeout(90000);
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const viewport of [{width: 320, height: 568}, {width: 844, height: 390}]) {
    await page.setViewportSize(viewport);
    for (const id of ['ever-ace', 'voltaire', 'sleipnir', 'icon-of-the-seas', 'christophe-de-margerie', 'black-pearl']) {
      await ready(page, id);
      await noPageOverflow(page);
      await modelFitsCanvas(page);
      await readableLabels(page);
      await page.getByRole('button', {name: 'Exploded', exact: true}).click();
      await page.getByRole('slider').focus();
      await page.keyboard.press('End');
      await page.getByRole('button',{name:'Fit whole vessel',exact:true}).click();
      await page.waitForTimeout(500);
      await noPageOverflow(page);
      await modelFitsCanvas(page);
      await readableLabels(page);
      await page.screenshot({path: `${outputRoot}/responsive/${id}-${viewport.width}x${viewport.height}-exploded.png`});
    }
  }
});

test('deep links restore model, mode, component and explosion after reload', {tag:'@smoke'}, async ({page}) => {
  await ready(page);
  await page.getByLabel('Find a component', {exact: true}).fill('Cylinder 1 piston crown');
  await page.locator('.component-row').first().click();
  await page.getByRole('button', {name: 'Exploded', exact: true}).click();
  await expect(page).toHaveURL(/part=ever-ace/);
  await expect(page).toHaveURL(/explode=40/);
  await page.reload();
  await expect(page.locator('.component-card h2')).toContainText('Cylinder 1 piston crown');
  await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '40');
});

test('unknown vessel facts remain explicitly unknown in the text catalogue', async ({page}) => {
  await ready(page, 'sparky');
  await page.getByRole('button', {name: 'Text catalogue', exact: true}).click();
  const facts = page.getByRole('dialog').locator('.fact-grid');
  await expect(facts).toContainText('Not verified');
  await expect(facts).toContainText('Unknown');
  expect(await facts.locator('.unknown').allTextContents()).not.toContain('0');
});

test('invalid links and failed assets remain usable', async ({page}) => {
  await page.route('**/models/ever-ace.json', route => route.abort());
  await page.goto('#/vessel/not-a-ship?explode=NaN');
  await expect(page.getByText('Vessel assets unavailable')).toBeVisible();
  await page.getByRole('button', {name: 'Text catalogue', exact: true}).click();
  await expect(page.getByRole('dialog')).toContainText('Ever Ace');
});

test('record local browser frame cadence in idle, orbit, exploded, Drive and storm scenes', async ({page}, testInfo) => {
  test.setTimeout(45000);
  const vesselId=process.env.HULLSCOPE_PERFORMANCE_VESSEL??'ever-ace';
  expect(fleet.some(v=>v.id===vesselId),'measurement vessel exists').toBe(true);
  const samples = [];
  for (const viewport of [{width: 1440, height: 900}, {width: 390, height: 844}]) {
    await page.setViewportSize(viewport);
    await ready(page, vesselId);
    for (const sceneState of ['idle', 'orbit', 'exploded', 'drive', 'storm']) {
      if (sceneState === 'orbit') await page.getByRole('button', {name: 'Auto orbit', exact: true}).click();
      if (sceneState === 'exploded') {
        await page.getByRole('button', {name: 'Pause orbit', exact: true}).click();
        await page.getByRole('button', {name: 'Exploded', exact: true}).click();
        await page.waitForTimeout(900);
      }
    if(sceneState==='drive'){await page.getByRole('switch',{name:'Drive mode',exact:true}).click();await page.keyboard.down('KeyW');await page.waitForTimeout(1200);}
    if(sceneState==='storm'){await page.getByRole('button',{name:'Storm',exact:true}).click();await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-storm-weather',/"rainVisible":true/);await page.waitForTimeout(2500);}
    const sample = await page.evaluate(async () => {
      const canvas = document.querySelector('canvas')!;
      const gl = canvas.getContext('webgl2')!;
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      const timings: number[] = [];
      await new Promise<void>(resolve => {
        let previous = performance.now();
        const start = previous;
        const frame = (now: number) => {
          timings.push(now - previous);
          previous = now;
          if (now - start >= 2000) resolve(); else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      timings.shift();
      const sorted = [...timings].sort((a, b) => a - b);
      const mean = timings.reduce((sum, value) => sum + value, 0) / timings.length;
      return {
        userAgent: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency,
        devicePixelRatio,
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        samples: timings.length,
        meanFrameMs: Number(mean.toFixed(2)),
        p95FrameMs: Number(sorted[Math.floor(sorted.length * .95)].toFixed(2)),
        browserFramesPerSecond: Number((1000 / mean).toFixed(1)),
        framesOver33ms: timings.filter(time => time > 33.4).length,
      };
    });
    samples.push({viewport, sceneState, ...sample});
    if(sceneState==='drive'){await page.keyboard.up('KeyW');await page.keyboard.press('Escape');}
    if(sceneState==='storm')await page.getByRole('button',{name:'Storm',exact:true}).click();
    }
  }
  const report = {
    measuredAt: new Date().toISOString(),
    vesselId,
    serverMode: process.env.HULLSCOPE_PREVIEW === '1' ? 'production preview' : 'development',
    host: {cpu: cpus()[0].model, platform: platform(), release: release(), architecture: arch()},
    method: 'Two-second requestAnimationFrame cadence in idle, auto orbit, exploded, moving Drive and storm/rain states in local headless Chrome against the local Vite server. Narrow viewport is desktop emulation, not physical mobile hardware. Measures browser frame scheduling; not independent GPU completion timing.',
    samples,
  };
  await testInfo.attach('local-frame-cadence.json', {body: JSON.stringify(report, null, 2), contentType: 'application/json'});
  await mkdir('output/playwright', {recursive: true});
  await writeFile('output/playwright/performance.json', JSON.stringify(report, null, 2));
  expect(samples.every(sample => Number.isFinite(sample.browserFramesPerSecond) && sample.samples > 0)).toBe(true);
});
