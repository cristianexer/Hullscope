import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useApp } from '../state';
import { componentCorners } from './positions';
import type { ModelManifest, VesselRecord } from '../data/schema';
import { blendSea, createBuoyancy, hullWindLoad, PHYSICS_STEP, sampleHullSupport, sampleSea, sampleWind, seaBlend, stepBuoyancy, stepWindDrift } from './SeaPhysics';
import type { BuoyancyMotion, SeaBlend, WindSample } from './SeaPhysics';

export type DriveMotion = {position: THREE.Vector3; quaternion: THREE.Quaternion; heading: number; speed: number; throttle: number; rudder: number; buoyancy: BuoyancyMotion; waveTime: number; seaMix: SeaBlend; physicsRemainder: number; drift: {x:number;z:number}};
export type DriveControl = 'ahead' | 'astern' | 'port' | 'starboard' | 'stop';
export const createDriveMotion = (): DriveMotion => ({position:new THREE.Vector3(),quaternion:new THREE.Quaternion(),heading:0,speed:0,throttle:0,rudder:0,buoyancy:createBuoyancy(),waveTime:0,seaMix:seaBlend('calm'),physicsRemainder:0,drift:{x:0,z:0}});
const keyControls: Record<string, DriveControl> = {KeyW:'ahead',ArrowUp:'ahead',KeyS:'astern',ArrowDown:'astern',KeyA:'port',ArrowLeft:'port',KeyD:'starboard',ArrowRight:'starboard',Space:'stop'};

/** Illustrative real-time helm: bounded thrust, linear/quadratic drag and speed-dependent steering. */
export function stepDrive(m: DriveMotion, controls: ReadonlySet<DriveControl>, dt: number, vesselLength: number, seaResistance=0, sailWind?: Pick<WindSample,'x'|'z'>) {
 let remaining=Math.min(.05,Math.max(0,dt));
 while(remaining>1e-9){
  const step=Math.min(PHYSICS_STEP,remaining);
  if(controls.has('stop')) {m.throttle=0;m.speed=0;}
  else {
   m.throttle=THREE.MathUtils.clamp(m.throttle+((controls.has('ahead')?1:0)-(controls.has('astern')?1:0))*step*.55,sailWind?0:-.35,1);
   // A deliberately simple square-rig polar, not a measured Black Pearl speed
   // curve: no wind gives no drive, and the upwind sector cannot be sailed.
   let availableSpeed=12;
   if(sailWind){
    const windSpeed=Math.hypot(sailWind.x,sailWind.z);
    const following=windSpeed>0?(sailWind.x*Math.cos(m.heading)-sailWind.z*Math.sin(m.heading))/windSpeed:0;
    const reach=Math.sqrt(Math.max(0,1-following*following));
    const noGo=THREE.MathUtils.smoothstep(following,-.5,0);
    availableSpeed=Math.min(12,windSpeed*1.943844*(.3+.28*reach)*noGo);
   }
   const target=m.throttle*availableSpeed;
   const thrust=.42*target+.025*target*Math.abs(target);
   const drag=(.42*m.speed+.025*m.speed*Math.abs(m.speed))*(1+Math.max(0,seaResistance));
   m.speed+=(thrust-drag)*step;
  }
  m.rudder=THREE.MathUtils.damp(m.rudder,(controls.has('port')?1:0)-(controls.has('starboard')?1:0),5,step);
  m.heading+=m.rudder*(m.speed/12)*step*.3;
  const distance=m.speed*.514444*step*100/vesselLength;
  m.position.x+=Math.cos(m.heading)*distance;
  m.position.z-=Math.sin(m.heading)*distance;
  remaining-=step;
 }
}

