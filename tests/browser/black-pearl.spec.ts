import { test, expect, type Page } from '@playwright/test';
import { fleet } from '../../src/data/fleet';
import { openSystems, chooseOption } from './helpers';
import { mkdir } from 'node:fs/promises';
const scene='[data-scene-status]';
async function ready(page:Page,id='black-pearl'){
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`#/vessel/${id}`);
 await expect(page.locator(scene)).toHaveAttribute('data-loaded',id,{timeout:30000});
}
for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
 test(`Black Pearl fictional knowledge and physical selection work at ${viewport.width}px`,{tag:viewport.width===1440?'@smoke':[]},async({page},testInfo)=>{
  await page.setViewportSize(viewport);await ready(page,'ever-ace');
  await page.getByRole('button',{name:'Browse the fleet',exact:true}).click();
  await expect(page.locator('.fleet-toolbar')).toContainText(`${fleet.length} VESSELS`);
  await page.getByLabel('Search fleet',{exact:true}).fill('Black Pearl');await expect(page.locator('.fleet-card')).toHaveCount(1);await page.locator('.fleet-card').click();
  await expect(page.locator(scene)).toHaveAttribute('data-loaded','black-pearl',{timeout:30000});
  await openSystems(page);await page.getByLabel('Find a component',{exact:true}).fill('lower mast');
  const first=page.locator('.component-row').first(),name=(await first.innerText()).trim();await first.click();
  await expect(page.locator('.component-card h2')).toHaveText(name);
  await expect(page.locator('.component-card')).toContainText('not verified film canon');
  // Route serialization is intentionally debounced; wait for the public deep
  // link before reloading instead of racing the 100 ms history update.
  await expect.poll(()=>page.evaluate(()=>new URLSearchParams(location.hash.split('?')[1]).get('part'))).toBeTruthy();
  await page.reload();await expect(page.locator(scene)).toHaveAttribute('data-loaded','black-pearl',{timeout:30000});
  await expect(page.locator('.component-card h2')).toHaveText(name);
  for(const [mode,heading]of [['Performance','Wind, wood & questionable decisions'],['Risk','The risk register has tentacles']]){
   await page.getByRole('button',{name:mode,exact:true}).click();
   await expect(page.locator('.knowledge-body h2')).toHaveText(heading);
   await expect(page.locator('.knowledge-body')).toContainText('Fictional vessel · playful commentary, not maritime or insurance advice.');
   await expect(page.locator('.component-card')).toHaveCount(0);
  }
  await expect(page.locator('.knowledge-body')).toContainText('Kraken concentration risk');
  await expect(page.locator('.knowledge-body')).not.toContainText('SOLAS');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await testInfo.attach('fictional-risk',{body:await page.screenshot(),contentType:'image/png'});
 });
}

test('bonus vessel participates in both navigation wrap directions and shared-scale comparison',async({page})=>{
 await ready(page,'ever-ace');await expect(page.getByRole('button',{name:'Browse the fleet',exact:true})).toContainText(String(fleet.length));
 await page.getByRole('button',{name:'Previous vessel',exact:true}).click();await expect(page.locator(scene)).toHaveAttribute('data-loaded','black-pearl',{timeout:30000});
 await page.getByRole('button',{name:'Next vessel',exact:true}).click();await expect(page.locator(scene)).toHaveAttribute('data-loaded','ever-ace',{timeout:30000});
 await page.getByRole('button',{name:'Previous vessel',exact:true}).click();await expect(page.locator(scene)).toHaveAttribute('data-loaded','black-pearl',{timeout:30000});
 await page.getByRole('button',{name:'Compare vessels',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Second vessel',exact:true})).toContainText('Sparky');
 await page.getByRole('button',{name:'Explore at shared scale',exact:true}).click();
 await expect(page.locator('.compare-overlay')).toContainText('Black Pearl');await expect(page.locator('.compare-overlay')).toContainText('Sparky');
 await expect(page.locator(scene)).toHaveAttribute('data-loaded','black-pearl');await expect(page.locator(scene)).toHaveAttribute('data-compared-loaded','sparky',{timeout:30000});
 await page.getByRole('button',{name:'Close comparison',exact:true}).click();
 await page.getByRole('button',{name:'Guided tour',exact:true}).click();
 await expect(page.locator('.tour-card')).toContainText('Timber hull & framing');
 for(let i=0;i<4;i++)await page.locator('.tour-card').getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.locator('.tour-card')).not.toContainText('radar information');
 await page.getByRole('button',{name:'Finish tour',exact:true}).click();await expect(page.locator('.tour-card')).toHaveCount(0);
});

test('Black Pearl mobile helm describes sail handling and can set and reef canvas',async({page},testInfo)=>{
 await page.setViewportSize({width:320,height:568});await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 await page.getByRole('switch',{name:'Drive mode',exact:true}).click();
 const controls=page.getByRole('region',{name:'Drive controls',exact:true});await expect(controls).toContainText('Illustrative sailing response');await expect(controls).toContainText('Sail power');
 for(const name of ['Set more sail','Reef sails','Port','Starboard','Stop']){
  const button=controls.getByRole('button',{name,exact:true});await expect(button).toBeVisible();
  expect(await button.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight&&(hit===el||el.contains(hit));}),name).toBe(true);
 }
 await page.keyboard.down('KeyW');await expect.poll(async()=>Number(await page.locator('[data-drive-throttle]').innerText())).toBeGreaterThan(20);await page.keyboard.up('KeyW');
 const raised=Number(await page.locator('[data-drive-throttle]').innerText());await page.keyboard.down('KeyS');await expect.poll(async()=>Number(await page.locator('[data-drive-throttle]').innerText())).toBeLessThan(raised);await page.keyboard.up('KeyS');
 expect(Number(await page.locator('[data-drive-throttle]').innerText())).toBeGreaterThanOrEqual(0);
 await testInfo.attach('sailing-helm',{body:await page.screenshot(),contentType:'image/png'});
 await page.keyboard.press('Escape');await expect(page.locator(scene)).toHaveAttribute('data-drive-position','[0,0]');
});


test('Black Pearl close views render original surface details without shader errors',async({page},testInfo)=>{
 await page.setViewportSize({width:1920,height:1080});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|webgl|program/i.test(m.text()))errors.push(m.text());});
 await ready(page);
 const folder=process.env.HULLSCOPE_BROWSER==='webkit'?'output/playwright/webkit/black-pearl':'output/playwright/black-pearl';await mkdir(folder,{recursive:true});
 for(const preset of ['Three-quarter','Port side','Bow']){
  if(preset==='Bow'&&await page.getByRole('button',{name:'Ocean',exact:true}).getAttribute('aria-pressed')==='true')await page.getByRole('button',{name:'Ocean',exact:true}).click();
  await chooseOption(page,'Camera viewpoint',preset);await page.getByRole('button',{name:'Fit whole vessel',exact:true}).click();
  for(let i=0;i<2;i++)await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await testInfo.attach(preset,{body:await page.screenshot({path:`${folder}/${preset.toLowerCase().replaceAll(' ','-')}-close.png`}),contentType:'image/png'});
 }
 expect(errors).toEqual([]);
});
