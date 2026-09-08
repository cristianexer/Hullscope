import { describe, expect, it } from 'vitest';
import { blendSea, createBuoyancy, hullWindLoad, PHYSICS_STEP, sampleHullSupport, sampleSea, sampleWind, SEA_WAVES, seaBlend, stepBuoyancy, stepWindDrift } from '../src/viewer/SeaPhysics';
import { createDriveMotion, stepDrive } from '../src/viewer/Drive';

const tug={length:24.73,beam:13.13,depth:4.8};
const container={length:399.9,beam:61.5,depth:33.2};
const rms=(values:number[])=>Math.sqrt(values.reduce((sum,value)=>sum+value*value,0)/values.length);

describe('shared metres-based sea field',()=>{
 it('analytic surface gradients and vertical velocity agree with independent finite differences',()=>{
  for(const state of ['calm','waves','storm'] as const){
   const blend=seaBlend(state),x=12.4,z=-8.1,t=7.7,h=1e-4;
   const sample=sampleSea(x,z,t,blend);
   expect(sample.gradientX).toBeCloseTo((sampleSea(x+h,z,t,blend).height-sampleSea(x-h,z,t,blend).height)/(2*h),7);
   expect(sample.gradientZ).toBeCloseTo((sampleSea(x,z+h,t,blend).height-sampleSea(x,z-h,t,blend).height)/(2*h),7);
   expect(sample.verticalVelocity).toBeCloseTo((sampleSea(x,z,t+h,blend).height-sampleSea(x,z,t-h,blend).height)/(2*h),7);
  }
 });
 it('Waves exactly preserves the former Storm amplitudes and adds no long-swell energy',()=>{
  expect(SEA_WAVES.map(wave=>wave.amplitude[1])).toEqual([2.2,1.2,.65,.34,.14,.08,0,0]);
  expect(SEA_WAVES.slice(0,6).map(wave=>wave.wavelength)).toEqual([110,64,37,21,12,7]);
 });
 it('sea-state changes increase physical wave energy without changing the deterministic field',()=>{
  const energies=['calm','waves','storm'].map(state=>rms(Array.from({length:240},(_,i)=>sampleSea(i*2.3,-i*.7,i*.11,seaBlend(state as 'calm'|'waves'|'storm')).height)));
  expect(energies[1]).toBeGreaterThan(energies[0]*10);
  expect(energies[2]).toBeGreaterThan(energies[1]*2);
  expect(sampleSea(9,4,5,seaBlend('storm'))).toEqual(sampleSea(9,4,5,seaBlend('storm')));
 });
 it('transitions remain bounded and independent of display frame rate',()=>{
  const advance=(fps:number)=>{const blend=seaBlend('calm');for(let i=0;i<fps*3;i++)blendSea(blend,'storm',1/fps);return blend;};
  const low=advance(30),high=advance(120);
  high.forEach((weight,i)=>{expect(weight).toBeCloseTo(low[i],12);expect(weight).toBeGreaterThanOrEqual(0);expect(weight).toBeLessThanOrEqual(1);});
  expect(high.reduce((sum,x)=>sum+x,0)).toBeCloseTo(1,12);
 });
 it('a long hull averages short waves instead of following a single point like a buoy',()=>{
  const small=[],large=[],smallPitch=[],largePitch=[];
  for(let i=0;i<160;i++){
   const a=sampleHullSupport(tug,0,0,0,i*.5,seaBlend('storm'));
   const b=sampleHullSupport(container,0,0,0,i*.5,seaBlend('storm'));
   small.push(a.heave);large.push(b.heave);smallPitch.push(a.pitch);largePitch.push(b.pitch);
  }
  expect(rms(large)).toBeLessThan(rms(small)*.3);
  expect(rms(largePitch)).toBeLessThan(rms(smallPitch)*.3);
 });
});