export function DriveRig({vessel,manifest,motion,children,comparison=false}:{vessel:VesselRecord;manifest:ModelManifest;motion:MutableRefObject<DriveMotion>;children:ReactNode;comparison?:boolean}) {
 const state=useApp();const active=state.drive;
 const group=useRef<THREE.Group>(null);
 const wake=useRef<THREE.InstancedMesh>(null);
 const controls=useRef(new Set<DriveControl>());
 const elapsed=useRef(0);
 const wakeClock=useRef(0);
 const trail=useMemo(()=>Array.from({length:60},()=>({position:new THREE.Vector3(),heading:0,age:100})),[]);
 const cursor=useRef(0);
 const {camera,gl,size}=useThree();
 const framing=useMemo(()=>{
  const corners=manifest.components.flatMap(c=>componentCorners(c,c.position,100/vessel.length));
  const bounds=new THREE.Box3().setFromPoints(corners);
  const center=bounds.getCenter(new THREE.Vector3());
  const direction=new THREE.Vector3(-.9,.56,.9).normalize();
  const right=new THREE.Vector3().crossVectors(THREE.Object3D.DEFAULT_UP,direction).normalize();
  const up=new THREE.Vector3().crossVectors(direction,right).normalize();
  const tanY=Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov)/2)*.75;
  const tanX=tanY*size.width/Math.max(1,size.height)*.9;
  let distance=100;
  for(const corner of corners){const relative=corner.sub(center);distance=Math.max(distance,relative.dot(direction)+Math.max(Math.abs(relative.dot(right))/tanX,Math.abs(relative.dot(up))/tanY));}
  return {center,offset:direction.multiplyScalar(distance),windageHeight:Math.max(1,bounds.max.y*vessel.length/100*.65)};
 },[manifest,vessel.length,camera,size.width,size.height]);
 const target=useMemo(()=>new THREE.Vector3(),[]);
 const desired=useMemo(()=>new THREE.Vector3(),[]);
 const stern=useMemo(()=>new THREE.Vector3(),[]);
 const transform=useMemo(()=>new THREE.Object3D(),[]);
 const attitude=useMemo(()=>new THREE.Euler(0,0,0,'YXZ'),[]);
 const normal=useMemo(()=>new THREE.Vector3(),[]);
 const planeNormal=useMemo(()=>new THREE.Vector3(0,0,1),[]);
 const wakeRotation=useMemo(()=>new THREE.Quaternion(),[]);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const scale=100/vessel.length;
 const canFloat=state.water&&state.view==='Exterior'&&state.explode===0&&!comparison&&!state.selected&&!state.isolated&&!reduced;
 const waterline=-Math.min(22,vessel.depth/vessel.length*100)*.13;
 useEffect(()=>{
  motion.current.position.x=0;motion.current.position.z=0;motion.current.heading=0;motion.current.speed=0;motion.current.throttle=0;motion.current.rudder=0;motion.current.drift.x=0;motion.current.drift.z=0;
  controls.current.clear();trail.forEach(sample=>sample.age=100);
  if(group.current){group.current.position.set(0,0,0);group.current.rotation.set(0,0,0);}
  gl.domElement.closest('[data-scene-status]')?.setAttribute('data-drive-position','[0,0]');
  if(!active)return;
  gl.domElement.tabIndex=0;gl.domElement.focus({preventScroll:true});
  const stop=()=>{controls.current.clear();motion.current.throttle=0;motion.current.speed=0;motion.current.drift.x=0;motion.current.drift.z=0;};
  const ignored=(target:EventTarget|null)=>target instanceof HTMLElement&&Boolean(target.closest('input,textarea,select,[contenteditable],[role=dialog],[role=listbox],[role=combobox]'));
  const down=(e:KeyboardEvent)=>{
   if(ignored(e.target)||(e.code==='Space'&&e.target instanceof HTMLElement&&e.target.closest('button')))return;
   if(e.code==='Escape'){useApp.getState().toggleDrive(false);return;}
   const control=keyControls[e.code];if(!control)return;e.preventDefault();if(control==='stop')stop();controls.current.add(control);
  };
  const up=(e:KeyboardEvent)=>{const control=keyControls[e.code];if(control)controls.current.delete(control);};
  const touch=(e:Event)=>{const detail=(e as CustomEvent<{control:DriveControl;pressed:boolean}>).detail;if(!['ahead','astern','port','starboard','stop'].includes(detail.control))return;if(detail.pressed){if(detail.control==='stop')stop();controls.current.add(detail.control);}else controls.current.delete(detail.control);};
  const visibility=()=>{if(document.hidden)stop();};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',stop);window.addEventListener('hullscope-drive-input',touch);document.addEventListener('visibilitychange',visibility);
  return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',stop);window.removeEventListener('hullscope-drive-input',touch);document.removeEventListener('visibilitychange',visibility);controls.current.clear();};
 },[active,motion,gl,trail,vessel.id]);
 useFrame((_,dt)=>{
  if(!group.current)return;
  const m=motion.current;
  m.physicsRemainder+=Math.min(.1,Math.max(0,dt));
  while(m.physicsRemainder>=PHYSICS_STEP){
   if(canFloat)m.waveTime+=PHYSICS_STEP;
   if(reduced){const targetMix=seaBlend(state.seaState);for(let i=0;i<3;i++)m.seaMix[i]=targetMix[i];}
   else blendSea(m.seaMix,state.seaState,PHYSICS_STEP);
   if(active)stepDrive(m,controls.current,PHYSICS_STEP,vessel.length,m.seaMix[1]*.24+m.seaMix[2]*.65,vessel.kind==='pirate'?sampleWind(m.waveTime,m.seaMix):undefined);
   if(canFloat){
    const wind=sampleWind(m.waveTime,m.seaMix);
    const velocity={x:Math.cos(m.heading)*m.speed*.514444+m.drift.x,z:-Math.sin(m.heading)*m.speed*.514444+m.drift.z};
    const load=hullWindLoad(vessel,framing.windageHeight,m.heading,wind,velocity);
    const support=sampleHullSupport(vessel,m.position.x/scale,m.position.z/scale,m.heading,m.waveTime,m.seaMix);
    support.roll+=load.roll;
    stepBuoyancy(m.buoyancy,support,vessel,PHYSICS_STEP);
    if(active&&!controls.current.has('stop')){
     stepWindDrift(m.drift,load,vessel,m.heading,PHYSICS_STEP);
     m.position.x+=m.drift.x*PHYSICS_STEP*scale;
     m.position.z+=m.drift.z*PHYSICS_STEP*scale;
    }
   }else Object.assign(m.buoyancy,createBuoyancy());
   m.physicsRemainder-=PHYSICS_STEP;
  }
  m.position.y=canFloat?m.buoyancy.heave*scale:0;
  attitude.set(canFloat?m.buoyancy.roll:0,m.heading,canFloat?m.buoyancy.pitch:0,'YXZ');
  m.quaternion.setFromEuler(attitude);
  group.current.position.copy(m.position);group.current.quaternion.copy(m.quaternion);
  if(canFloat)gl.shadowMap.needsUpdate=true;
  if(active){
   target.copy(framing.center).applyQuaternion(m.quaternion).add(m.position);
   desired.copy(framing.offset).applyAxisAngle(THREE.Object3D.DEFAULT_UP,m.heading).add(target);
   camera.position.lerp(desired,1-Math.exp(-Math.min(.1,dt)*3));camera.lookAt(target);
  }
  wakeClock.current+=dt;
  if(active&&wakeClock.current>.09&&Math.abs(m.speed)>.25){
   wakeClock.current=0;const sample=trail[cursor.current++%trail.length];
   stern.set(m.speed<0?47:-47,0,0).applyAxisAngle(THREE.Object3D.DEFAULT_UP,m.heading).add(m.position);
   sample.position.copy(stern);sample.heading=m.heading;sample.age=0;
  }
  if(active&&wake.current){
   trail.forEach((sample,i)=>{
    sample.age+=dt;
    for(let side=0;side<2;side++){
     const spread=(side?1:-1)*(1.5+sample.age*.7);
     transform.position.set(0,0,spread).applyAxisAngle(THREE.Object3D.DEFAULT_UP,sample.heading).add(sample.position);
     const surface=sampleSea(transform.position.x/scale,transform.position.z/scale,m.waveTime,m.seaMix);
     transform.position.y=waterline+surface.height*scale+.08;
     normal.set(-surface.gradientX,1,-surface.gradientZ).normalize();
     transform.quaternion.setFromUnitVectors(planeNormal,normal);
     wakeRotation.setFromAxisAngle(planeNormal,sample.heading);transform.quaternion.multiply(wakeRotation);
     const size=sample.age>5?0:(.65+sample.age*.55)*(1-sample.age/5);
     transform.scale.set(size*2,size,1);transform.updateMatrix();wake.current!.setMatrixAt(i*2+side,transform.matrix);
    }
   });wake.current.instanceMatrix.needsUpdate=true;
  }
  elapsed.current+=dt;
  if(reduced||elapsed.current>.1){elapsed.current=0;
   const scene=gl.domElement.closest('[data-scene-status]');
   scene?.setAttribute('data-sea-state',state.seaState);
   scene?.setAttribute('data-wave-time',m.waveTime.toFixed(3));
   scene?.setAttribute('data-wind',JSON.stringify(sampleWind(m.waveTime,m.seaMix)));
   scene?.setAttribute('data-wind-drift',JSON.stringify(m.drift));
   scene?.setAttribute('data-hull-pose',JSON.stringify({heave:Number(m.buoyancy.heave.toFixed(4)),pitch:Number(m.buoyancy.pitch.toFixed(5)),roll:Number(m.buoyancy.roll.toFixed(5)),active:canFloat}));
   scene?.setAttribute('data-drive-position',JSON.stringify([Number(m.position.x.toFixed(3)),Number(m.position.z.toFixed(3))]));
   scene?.setAttribute('data-drive-heading',String(m.heading));
   const speed=document.querySelector('[data-drive-speed]');if(speed)speed.textContent=m.speed.toFixed(1);
   const throttle=document.querySelector('[data-drive-throttle]');if(throttle)throttle.textContent=String(Math.round(m.throttle*100));
   const heading=document.querySelector('[data-drive-heading-output]');if(heading)heading.textContent=String((-Math.round(m.heading*180/Math.PI)%360+360)%360).padStart(3,'0');
  }
 },-2);
 return <><group ref={group}>{children}</group><instancedMesh ref={wake} args={[undefined,undefined,trail.length*2]} visible={active} frustumCulled={false} renderOrder={3}><planeGeometry args={[1,1]}/><meshBasicMaterial color="#c3e8f2" transparent opacity={.28} depthWrite={false} side={THREE.DoubleSide}/></instancedMesh></>;
}
