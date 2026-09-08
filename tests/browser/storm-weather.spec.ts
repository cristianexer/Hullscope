import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

const sceneSelector='[data-scene-status]';
const weatherOutput=process.env.HULLSCOPE_BROWSER==='webkit'?'output/playwright/webkit/weather':'output/playwright/weather';
interface Weather {rainVisible:boolean;flash:number;time:number;strikes:number}
async function weather(page:Page):Promise<Weather>{return JSON.parse((await page.locator(sceneSelector).getAttribute('data-storm-weather'))!);}
async function ready(page:Page){
 await page.goto('#/vessel/sparky');
 await expect(page.locator(sceneSelector)).toHaveAttribute('data-loaded','sparky',{timeout:30000});
 await expect(page.locator(sceneSelector)).toHaveAttribute('data-storm-weather',/rainVisible/);
}
async function changedPixels(page:Page,before:Buffer,after:Buffer){
 return page.evaluate(async({before,after})=>{
  const read=async(encoded:string)=>{const image=new Image();image.src=`data:image/png;base64,${encoded}`;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d')!;context.drawImage(image,0,0);return context.getImageData(0,0,canvas.width,canvas.height).data;};
  const a=await read(before),b=await read(after);let count=0;
  for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>15)count++;
  return count;
 },{before:before.toString('base64'),after:after.toString('base64')});
}