describe('damped vessel response',()=>{
 it('converges to static buoyant equilibrium and dissipates free heave/roll/pitch motion',()=>{
  const motion=createBuoyancy();const target={heave:1.2,pitch:.07,roll:-.11};
  for(let i=0;i<30*120;i++)stepBuoyancy(motion,target,tug,PHYSICS_STEP);
  expect(motion.heave).toBeCloseTo(target.heave,5);expect(motion.pitch).toBeCloseTo(target.pitch,5);expect(motion.roll).toBeCloseTo(target.roll,5);
  for(let i=0;i<30*120;i++)stepBuoyancy(motion,{heave:0,pitch:0,roll:0},tug,PHYSICS_STEP);
  for(const value of Object.values(motion))expect(Math.abs(value)).toBeLessThan(1e-5);
 });
 it('fixed substeps give matching response at30,60 and120fps',()=>{
  const advance=(fps:number)=>{const motion=createBuoyancy();for(let i=0;i<fps*5;i++)stepBuoyancy(motion,{heave:1,pitch:.1,roll:.15},tug,1/fps);return motion;};
  const reference=advance(120);
  for(const fps of [30,60])for(const key of Object.keys(reference) as (keyof typeof reference)[])expect(advance(fps)[key]).toBeCloseTo(reference[key],10);
 });
 it('remains bounded and responds to storm waves across small and large vessels',()=>{
  for(const dimensions of [tug,container]){
   const motion=createBuoyancy();let heave=0;
   for(let tick=0;tick<120*20;tick++){
    stepBuoyancy(motion,sampleHullSupport(dimensions,0,0,.4,tick/120,seaBlend('storm')),dimensions,PHYSICS_STEP);
    expect(Number.isFinite(motion.heave)).toBe(true);expect(Math.abs(motion.heave)).toBeLessThan(SEA_WAVES.reduce((sum,wave)=>sum+wave.amplitude[2],0)*1.05);
    const slopeBound=Math.atan(SEA_WAVES.reduce((sum,wave)=>sum+2*Math.PI*wave.amplitude[2]/wave.wavelength,0))+.05;
    expect(Math.abs(motion.pitch)).toBeLessThan(slopeBound);expect(Math.abs(motion.roll)).toBeLessThan(slopeBound);
    heave=Math.max(heave,Math.abs(motion.heave));
   }
   expect(heave).toBeGreaterThan(.02);
  }
 });
 it('clamps suspension gaps instead of injecting a large destabilising impulse',()=>{
  const normal=createBuoyancy(),paused=createBuoyancy(),target={heave:2,pitch:.2,roll:-.1};
  stepBuoyancy(normal,target,tug,.1);stepBuoyancy(paused,target,tug,30);
  expect(paused).toEqual(normal);
 });
});

describe('real-time propulsion and drag',()=>{
 it('12knots covers the same physical distance for different displayed hull scales',()=>{
  for(const length of [24.73,100,399.9]){
   const motion=createDriveMotion();motion.speed=12;motion.throttle=1;
   for(let i=0;i<120;i++)stepDrive(motion,new Set(),1/120,length);
   expect(motion.position.x*length/100).toBeCloseTo(12*.514444,6);
  }
 });
 it('sea resistance reduces speed for the same thrust and neutral throttle dissipates motion',()=>{
  const calm=createDriveMotion(),storm=createDriveMotion();calm.throttle=storm.throttle=1;
  for(let i=0;i<120*20;i++){stepDrive(calm,new Set(),PHYSICS_STEP,100);stepDrive(storm,new Set(),PHYSICS_STEP,100,.24);}
  expect(storm.speed).toBeLessThan(calm.speed);expect(storm.speed).toBeGreaterThan(0);
  storm.throttle=0;
  for(let i=0;i<120*20;i++)stepDrive(storm,new Set(),PHYSICS_STEP,100,.24);
  expect(storm.speed).toBeLessThan(.001);
 });
});


