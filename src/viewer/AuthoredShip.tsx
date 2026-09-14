import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { AuthoredManifest, YachtAsset, VesselRecord } from '../data/schema';
import { useApp } from '../state';
import { acquireAuthoredAsset } from '../assets/authored';
import { createReadinessTracker } from '../assets/readiness';
import type { AssetStatus } from '../assets/readiness';
import { prepareAuthoredScene, setAuthoredAppearance } from './authoredScene';
import { getExplodeSelection, modelPosition } from './positions';
import { canPickComponent, enclosureClass } from './visibility';

function AssetGeometry({gltf,asset,manifest,scale,offset,interactive,onStatus}:{gltf:GLTF;asset:YachtAsset;manifest:AuthoredManifest;scale:number;offset:number;interactive:boolean;onStatus:(id:string,status:AssetStatus)=>void}) {
 const state=useApp();const {gl,invalidate}=useThree();
 const scene=useMemo(()=>prepareAuthoredScene(gltf.scene,manifest,asset.componentIds),[gltf,manifest,asset]);
 const selected=manifest.components.find(c=>c.id===(state.selected??state.assemblyTarget));
 const eligible=useMemo(()=>getExplodeSelection(manifest,state.scope,state.system,selected),[manifest,state.scope,state.system,selected]);
 const current=useRef(state.explode),dirty=useRef(true);
 const clip=useMemo(()=>new THREE.Plane(new THREE.Vector3(0,0,-1),offset),[offset]);
 useEffect(()=>()=>scene.dispose(),[scene]);
 useEffect(()=>{onStatus(asset.id,'ready');},[asset.id,scene,onStatus]);
 useEffect(()=>{dirty.current=true;invalidate();},[state,eligible,scene,invalidate]);
 useFrame((_,dt)=>{
  const moving=Math.abs(current.current-state.explode)>.005;
  if(!moving&&!dirty.current)return;
  dirty.current=false;
  current.current=matchMedia('(prefers-reduced-motion: reduce)').matches?state.explode:THREE.MathUtils.damp(current.current,state.explode,7,dt);
  for(const {mesh,component:c,initialPosition,initialMatrix,originals} of scene.meshes){
   const next=modelPosition(c,current.current,state.scope,state.system,selected,eligible);
   mesh.position.copy(initialPosition).add(new THREE.Vector3(next[0]-c.position[0],next[1]-c.position[1],next[2]-c.position[2]));
   mesh.matrix.copy(initialMatrix).setPosition(mesh.position);
   mesh.matrixWorldNeedsUpdate=true;
   const interiorVisible=state.view!=='Exterior'||Boolean(state.roomId)||Boolean(state.deckId)||state.explode>0;
   const inRoom=!state.roomId||!c.roomId||state.roomId===c.roomId;
   const inDeck=!state.deckId||!c.deckId||state.deckId===c.deckId;
   mesh.visible=!state.hidden.includes(c.systemId)&&(!c.interior||interiorVisible&&inRoom&&inDeck);
   const enclosure=enclosureClass(c)!=='equipment';
   const ghost=Boolean(state.isolated&&state.isolated!==c.systemId)||state.view==='X-ray'&&enclosure;
   mesh.castShadow=mesh.visible&&!ghost;mesh.receiveShadow=!ghost;
   const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
   materials.forEach((material,i)=>setAuthoredAppearance(material,originals[i],{ghost,selected:c.id===state.selected,clip:state.view==='Cutaway'&&enclosure?clip:null}));
  }
  gl.shadowMap.needsUpdate=true;
  if(moving)invalidate();
 });
 const hit=(event:ThreeEvent<MouseEvent>)=>{
  if(!interactive||state.drive)return null;
  const component=manifest.components.find(c=>c.id===event.object.userData.componentId);
  if(!component||!event.object.visible||!canPickComponent(component,state.view,event.point.z,offset)||state.isolated&&state.isolated!==component.systemId)return null;
  return component;
 };
 return <group scale={scale} onClick={event=>{const c=hit(event);if(!c)return;event.stopPropagation();state.set({selected:c.id,system:c.systemId});}} onPointerOver={event=>{if(hit(event)){event.stopPropagation();document.body.style.cursor='pointer';}}} onPointerOut={()=>{document.body.style.cursor='auto';}}><primitive object={scene.root}/></group>;
}

function Asset({asset,manifest,scale,offset,interactive,onStatus}:{asset:YachtAsset;manifest:AuthoredManifest;scale:number;offset:number;interactive:boolean;onStatus:(id:string,status:AssetStatus)=>void}) {
 const [gltf,setGltf]=useState<GLTF|null>(null),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let alive=true;setGltf(null);setError(false);onStatus(asset.id,'loading');
  const handle=acquireAuthoredAsset(asset);
  handle.promise.then(data=>{if(alive)setGltf(data);}).catch(()=>{if(alive){setError(true);onStatus(asset.id,'error');}});
  return()=>{alive=false;handle.release();};
 },[asset,attempt,onStatus]);
 if(error)return <Html center><div className="loading-model" role="alert">Yacht geometry is unavailable. Specifications remain accessible.<button onClick={()=>setAttempt(n=>n+1)}>Retry model</button></div></Html>;
 if(!gltf)return <Html center><div className="loading-model">Loading {asset.kind}…</div></Html>;
 return <AssetGeometry gltf={gltf} asset={asset} manifest={manifest} scale={scale} offset={offset} interactive={interactive} onStatus={onStatus}/>;
}

export function AuthoredShip({vessel,manifest,offset=0,comparison=false,primary=true,lowDetail=false}:{vessel:VesselRecord;manifest:AuthoredManifest;offset?:number;comparison?:boolean;primary?:boolean;lowDetail?:boolean}) {
 const state=useApp();const {invalidate}=useThree();
 // Authored asset levels are explicit: LOD0 is the complete authored stream,
 // while LOD1 is the bounded mobile fallback. Desktop should therefore keep
 // the fittings and repeated trim that make the yacht recognizable.
 const level=lowDetail?1:0;
 const interiors=state.view!=='Exterior'||state.explode>0||Boolean(state.roomId)||Boolean(state.deckId);
 const assets=useMemo(()=>manifest.assets.filter(asset=>asset.level===level&&(asset.kind==='exterior'||interiors)).filter(asset=>asset.kind==='exterior'||!state.deckId||!asset.deckId||asset.deckId===state.deckId),[manifest,level,interiors,state.deckId]);
 const report=useMemo(()=>{
  const tracker=createReadinessTracker(assets.map(asset=>asset.id));
  return (id:string,status:AssetStatus)=>{
   const result=tracker.report(id,status),element=document.querySelector('[data-scene-status]');
   const loaded=primary?'data-loaded':'data-compared-loaded',lod=primary?'data-loaded-lod':'data-compared-lod';
   element?.setAttribute(primary?'data-authored-status':'data-compared-status',result);
   if(result==='ready'){element?.setAttribute(loaded,vessel.id);element?.setAttribute(lod,String(level));}
   else{element?.removeAttribute(loaded);element?.removeAttribute(lod);}
   invalidate();
  };
 },[assets,primary,vessel.id,level,invalidate]);
 return <group position={[0,0,offset]}>{assets.map(asset=><Asset key={asset.id} asset={asset} manifest={manifest} scale={comparison ? .25 : 100/vessel.length} offset={offset} interactive={!comparison} onStatus={report}/>)}</group>;
}