for(const viewport of [{width:320,height:568},{width:390,height:844},{width:844,height:390}]){
 test(`storm sound and sea controls remain reachable at ${viewport.width}x${viewport.height}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'no-preference'});await ready(page);
  const controls=page.getByRole('group',{name:'Sea conditions',exact:true});
  await expect(page.getByRole('button',{name:'Storm sound',exact:true})).toHaveCount(0);
  await controls.getByRole('button',{name:'Storm',exact:true}).click();
  await expect.poll(async()=>(await weather(page)).rainVisible).toBe(true);
  for(const label of ['Ocean','Waves','Storm','Storm sound']){
   const button=controls.getByRole('button',{name:label,exact:true});await expect(button).toBeVisible();
   expect(await button.evaluate(element=>{const r=element.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&(hit===element||element.contains(hit));}),label).toBe(true);
  }
  const sound=page.getByRole('button',{name:'Storm sound',exact:true});await expect(sound).toHaveAttribute('aria-pressed','true');
  if(viewport.width===390){const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(scan.violations).toEqual([]);}
  await sound.click();await expect(sound).toHaveAttribute('aria-pressed','false');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await testInfo.attach('storm-controls',{body:await page.screenshot(),contentType:'image/png'});
  await controls.getByRole('button',{name:'Waves',exact:true}).click();
  await expect.poll(async()=>(await weather(page)).rainVisible).toBe(false);
  await expect(sound).toHaveCount(0);await expect(controls.getByRole('button',{name:'Storm',exact:true})).toHaveAttribute('aria-pressed','false');
 });
}

test('storm produces rain and repeated real lightning, while water off and reduced motion suppress weather',{tag:'@smoke'},async({page},testInfo)=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.addInitScript(()=>{
  const events:{distance:number}[]=[];const flashes:{peak:number;strikes:{count:number;time:number}[]}={peak:0,strikes:[]};Object.assign(window,{weatherEvents:events,weatherFlashes:flashes});
  new MutationObserver(records=>{for(const record of records){const raw=(record.target as Element).getAttribute('data-storm-weather');if(raw){const value=JSON.parse(raw);flashes.peak=Math.max(flashes.peak,value.flash);if(value.strikes>0&&value.strikes!==(flashes.strikes.at(-1)?.count??0))flashes.strikes.push({count:value.strikes,time:value.time});}}}).observe(document,{subtree:true,attributes:true,attributeFilter:['data-storm-weather']});
  window.addEventListener('hullscope-lightning',event=>events.push((event as CustomEvent<{distance:number}>).detail));
 });
 await ready(page);await page.getByRole('button',{name:'Storm',exact:true}).click();
 await expect.poll(async()=>(await weather(page)).rainVisible).toBe(true);
 const start=await weather(page);
 await expect.poll(async()=>(await weather(page)).time).toBeGreaterThan(start.time);
 await expect.poll(async()=>(await weather(page)).strikes,{timeout:process.env.CI?120000:25000,intervals:[50,100,150]}).toBeGreaterThanOrEqual(2);
 const events=await page.evaluate(()=>(window as Window&{weatherEvents?:{distance:number}[]}).weatherEvents!);
 expect(events.length).toBeGreaterThanOrEqual(2);expect(events[0].distance).toBeGreaterThanOrEqual(350);
 const flashes=await page.evaluate(()=>(window as Window&{weatherFlashes?:{peak:number;strikes:{count:number;time:number}[]}}).weatherFlashes!);
 expect(flashes.strikes[0].time).toBeGreaterThanOrEqual(3.5);expect(flashes.strikes[0].time).toBeLessThan(4);
 const interval=flashes.strikes[1].time-flashes.strikes[0].time;expect(interval).toBeGreaterThanOrEqual(5.8);expect(interval).toBeLessThan(11.3);
 await expect.poll(()=>page.evaluate(()=>(window as Window&{weatherFlashes?:{peak:number}}).weatherFlashes!.peak),{intervals:[25,50]}).toBeGreaterThan(.01);
 await testInfo.attach('lightning',{body:await page.screenshot(),contentType:'image/png'});
 await page.getByRole('button',{name:'Ocean',exact:true}).click();
 await expect.poll(async()=>(await weather(page)).rainVisible).toBe(false);
 await page.getByRole('button',{name:'Ocean',exact:true}).click();
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect.poll(async()=>(await weather(page)).rainVisible).toBe(false);
 await expect.poll(async()=>(await weather(page)).flash).toBe(0);
 const frozen=await weather(page);await page.waitForTimeout(400);expect(await weather(page)).toEqual(frozen);
});

test('storm ambient audio has a real signal and muting stops loops and delayed thunder',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.addInitScript(()=>{
  const calls:{kind:string;when:number;now:number;loop:boolean}[]=[],meters:AnalyserNode[]=[];
  Object.assign(window,{audioCalls:calls,audioMeters:meters});
  const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop,connect=AudioNode.prototype.connect,oscillatorStop=OscillatorNode.prototype.stop;
  AudioBufferSourceNode.prototype.start=function(when=0,offset=0,duration?:number){calls.push({kind:'start',when,now:this.context.currentTime,loop:this.loop});if(duration===undefined)start.call(this,when,offset);else start.call(this,when,offset,duration);};
  AudioBufferSourceNode.prototype.stop=function(when=0){calls.push({kind:'stop',when,now:this.context.currentTime,loop:this.loop});stop.call(this,when);};
  OscillatorNode.prototype.stop=function(when=0){calls.push({kind:'oscillator-stop',when,now:this.context.currentTime,loop:false});oscillatorStop.call(this,when);};
  AudioNode.prototype.connect=function(...args:unknown[]){
   const result=Reflect.apply(connect,this,args);
   // Observe each real destination-bound signal without changing its audible path.
   if(args[0] instanceof AudioDestinationNode){const meter=this.context.createAnalyser();meter.fftSize=2048;Reflect.apply(connect,this,[meter]);meters.push(meter);}
   return result;
  };
 });
 await ready(page);await page.getByRole('button',{name:'Storm',exact:true}).click();
 const calls=()=>page.evaluate(()=>(window as Window&{audioCalls?:{kind:string;when:number;now:number;loop:boolean}[]}).audioCalls!);
 await expect.poll(async()=>(await calls()).filter(c=>c.kind==='start'&&c.loop).length).toBe(2);
 await expect.poll(()=>page.evaluate(()=>{
  const meters=(window as Window&{audioMeters?:AnalyserNode[]}).audioMeters!;
  return meters.filter(meter=>{const data=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length)>.00001;}).length;
 })).toBeGreaterThanOrEqual(2);
 // Exercise the public weather event at a known distance, retaining real AudioContext methods.
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('hullscope-lightning',{detail:{distance:343}})));
 await expect.poll(async()=>(await calls()).filter(c=>c.kind==='start'&&!c.loop).length).toBe(1);
 const started=(await calls()).find(c=>c.kind==='start'&&!c.loop)!;expect(started.when-started.now).toBeCloseTo(1,1);
 await page.getByRole('button',{name:'Storm sound',exact:true}).click();
 await expect.poll(async()=>(await calls()).filter(c=>c.kind==='stop'&&c.loop&&c.when===0).length).toBe(2);
 await expect.poll(async()=>(await calls()).some(c=>c.kind==='stop'&&!c.loop&&c.when===0)).toBe(true);
 await expect.poll(async()=>(await calls()).some(c=>c.kind==='oscillator-stop'&&c.when===0)).toBe(true);
 const count=(await calls()).filter(c=>c.kind==='start').length;
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('hullscope-lightning',{detail:{distance:343}})));
 expect((await calls()).filter(c=>c.kind==='start').length).toBe(count);
});

test('ocean remains visibly rendered at near, fitted and far camera distances',async({page},testInfo)=>{
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|webgl|program/i.test(m.text()))errors.push(m.text());});
 await mkdir(weatherOutput,{recursive:true});
 for(const condition of ['calm','storm']){
 if(condition==='storm')await page.getByRole('button',{name:'Storm',exact:true}).click();
 const distances:number[]=[];
 for(const preset of ['near','fitted','far']){
  await page.getByRole('button',{name:'Fit whole vessel',exact:true}).click();
  if(preset!=='fitted')for(let i=0;i<3;i++)await page.getByRole('button',{name:preset==='near'?'Zoom in':'Zoom out',exact:true}).click();
  const water=page.getByRole('button',{name:'Ocean',exact:true});
  await expect(water).toHaveAttribute('aria-pressed','true');
  const canvas=page.locator('canvas');const on=await canvas.screenshot();
  const camera=JSON.parse((await page.locator(sceneSelector).getAttribute('data-camera-state'))!);
  distances.push(Math.hypot(...camera.position.map((v:number,i:number)=>v-camera.target[i])));
  await page.screenshot({path:`${weatherOutput}/${condition}-${preset}.png`});
  await water.click();await expect(water).toHaveAttribute('aria-pressed','false');const off=await canvas.screenshot();
  expect(await changedPixels(page,on,off),`${condition} ${preset} ocean changes rendered pixels`).toBeGreaterThan(500);
  await testInfo.attach(`${condition}-${preset}`,{body:on,contentType:'image/png'});await water.click();
 }
 expect(distances[0]).toBeLessThan(distances[1]*.7);expect(distances[2]).toBeGreaterThan(distances[1]*1.5);
 }
 expect(errors).toEqual([]);
});
