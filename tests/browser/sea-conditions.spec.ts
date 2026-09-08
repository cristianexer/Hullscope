import { test, expect, type Page } from '@playwright/test';
import { openSystems } from './helpers';
interface HullPose {heave:number;pitch:number;roll:number;active:boolean}
const sceneSelector='[data-scene-status]';
async function pose(page:Page):Promise<HullPose>{return JSON.parse((await page.locator(sceneSelector).getAttribute('data-hull-pose'))!);}
async function ready(page:Page){
 await page.goto('#/vessel/sparky');
 await expect(page.locator(sceneSelector)).toHaveAttribute('data-loaded','sparky',{timeout:30000});
 await expect(page.locator(sceneSelector)).toHaveAttribute('data-hull-pose',/heave/);
}
for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
 test(`sea condition controls move the assembled hull and pause during inspection at ${viewport.width}px`,{tag:viewport.width===390?'@smoke':[]},async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'no-preference'});await ready(page);
  const controls=page.getByRole('group',{name:'Sea conditions',exact:true});
  for(const label of ['Ocean','Waves','Storm']){
   const button=controls.getByRole('button',{name:label,exact:true});await expect(button).toBeVisible();
   expect(await button.evaluate(element=>{
    const r=element.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&(hit===element||element.contains(hit));
   }),`${label} visible and unobstructed`).toBe(true);
  }
  for(const condition of ['Waves','Storm']){
   await controls.getByRole('button',{name:condition,exact:true}).click();
   await expect(page.locator(sceneSelector)).toHaveAttribute('data-sea-state',condition.toLowerCase());
   await expect(controls.getByRole('button',{name:condition,exact:true})).toHaveAttribute('aria-pressed','true');
   const before=await pose(page);
   await expect.poll(async()=>{const after=await pose(page);return after.active&&Math.abs(after.heave-before.heave)+Math.abs(after.pitch-before.pitch)+Math.abs(after.roll-before.roll)>.002;}).toBe(true);
   expect(Object.values(await pose(page)).every(value=>typeof value==='boolean'||Number.isFinite(value))).toBe(true);
  }
  if(viewport.width===1440){
   // Rain must not mask a frozen water shader in this water-specific comparison.
   await controls.getByRole('button',{name:'Waves',exact:true}).click();
   const canvas=page.locator('canvas'),before=await canvas.screenshot();
   const model=JSON.parse((await page.locator(sceneSelector).getAttribute('data-model-bounds'))!) as number[];
   await page.waitForTimeout(400);const after=await canvas.screenshot();
   const changedWaterPixels=await page.evaluate(async({before,after,model})=>{
    const decode=async(encoded:string)=>{const image=new Image();image.src=`data:image/png;base64,${encoded}`;await image.decode();const buffer=document.createElement('canvas');buffer.width=image.width;buffer.height=image.height;const context=buffer.getContext('2d')!;context.drawImage(image,0,0);return{pixels:context.getImageData(0,0,image.width,image.height).data,width:image.width,height:image.height};};
    const a=await decode(before),b=await decode(after);let changed=0;
    for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){
     // Exclude the ship and its moving silhouette; require actual water pixels.
     if(x>=model[0]-30&&x<=model[2]+30&&y>=model[1]-30&&y<=model[3]+30)continue;
     const i=(y*a.width+x)*4;if(Math.abs(a.pixels[i]-b.pixels[i])+Math.abs(a.pixels[i+1]-b.pixels[i+1])+Math.abs(a.pixels[i+2]-b.pixels[i+2])>12)changed++;
    }
    return changed;
   },{before:before.toString('base64'),after:after.toString('base64'),model});
   expect(changedWaterPixels,'water shader visibly advances outside the moving vessel silhouette').toBeGreaterThan(100);
   await controls.getByRole('button',{name:'Storm',exact:true}).click();
  }
  await testInfo.attach('storm-scene',{body:await page.screenshot(),contentType:'image/png'});
  await controls.getByRole('button',{name:'Ocean',exact:true}).click();
  await expect.poll(()=>pose(page)).toEqual({heave:0,pitch:0,roll:0,active:false});
  await controls.getByRole('button',{name:'Ocean',exact:true}).click();
  await openSystems(page);await page.getByLabel('Find a component',{exact:true}).fill('Wheelhouse');await page.locator('.component-row').first().click();
  await expect.poll(()=>pose(page)).toEqual({heave:0,pitch:0,roll:0,active:false});
 });
}

test('reduced motion keeps storm water and hull static',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
 await page.getByRole('group',{name:'Sea conditions',exact:true}).getByRole('button',{name:'Storm',exact:true}).click();
 await expect(page.locator(sceneSelector)).toHaveAttribute('data-sea-state','storm');
 await expect.poll(()=>pose(page)).toEqual({heave:0,pitch:0,roll:0,active:false});
 const before=await page.locator(sceneSelector).getAttribute('data-wave-time');await page.waitForTimeout(350);
 expect(await page.locator(sceneSelector).getAttribute('data-wave-time')).toBe(before);
});
