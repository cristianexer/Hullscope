import { test, expect, type Page, type Locator } from '@playwright/test';
import { fleet } from '../../src/data/fleet';
import { openSystems, chooseOption } from './helpers';
import { isSoftwareRenderer } from '../../src/viewer/renderQuality';

async function ready(page: Page, vessel = 'ever-ace') {
  await page.goto(`#/vessel/${vessel}`);
  await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded', vessel, {timeout: 30000});
  await page.waitForTimeout(400);
}
async function selectWheelhouse(page: Page) {
  await openSystems(page);
  await page.getByLabel('Find a component', {exact: true}).fill('Wheelhouse');
  await page.locator('.component-row').first().click();
  await expect(page.locator('.component-card h2')).toContainText('Wheelhouse');
}
async function unobstructed(locator: Locator) {
  await expect(locator).toBeVisible();
  expect(await locator.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const target = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    return target === element || element.contains(target);
  }), `${await locator.getAttribute('aria-label') ?? await locator.textContent()} receives pointer input`).toBe(true);
}

test('renderer tier and responsive LOD preserve the selected physical component', async ({page}) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'reduce'});
  await ready(page);
  const renderer = await page.locator('canvas').evaluate(canvas => {
    const gl = (canvas as HTMLCanvasElement).getContext('webgl2')!;
    const extension = gl.getExtension('WEBGL_debug_renderer_info');
    return extension ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : '';
  });
  const software = isSoftwareRenderer(renderer);
  const scene = page.locator('[data-scene-status]');
  await expect(scene).toHaveAttribute('data-renderer-tier',software?'compatibility':'enhanced');
  await expect(scene).toHaveAttribute('data-loaded-lod',software?'0':'1');
  await selectWheelhouse(page);
  const selectedPart = () => page.evaluate(() => new URLSearchParams(location.hash.split('?')[1]).get('part'));
  await expect.poll(selectedPart).toBeTruthy();
  const part = await selectedPart();
  for (const viewport of [{width:390,height:844},{width:1440,height:1000}]) {
    await page.setViewportSize(viewport);
    await expect(scene).toHaveAttribute('data-renderer-tier',software?'compatibility':viewport.width<=768?'mobile':'enhanced');
    await expect(scene).toHaveAttribute('data-loaded-lod',software||viewport.width<=768?'0':'1');
    await expect(page.locator('.component-card h2')).toContainText('Wheelhouse');
    expect(await selectedPart()).toBe(part);
    expect(await page.locator('canvas').evaluate(canvas => {
      const element=canvas as HTMLCanvasElement, bounds=element.getBoundingClientRect();
      return element.width/bounds.width;
    })).toBeLessThanOrEqual(software?.81:viewport.width<=768?1.26:1.61);
  }
});

for (const viewport of [{width: 1920, height: 1080}, {width: 390, height: 844}]) {
  test(`every knowledge mode replaces a selected component at ${viewport.width}px`, async ({page}) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({reducedMotion: 'reduce'});
    await ready(page);
    for (const mode of ['Explore', 'Performance', 'Risk']) {
      if (await page.getByRole('button', {name: 'Close inspector'}).isVisible()) await page.getByRole('button', {name: 'Close inspector'}).click();
      await selectWheelhouse(page);
      const tab = page.getByRole('button', {name: mode, exact: true});
      await unobstructed(tab);
      await tab.click();
      await expect(tab).toHaveAttribute('aria-pressed', 'true');
      await expect(tab.locator('svg')).toBeVisible();
      await expect(page.locator('.component-card')).toHaveCount(0);
      const headings: Record<string, string> = {Performance: 'Energy & availability', Risk: 'Failure & exposure'};
      if (headings[mode]) await expect(page.locator('.inspector h2')).toHaveText(headings[mode]);
      else {
        await expect(page.locator('.inspector')).toHaveCount(0);
        await expect(page.getByRole('button',{name:'Explore',exact:true})).toHaveAttribute('aria-pressed','true');
      }
      await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '0');
    }
  });
  test(`slider visibly fills zero, half and all of its track at ${viewport.width}px`, async ({page}) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({reducedMotion: 'reduce'});
    await ready(page);
    const slider = page.getByRole('slider', {name: 'Disassembly amount'});
    for (const value of [0, 50, 100]) {
      await slider.focus();
      await page.keyboard.press('Home');
      if (value === 50) for (let i = 0; i < 5; i++) await page.keyboard.press('PageUp');
      if (value === 100) await page.keyboard.press('End');
      await expect(slider).toHaveAttribute('aria-valuenow', String(value));
      const ratio = await page.locator('.disassembly-track').evaluate(track => {
        const range = track.querySelector('.disassembly-range')!;
        return range.getBoundingClientRect().width / track.getBoundingClientRect().width;
      });
      expect(ratio).toBeCloseTo(value / 100, 2);
      await expect(page.getByRole('status', {name: 'Disassembly percentage'})).toHaveText(`${value}%`);
    }
  });
}

