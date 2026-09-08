import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ModelManifest, VesselRecord } from '../data/schema';
import type { DriveMotion } from './Drive';
import { useApp } from '../state';
import { componentCorners, getExplodeSelection, modelPosition } from './positions';

const sunDirection=new THREE.Vector3(-.45,1,.65).normalize();
const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),sunDirection).normalize();
const up=new THREE.Vector3().crossVectors(sunDirection,right).normalize();

/** Locally generated reflection lighting; no network HDR assets or external services. */
export function Lighting({vessel,manifest,comparison,motion,compact=false}:{compact?:boolean;vessel:VesselRecord;manifest:ModelManifest;comparison?:{vessel:VesselRecord;manifest:ModelManifest};motion:MutableRefObject<DriveMotion>}) {
 const {gl,scene}=useThree();const state=useApp();const light=useRef<THREE.DirectionalLight>(null);
 const target=useMemo(()=>new THREE.Object3D(),[]);
 const movingCenter=useMemo(()=>new THREE.Vector3(),[]);
 const fit=useMemo(()=>{
  const points:THREE.Vector3[]=[];
  const add=(record:VesselRecord,model:ModelManifest,scale:number,offset:number)=>{
   const selected=model.components.find(c=>c.id===(state.selected??state.assemblyTarget));
   const eligible=getExplodeSelection(model,state.scope,state.system,selected);
   for(const c of model.components){
    if(state.hidden.includes(c.systemId)||(state.isolated&&state.isolated!==c.systemId))continue;
    points.push(...componentCorners(c,modelPosition(c,state.explode,state.scope,state.system,selected,eligible),scale,offset));
   }
   // Keep a valid illuminated envelope while a whole system is hidden.
   if(!points.length)points.push(new THREE.Vector3(-record.length*scale*.5,0,0),new THREE.Vector3(record.length*scale*.5,0,0));
  };
  add(vessel,manifest,comparison?.25:100/vessel.length,comparison?-12:0);
  if(comparison)add(comparison.vessel,comparison.manifest,.25,30);
  const center=new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
  let halfWidth=10,halfHeight=10,depth=10;const delta=new THREE.Vector3();
  for(const p of points){delta.copy(p).sub(center);halfWidth=Math.max(halfWidth,Math.abs(delta.dot(right))+3);halfHeight=Math.max(halfHeight,Math.abs(delta.dot(up))+3);depth=Math.max(depth,Math.abs(delta.dot(sunDirection))+10);}
  // A turning vessel must remain within its light volume in Drive mode.
  if(state.drive){const radius=Math.max(10,...points.map(point=>point.length()))+3;center.set(0,0,0);halfWidth=halfHeight=depth=radius;}
  return {center,halfWidth,halfHeight,depth,distance:depth+80};
 },[vessel,manifest,comparison,state.explode,state.scope,state.system,state.selected,state.assemblyTarget,state.hidden,state.isolated,state.drive]);
 useEffect(()=>{
  const room=new RoomEnvironment();const generator=new THREE.PMREMGenerator(gl);
  const reflection=generator.fromScene(room,.04,.1,100,{size:compact?128:256});room.dispose();generator.dispose();
  const previous=scene.environment;const intensity=scene.environmentIntensity;
  scene.environment=reflection.texture;scene.environmentIntensity=.32;
  return()=>{scene.environment=previous;scene.environmentIntensity=intensity;reflection.dispose();};
 },[gl,scene,compact]);
 useEffect(()=>{
  const shadow=light.current?.shadow;if(!shadow)return;
  shadow.map?.dispose();shadow.map=null;
  shadow.mapPass?.dispose();shadow.mapPass=null;
  gl.shadowMap.needsUpdate=true;
 },[compact,gl]);
 useEffect(()=>{light.current?.shadow.camera.updateProjectionMatrix();gl.shadowMap.needsUpdate=true;},[fit,gl]);
 useFrame(()=>{
  if(!light.current)return;
  light.current.intensity=2.1-(state.water?motion.current.seaMix[2]:0)*1.25;
  movingCenter.copy(fit.center);if(state.drive)movingCenter.add(motion.current.position);
  target.position.copy(movingCenter);target.updateMatrixWorld();
  light.current.position.copy(movingCenter).addScaledVector(sunDirection,fit.distance);
  if(state.drive)gl.shadowMap.needsUpdate=true;
 });
 return <>
  <primitive object={target}/>
  <ambientLight intensity={vessel.kind==='pirate'?.2:.12}/>
  <hemisphereLight args={['#d9ecff','#18333f',vessel.kind==='pirate'?.68:.42]}/>
  <directionalLight ref={light} target={target} castShadow intensity={2.1} color="#fff1df"
   shadow-mapSize-width={compact?1024:2048} shadow-mapSize-height={compact?1024:2048}
   shadow-camera-left={-fit.halfWidth} shadow-camera-right={fit.halfWidth}
   shadow-camera-top={fit.halfHeight} shadow-camera-bottom={-fit.halfHeight}
   shadow-camera-near={1} shadow-camera-far={fit.distance+fit.depth+20}
   shadow-bias={-.00008} shadow-normalBias={.06}/>
  <directionalLight position={[35,22,-65]} intensity={vessel.kind==='pirate'?.8:.55} color="#8fc9ed"/>
 </>;
}
