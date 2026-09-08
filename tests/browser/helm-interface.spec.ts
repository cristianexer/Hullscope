import {test,expect,type Page} from '@playwright/test';
import {openSystems,chooseOption} from './helpers';
async function ready(page:Page){await page.goto('#/vessel/sparky');await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded','sparky',{timeout:30000});}
async function viewportFits(page:Page){expect(await page.evaluate(()=>({x:document.documentElement.scrollWidth<=innerWidth,y:document.documentElement.scrollHeight<=innerHeight}))).toEqual({x:true,y:true});}
for(const width of [320,390,1024,1920]){
 test(`three knowledge modes, collapsible systems and themed options work at ${width}px`,{tag:width===390?'@smoke':[]},async({page})=>{
  await page.setViewportSize({width,height:width===320?568:900});await ready(page);
  for(const name of ['Explore','Performance','Risk'])await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
  for(const name of ['Anatomy','Operations'])await expect(page.getByRole('button',{name,exact:true})).toHaveCount(0);
  await openSystems(page);const section=page.getByRole('button',{name:'Ship systems',exact:true});
  await section.click();await expect(section).toHaveAttribute('aria-expanded','false');await expect(page.getByLabel('Find a component',{exact:true})).toBeHidden();
  await section.click();await expect(page.getByLabel('Find a component',{exact:true})).toBeVisible();
  if(width<=900)await page.getByRole('complementary',{name:'Vessel anatomy'}).getByRole('button',{name:'Close anatomy browser',exact:true}).click();
  const camera=page.getByRole('combobox',{name:'Camera viewpoint',exact:true});
  if(await camera.isVisible()){
   await camera.click();const menu=page.getByRole('listbox');await expect(menu).toBeVisible();await page.screenshot({path:`output/playwright/helm/dropdown-${width}.png`});
   expect(await menu.evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe('rgb(255, 255, 255)');
   const bounds=await menu.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width+1);
   await page.getByRole('option',{name:'Stern',exact:true}).click();await expect(camera).toContainText('Stern');
   await chooseOption(page,'Camera viewpoint','Three-quarter');
  }
  await page.screenshot({path:`output/playwright/helm/ui-${width}.png`});await viewportFits(page);
 });
}
test('labels begin hidden and retain their component name when selected',async({page})=>{
 await ready(page);const toggle=page.getByRole('button',{name:'Labels',exact:true});await expect(toggle).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('.scene-label:visible')).toHaveCount(0);await toggle.click();
 const label=page.locator('.scene-label:visible').first();await expect(label).toBeVisible();
 const id=await label.getAttribute('data-component-id'),text=(await label.textContent())!;await label.click();
 await expect(page.locator(`.scene-label[data-component-id="${id}"]`)).toHaveText(text);
 await expect(page.locator('.component-card')).toBeVisible();
});
test('keyboard helm input moves and turns the vessel, stops and restores inspection',{tag:'@smoke'},async({page})=>{
 await ready(page);const toggle=page.getByRole('switch',{name:'Drive mode',exact:true});await toggle.click();await expect(toggle).toHaveAttribute('aria-checked','true');
 await expect(page.getByRole('region',{name:'Drive controls'})).toBeVisible();await expect(page.getByRole('button',{name:'Compare vessels',exact:true})).toBeDisabled();
 await page.keyboard.down('KeyW');await expect.poll(async()=>Number(await page.locator('[data-drive-speed]').innerText())).toBeGreaterThan(.5);
 await page.keyboard.down('KeyA');await expect.poll(async()=>Math.abs(Number(await page.locator('[data-scene-status]').getAttribute('data-drive-heading')))).toBeGreaterThan(.005);
 await expect.poll(async()=>Number(await page.locator('[data-drive-heading-output]').innerText())).toBeGreaterThan(180);
 await page.keyboard.up('KeyA');await page.keyboard.up('KeyW');
 const position=JSON.parse((await page.locator('[data-scene-status]').getAttribute('data-drive-position'))!);expect(Math.hypot(...position)).toBeGreaterThan(.05);
 await page.keyboard.press('Space');await expect(page.locator('[data-drive-speed]')).toHaveText('0.0');await expect(page.locator('[data-drive-throttle]')).toHaveText('0');
 await page.keyboard.press('Escape');await expect(toggle).toHaveAttribute('aria-checked','false');await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-drive-position','[0,0]');
 await expect(page.getByRole('slider',{name:'Disassembly amount'})).toBeVisible();
});
test('320px touch helm controls move the ship without overflowing',async({page})=>{
 await page.setViewportSize({width:320,height:568});await ready(page);await page.getByRole('switch',{name:'Drive mode',exact:true}).click();
 for(const name of ['Ahead','Astern','Port','Starboard','Stop']){const button=page.getByRole('button',{name,exact:true});await expect(button).toBeVisible();const b=await button.boundingBox();expect(b!.x).toBeGreaterThanOrEqual(0);expect(b!.x+b!.width).toBeLessThanOrEqual(321);expect(b!.y+b!.height).toBeLessThanOrEqual(569);}
 const ahead=page.getByRole('button',{name:'Ahead',exact:true});const b=await ahead.boundingBox();await page.mouse.move(b!.x+b!.width/2,b!.y+b!.height/2);await page.mouse.down();
 await expect.poll(async()=>Number(await page.locator('[data-drive-speed]').innerText())).toBeGreaterThan(.3);await page.mouse.up();
 const port=await page.getByRole('button',{name:'Port',exact:true}).boundingBox();await page.mouse.move(port!.x+port!.width/2,port!.y+port!.height/2);await page.mouse.down();
 await expect.poll(async()=>Number(await page.locator('[data-scene-status]').getAttribute('data-drive-heading'))).toBeGreaterThan(.005);await page.mouse.up();
 await page.screenshot({path:'output/playwright/helm/drive-320.png'});await page.getByRole('button',{name:'Stop',exact:true}).click();await expect(page.locator('[data-drive-speed]')).toHaveText('0.0');await viewportFits(page);
 await page.getByRole('switch',{name:'Drive mode',exact:true}).click();await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-drive-position','[0,0]');
});

for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1920,height:1080}]){
 test(`Drive presentation fits tall and wide vessels at ${viewport.width}x${viewport.height}`,async({page})=>{
  test.setTimeout(60000);await page.setViewportSize(viewport);
  for(const vessel of ['sparky','icon-of-the-seas','sleipnir','hms-defender']){
   await page.goto(`#/vessel/${vessel}`);await expect(page.locator('[data-scene-status]')).toHaveAttribute('data-loaded',vessel,{timeout:30000});
   await page.getByRole('switch',{name:'Drive mode',exact:true}).click();await page.waitForTimeout(1300);
   await expect(page.getByRole('region',{name:'Drive controls'})).toBeVisible();await viewportFits(page);
   const region=await page.getByRole('region',{name:'Drive controls'}).boundingBox();expect(region!.y).toBeGreaterThanOrEqual(0);expect(region!.y+region!.height).toBeLessThanOrEqual(viewport.height+1);
   await page.screenshot({path:`output/playwright/helm/${vessel}-drive-${viewport.width}x${viewport.height}.png`});
   await page.getByRole('switch',{name:'Drive mode',exact:true}).click();
  }
 });
}