for (const viewport of [{width:320,height:568},{width:390,height:844},{width:768,height:1024},{width:1024,height:768},{width:1280,height:800},{width:1440,height:900},{width:1920,height:1080},{width:844,height:390}]) {
  test(`long vessel titles preserve whole words with panels open at ${viewport.width}x${viewport.height}`, async ({page}) => {
    test.setTimeout(60000);
    await page.setViewportSize(viewport);
    await page.emulateMedia({reducedMotion: 'reduce'});
    for (const vessel of ['hms-defender', 'sir-david-attenborough', 'christophe-de-margerie']) {
      await ready(page, vessel);
      if(viewport.width<=900){
        const title=page.locator('.mobile-vessel-title h1');await expect(title).toBeVisible();
        await expect.poll(()=>title.evaluate(element=>parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(18);
        const bounds=await title.boundingBox();expect(bounds!.width).toBeGreaterThan(80);expect(bounds!.height).toBeGreaterThanOrEqual(20);
      }
      await selectWheelhouse(page);
      const menu = page.getByRole('button', {name: 'Open anatomy browser', exact: true});
      if (await menu.isVisible()) await menu.click();
      // Panel changes trigger a ResizeObserver font fit; inspect the settled layout.
      await expect.poll(() => page.locator('.vessel-title-word').evaluateAll(elements => elements.every(element => {
        const word = element.getBoundingClientRect(), heading = element.closest('h1')!.getBoundingClientRect();
        if (word.width === 0 || word.right <= 0 || word.left >= innerWidth) return true;
        return word.left >= heading.left - 1 && word.right <= heading.right + 1;
      })), {timeout: 1000, message: 'whole title words fit after panel layout settles'}).toBe(true);
      const words = await page.locator('.vessel-title-word').evaluateAll(elements => elements.filter(element => {
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && bounds.right > 0 && bounds.left < innerWidth && getComputedStyle(element).visibility !== 'hidden';
      }).map(element => {
        const word = element.getBoundingClientRect(), heading = element.closest('h1')!.getBoundingClientRect();
        return {text: element.textContent, rects: element.getClientRects().length, left:word.left, right:word.right, headingLeft:heading.left, headingRight:heading.right, whiteSpace:getComputedStyle(element).whiteSpace};
      }));
      expect(words.length).toBeGreaterThan(0);
      for (const word of words) {
        expect(word.whiteSpace, word.text!).toBe('nowrap');
        expect(word.rects, word.text!).toBe(1);
        expect(word.left, word.text!).toBeGreaterThanOrEqual(word.headingLeft - 1);
        expect(word.right, word.text!).toBeLessThanOrEqual(word.headingRight + 1);
        expect(word.right, word.text!).toBeLessThanOrEqual(viewport.width + 1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });
}

for (const width of [1024, 1280]) {
  test(`inspector leaves view and disassembly controls clickable at ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height: 800});
    await page.emulateMedia({reducedMotion: 'reduce'});
    await ready(page, 'hms-defender');
    await selectWheelhouse(page);
    for (const view of ['Exterior', 'X-ray', 'Cutaway', 'Exploded']) {
      const button = page.getByRole('button', {name:view,exact:true});
      await unobstructed(button);
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
    }
    for (const mode of ['Explore','Performance','Risk']) await unobstructed(page.getByRole('button', {name:mode,exact:true}));
    await unobstructed(page.getByRole('slider'));
    for (const name of ['Labels', 'Ocean', 'System links']) {
      const button = page.getByRole('button', {name,exact:true});
      await unobstructed(button);
      const previous = await button.getAttribute('aria-pressed');
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', previous === 'true' ? 'false' : 'true');
    }
    await unobstructed(page.getByRole('button', {name:'Reset view',exact:true}));
    await page.getByRole('button',{name:'Risk',exact:true}).click();
    await page.waitForTimeout(400);
    await page.screenshot({path:`output/playwright/tablet-inspector/${width}.png`});
  });
}

test('ocean toggle visibly changes canvas pixels without shader errors', async ({page}, testInfo) => {
  const errors: string[] = [];
  page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({reducedMotion: 'reduce'});
  await ready(page);
  const labels = page.getByRole('button', {name:'Labels',exact:true});
  if (await labels.getAttribute('aria-pressed') === 'true') await labels.click();
  const ocean = page.getByRole('button', {name:'Ocean',exact:true});
  if (await ocean.getAttribute('aria-pressed') !== 'true') await ocean.click();
  await page.waitForTimeout(250);
  const on = await page.locator('canvas').screenshot();
  await ocean.click();
  await page.waitForTimeout(250);
  const off = await page.locator('canvas').screenshot();
  const changed = await page.evaluate(async ({on,off}) => {
    const decode = async (encoded:string) => {
      const image = new Image(); image.src = `data:image/png;base64,${encoded}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width=image.width; canvas.height=image.height;
      const context=canvas.getContext('2d')!; context.drawImage(image,0,0);
      return context.getImageData(0,0,image.width,image.height).data;
    };
    const a=await decode(on), b=await decode(off); let changed=0;
    for(let i=0;i<a.length;i+=4) if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>15) changed++;
    return changed/(a.length/4);
  }, {on:on.toString('base64'),off:off.toString('base64')});
  expect(changed, 'ocean changes at least 3% of canvas pixels').toBeGreaterThan(.03);
  expect(errors).toEqual([]);
  await testInfo.attach('ocean-on.png',{body:on,contentType:'image/png'});
  await testInfo.attach('ocean-off.png',{body:off,contentType:'image/png'});
});

test('Sparky comparison defaults to a different vessel and loads both at shared scale', async ({page}) => {
  await ready(page,'sparky');
  await page.getByRole('button',{name:'Compare vessels',exact:true}).click();
  const second=page.getByRole('combobox',{name:'Second vessel',exact:true});
  const selectedText=await second.innerText();
  const target=fleet.find(vessel=>selectedText.includes(vessel.name))?.id ?? '';
  expect(target).not.toBe('sparky');
  expect(target).not.toBe('');
  await page.getByRole('button',{name:'Explore at shared scale',exact:true}).click();
  await expect(page.locator('.compare-overlay')).toContainText('Sparky');
  await expect(page.locator('.compare-overlay')).toContainText('Ever Ace');
  await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded','sparky');
  await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-compared-loaded',target,{timeout:30000});
});

test('mobile slash shortcut opens and focuses the component search without hijacking typing', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await ready(page);
  await page.getByRole('button',{name:'Risk',exact:true}).click();
  await page.keyboard.press('/');
  const search=page.getByRole('textbox',{name:'Find a component',exact:true});
  await expect(search).toBeVisible();
  await expect(search).toBeFocused();
  await expect(page.getByRole('button',{name:'Explore',exact:true})).toHaveAttribute('aria-pressed','true');
  await search.fill('battery');
  await page.keyboard.press('/');
  await expect(search).toHaveValue('battery/');
});