describe('wind pressure and vessel loading',()=>{
 it('uses a deterministic downwind field with bounded gusts and stronger storm wind',()=>{
  for(let time=0;time<120;time+=.25){
   const wave=sampleWind(time,seaBlend('waves')),storm=sampleWind(time,seaBlend('storm'));
   expect(storm.speed).toBeCloseTo(wave.speed*2,12);
   expect(storm.speed).toBeGreaterThanOrEqual(32*.8);expect(storm.speed).toBeLessThanOrEqual(32*1.2);
   expect(Math.atan2(storm.z,storm.x)).toBeCloseTo(.82,12);
   expect(storm).toEqual(sampleWind(time,seaBlend('storm')));
  }
 });
 it('dynamic pressure is quadratic in relative wind and reverses both side force and heel',()=>{
  const still={x:0,z:0};
  const low=hullWindLoad(tug,7,0,{x:0,z:10},still),high=hullWindLoad(tug,7,0,{x:0,z:20},still),reverse=hullWindLoad(tug,7,0,{x:0,z:-20},still);
  expect(high.z).toBeCloseTo(low.z*4,8);expect(high.roll).toBeGreaterThan(low.roll);
  expect(reverse.z).toBeCloseTo(-high.z,8);expect(reverse.roll).toBeCloseTo(-high.roll,12);
  const following=hullWindLoad(tug,7,0,{x:0,z:20},{x:0,z:10});
  expect(following.z).toBeCloseTo(low.z,8);
 });
 it('projects wind into the hull frame so rotating hull and wind rotates the load consistently',()=>{
  const original=hullWindLoad(tug,7,0,{x:12,z:8},{x:0,z:0});
  const turned=hullWindLoad(tug,7,Math.PI/2,{x:8,z:-12},{x:0,z:0});
  expect(turned.x).toBeCloseTo(original.z,8);expect(turned.z).toBeCloseTo(-original.x,8);expect(turned.roll).toBeCloseTo(original.roll,12);
 });
 it('wind produces downwind drift while underwater resistance dissipates drift after forcing stops',()=>{
  const drift={x:0,z:0},wind=sampleWind(3,seaBlend('storm'));
  for(let i=0;i<120*20;i++)stepWindDrift(drift,hullWindLoad(tug,7,0,wind,drift),tug,0,PHYSICS_STEP);
  expect(drift.x).toBeGreaterThan(0);expect(drift.z).toBeGreaterThan(0);expect(Math.hypot(drift.x,drift.z)).toBeLessThan(wind.speed);
  const before=Math.hypot(drift.x,drift.z);
  for(let i=0;i<120*60;i++){
   const previous=Math.hypot(drift.x,drift.z);
   stepWindDrift(drift,{x:0,z:0,roll:0,mass:1},tug,0,PHYSICS_STEP);
   expect(Math.hypot(drift.x,drift.z)).toBeLessThanOrEqual(previous);
  }
  // Quadratic drag may only dissipate faster than the slowest linear-drag axis.
  expect(Math.hypot(drift.x,drift.z)).toBeLessThan(before*Math.exp(-.035*60));
 });
 it('combined stronger storm waves and wind remain finite for tug and container hulls',()=>{
  for(const dimensions of [tug,container]){
   const motion=createBuoyancy(),drift={x:0,z:0};let maxHeel=0;
   for(let i=0;i<120*30;i++){
    const time=i/120,load=hullWindLoad(dimensions,dimensions.depth*.8,0,sampleWind(time,seaBlend('storm')),drift);
    const support=sampleHullSupport(dimensions,0,0,0,time,seaBlend('storm'));support.roll+=load.roll;
    stepBuoyancy(motion,support,dimensions,PHYSICS_STEP);stepWindDrift(drift,load,dimensions,0,PHYSICS_STEP);
    for(const value of [...Object.values(motion),drift.x,drift.z])expect(Number.isFinite(value)).toBe(true);
    expect(Math.abs(motion.roll)).toBeLessThan(Math.PI/3);expect(Math.hypot(drift.x,drift.z)).toBeLessThan(12);
    maxHeel=Math.max(maxHeel,Math.abs(motion.roll));
   }
   expect(maxHeel).toBeGreaterThan(.01);
  }
 });
});