test(`all ${fleet.length} vessels can be visited serially without stale state or disposed geometry`, {tag:'@smoke'}, async ({page},testInfo) => {
  test.setTimeout(process.env.CI?600000:120000);
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.emulateMedia({reducedMotion:'reduce'});
  await ready(page);
  await page.getByRole('button',{name:'Labels',exact:true}).click();
  await selectWheelhouse(page);
  for(let i=1;i<=fleet.length;i++) {
    const vessel=fleet[i%fleet.length];
    await page.getByRole('button',{name:'Next vessel',exact:true}).click();
    await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded',vessel.id,{timeout:30000});
    await expect(page.locator('.component-card')).toHaveCount(0);
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow','0');
    await page.waitForTimeout(300);
    const ids=await page.locator('.scene-label').evaluateAll(labels=>labels.map(label=>label.getAttribute('data-component-id')));
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every(id=>id?.startsWith(vessel.id+'.'))).toBe(true);
  }
  await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded','ever-ace');
  const timing=await page.evaluate(async()=>{
    const intervals:number[]=[];
    await new Promise<void>(resolve=>{
      let previous=performance.now();const start=previous;
      const frame=(now:number)=>{intervals.push(now-previous);previous=now;if(now-start>=1500)resolve();else requestAnimationFrame(frame);};
      requestAnimationFrame(frame);
    });
    intervals.shift();return{samples:intervals.length,browserFramesPerSecond:1000/(intervals.reduce((sum,n)=>sum+n,0)/intervals.length)};
  });
  await testInfo.attach('post-navigation-cadence.json',{body:JSON.stringify(timing,null,2),contentType:'application/json'});
  expect(timing.samples).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});


test('interior selection reveals X-ray and preserves an already chosen cutaway', async ({page}) => {
  await ready(page);
  const search=page.getByLabel('Find a component',{exact:true});
  await search.fill('Cylinder 1 piston crown');
  await page.locator('.component-row').first().click();
  await expect(page.locator('.component-card h2')).toHaveText('Cylinder 1 piston crown');
  await expect(page.getByRole('button',{name:'X-ray',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Cutaway',exact:true}).click();
  await search.fill('Cylinder 2 piston crown');
  await page.locator('.component-row').first().click();
  await expect(page.locator('.component-card h2')).toHaveText('Cylinder 2 piston crown');
  await expect(page.getByRole('button',{name:'Cutaway',exact:true})).toHaveAttribute('aria-pressed','true');
});

for(const action of ['close','escape','background']) {
  test(`clearing component selection via ${action} preserves assembly disassembly until Reset`,async({page})=>{
    await ready(page);
    await selectWheelhouse(page);
    await chooseOption(page,'Disassembly scope','Selected assembly');
    await page.getByRole('slider').focus();
    await page.keyboard.press('End');
    if(action==='close') await page.getByRole('button',{name:'Close inspector',exact:true}).click();
    if(action==='escape') await page.keyboard.press('Escape');
    if(action==='background') {const canvas=await page.locator('canvas').boundingBox();await page.mouse.click(canvas!.x+8,canvas!.y+8);}
    await expect(page.locator('.component-card')).toHaveCount(0);
    await expect(page.getByRole('combobox',{name:'Disassembly scope',exact:true})).toContainText('Selected assembly');
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow','100');
    await expect(page.getByRole('button',{name:'Exploded',exact:true})).toHaveAttribute('aria-pressed','true');
    await page.getByRole('button',{name:'Reset view',exact:true}).click();
    await expect(page.getByRole('combobox',{name:'Disassembly scope',exact:true})).toContainText('Whole vessel');
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow','0');
    await expect(page.getByRole('button',{name:'Exterior',exact:true})).toHaveAttribute('aria-pressed','true');
  });
}

test('selecting a hidden component reveals its system, and tours clear hidden systems',async({page})=>{
  await ready(page);
  await page.getByRole('button',{name:'Hide Hull & structure',exact:true}).click();
  await expect(page.getByRole('button',{name:'Show Hull & structure',exact:true})).toBeVisible();
  await page.getByLabel('Find a component',{exact:true}).fill('Watertight bulkhead 1');
  await page.locator('.component-row').first().click();
  await expect(page.locator('.component-card h2')).toHaveText('Watertight bulkhead 1');
  await page.getByLabel('Find a component',{exact:true}).fill('');
  await expect(page.getByRole('button',{name:'Hide Hull & structure',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Hide Propulsion & steering',exact:true}).click();
  await page.getByRole('button',{name:'Guided tour',exact:true}).click();
  await expect(page.getByRole('button',{name:'Hide Propulsion & steering',exact:true})).toBeVisible();
  await expect(page.locator('.tour-card')).toContainText('1 OF 5');
});

test('mobile anatomy control remains usable above an open component inspector',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await ready(page);
  await selectWheelhouse(page);
  const opener=page.getByRole('button',{name:'Open anatomy browser',exact:true});
  await unobstructed(opener);
  await opener.click();
  await expect(page.locator('.component-card')).toHaveCount(0);
  await expect(page.getByLabel('Find a component',{exact:true})).toBeVisible();
  await unobstructed(page.getByLabel('Find a component',{exact:true}));
});

test('system links reveal a hidden system and remain available with reduced motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await ready(page);
  await page.getByRole('button',{name:'Hide Propulsion & steering',exact:true}).click();
  await page.getByRole('button',{name:'System links',exact:true}).click();
  await expect(page.getByRole('button',{name:'Hide Propulsion & steering',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'X-ray',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'System links',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'System links',exact:true}).click();
  await expect(page.getByRole('button',{name:'X-ray',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('closing an evidence dialog preserves the inspected component underneath',async({page})=>{
  await ready(page);
  await selectWheelhouse(page);
  await page.getByRole('button',{name:'View evidence',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.component-card h2')).toHaveText('Wheelhouse');
});

test('an external vessel hash is not overwritten by pending selection serialization',async({page})=>{
 await ready(page);await selectWheelhouse(page);
 await page.evaluate(()=>{location.hash='#/vessel/sparky';});
 await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded','sparky',{timeout:30000});
 await expect(page).toHaveURL(/#\/vessel\/sparky/);
 await page.evaluate(()=>{location.hash='#/vessel/hms-defender';location.hash='#/vessel/sir-david-attenborough';});
 await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded','sir-david-attenborough',{timeout:30000});
 await expect(page).toHaveURL(/#\/vessel\/sir-david-attenborough/);
});

test('system links draw a visible diagram in assembled and exploded propulsion',async({page},testInfo)=>{
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
 const ocean=page.getByRole('button',{name:'Ocean',exact:true});if(await ocean.getAttribute('aria-pressed')==='true')await ocean.click();
 await page.getByRole('button',{name:'X-ray',exact:true}).click();
 for(const amount of [0,65]){
  if(amount){await page.getByRole('slider').focus();await page.keyboard.press('Home');for(let i=0;i<6;i++)await page.keyboard.press('PageUp');for(let i=0;i<5;i++)await page.keyboard.press('ArrowRight');}
  await page.waitForTimeout(1000);const off=await page.locator('canvas').screenshot();
  await page.getByRole('button',{name:'System links',exact:true}).click();await page.waitForTimeout(400);
  const on=await page.locator('canvas').screenshot();
  const changed=await page.evaluate(async({on,off})=>{
   const pixels=async(data:string)=>{const img=new Image();img.src=`data:image/png;base64,${data}`;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const context=canvas.getContext('2d')!;context.drawImage(img,0,0);return context.getImageData(0,0,img.width,img.height).data;};
   const a=await pixels(on),b=await pixels(off);let count=0;for(let i=0;i<a.length;i+=4)if(a[i+1]>180&&a[i+2]>210&&a[i]<210&&a[i+2]-a[i]>30&&Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>30)count++;return count;
  },{on:on.toString('base64'),off:off.toString('base64')});
  expect(changed,'new bright cyan diagram pixels, excluding dark animated water').toBeGreaterThan(100);
  await testInfo.attach(`system-links-${amount}-pixel-count`,{body:String(changed),contentType:'text/plain'});
  await page.screenshot({path:`output/playwright/system-links-${amount}.png`});
  await page.getByRole('button',{name:'System links',exact:true}).click();
 }
});
