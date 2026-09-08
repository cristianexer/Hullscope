import { Component as ReactComponent, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import * as THREE from 'three';
import { useApp } from '../state';
import type { Component, ModelManifest, VesselRecord } from '../data/schema';
import { systemById } from '../data/systems';
import { Ocean } from './Ocean';
import { StormWeather } from './StormWeather';
import { Lighting } from './Lighting';
import { PostEffects } from './PostEffects';
import { isSoftwareRenderer } from './renderQuality';
import { componentSurface, surfaceProfiles } from './materials';
import { configureSurfaceDetail } from './surfaceDetail';
import { createDriveMotion, DriveRig } from './Drive';
import { CameraRig } from './CameraRig';
import { LabelProjection, useLabels } from './Labels';
import type { LabelElements } from './Labels';
import { componentCorners, getExplodeSelection, modelPosition } from './positions';
import { canPickComponent, enclosureClass } from './visibility';
import './viewer.css';
export { modelPosition } from './positions';
const modelUsers=new Map<string,{count:number;timer?:ReturnType<typeof setTimeout>}>();
const temp=new THREE.Object3D();const col=new THREE.Color();
function MeshBatch({parts,geometry,scale,manifest,eligibleIds,offset,interactive}:{parts:Component[];geometry:THREE.BufferGeometry;scale:number;manifest:ModelManifest;eligibleIds:ReadonlySet<string>;offset:number;interactive:boolean}){
 const ref=useRef<THREE.InstancedMesh>(null);const mat=useRef<THREE.MeshStandardMaterial>(null);const state=useApp();const current=useRef(state.explode);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const selected=manifest.components.find(c=>c.id===(state.selected??state.assemblyTarget));
 const {gl}=useThree();const surface=componentSurface(parts[0]);
 useEffect(()=>{if(mat.current)configureSurfaceDetail(mat.current,surface);},[surface]);
 const isShell=enclosureClass(parts[0])==='shell';const isEnvelope=enclosureClass(parts[0])==='envelope';const ghost=(state.view==='X-ray'&&(isShell||isEnvelope))||Boolean(state.isolated&&state.isolated!==parts[0].systemId);const clip=useMemo(()=>new THREE.Plane(new THREE.Vector3(0,0,-1),offset),[offset]);
 const visible=!state.hidden.includes(parts[0].systemId) && !(parts[0].interior && state.view==='Exterior' && state.explode===0 && !state.isolated);
 const dirty=useRef(true); useEffect(()=>{dirty.current=true;},[state,parts,scale,eligibleIds]);
 useEffect(()=>{if(mat.current){mat.current.opacity=ghost?.09:1;mat.current.transparent=ghost;mat.current.depthWrite=!ghost;mat.current.clippingPlanes=state.view==='Cutaway'&&(isShell||isEnvelope)?[clip]:[];mat.current.needsUpdate=true;}},[ghost,state.view,isShell,isEnvelope,clip]);
 useFrame((_,dt)=>{
 if(!ref.current)return; const moving=Math.abs(current.current-state.explode)>.005; if(!moving&&!dirty.current)return; dirty.current=false; gl.shadowMap.needsUpdate=true; current.current=reduced?state.explode:THREE.MathUtils.damp(current.current,state.explode,7,dt);
 parts.forEach((c,i)=>{temp.position.fromArray(modelPosition(c,current.current,state.scope,state.system,selected,eligibleIds)).multiplyScalar(scale);temp.rotation.set(...c.rotation);temp.scale.fromArray(c.size).multiplyScalar(scale);temp.updateMatrix();ref.current!.setMatrixAt(i,temp.matrix);
 const focused=c.id===state.selected;const sys=state.system===c.systemId;col.set(focused?'#a5e7ff':sys&&!state.selected&&state.mode==='Explore'?systemById[c.systemId].color:c.color);ref.current!.setColorAt(i,col);});
 ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere();if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;
 });
 const pick=(event:ThreeEvent<MouseEvent>)=>{const p=event.instanceId===undefined?undefined:parts[event.instanceId];if(!p)return;if(!interactive||!visible||!canPickComponent(p,state.view,event.point.z,offset)||(state.isolated&&state.isolated!==p.systemId))return;event.stopPropagation();useApp.getState().set({selected:p.id,system:p.systemId});};
 return <instancedMesh ref={ref} userData={{componentIds:parts.map(c=>c.id)}} args={[geometry,undefined,parts.length]} visible={visible} castShadow={!ghost&&visible} receiveShadow={!ghost} frustumCulled={false} onClick={pick} onPointerOver={e=>{const p=e.instanceId===undefined?undefined:parts[e.instanceId];if(!p)return;if(!interactive||!visible||!canPickComponent(p,state.view,e.point.z,offset)||(state.isolated&&state.isolated!==p.systemId))return;e.stopPropagation();document.body.style.cursor='pointer';}} onPointerOut={()=>document.body.style.cursor='auto'}><meshStandardMaterial ref={mat} {...surfaceProfiles[surface]} clipShadows side={THREE.DoubleSide}/></instancedMesh>;
}
function Ship({vessel,manifest,offset=0,comparison=false,primary=true,lowDetail=false}:{vessel:VesselRecord;manifest:ModelManifest;offset?:number;comparison?:boolean;primary?:boolean;lowDetail?:boolean}){
 const {invalidate}=useThree();
 const url=import.meta.env.BASE_URL+manifest.lods[lowDetail?0:1].url;
 const gltf=useLoader(GLTFLoader,url,l=>l.setMeshoptDecoder(MeshoptDecoder));const scale=comparison?.25:100/vessel.length;const state=useApp();
 useEffect(()=>{
   const entry=modelUsers.get(url)??{count:0};clearTimeout(entry.timer);entry.count++;modelUsers.set(url,entry);
   return()=>{entry.count--;entry.timer=setTimeout(()=>{if(entry.count)return;const disposed=new Set<THREE.BufferGeometry>();gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){if(!disposed.has(o.geometry)){o.geometry.dispose();disposed.add(o.geometry);}const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose());}});useLoader.clear(GLTFLoader,url);modelUsers.delete(url);},250);};
 },[gltf,url]);
 const eligibleIds=useMemo(()=>getExplodeSelection(manifest,state.scope,state.system,manifest.components.find(c=>c.id===(state.selected??state.assemblyTarget))),[manifest,state.scope,state.system,state.selected,state.assemblyTarget]);
 const batches=useMemo(()=>{const geos=new Map<string,THREE.BufferGeometry>();gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.componentId)geos.set(o.userData.componentId,o.geometry);});const map=new Map<string,{parts:Component[];geometry:THREE.BufferGeometry}>();for(const c of manifest.components){const g=geos.get(c.id);if(!g)continue;const key=[g.uuid,c.systemId,enclosureClass(c),c.interior,componentSurface(c)].join('/');const group=map.get(key);if(group)group.parts.push(c);else map.set(key,{parts:[c],geometry:g});}return [...map.values()];},[gltf,manifest]);
 useEffect(()=>{const scene=document.querySelector('[data-scene-status]');scene?.setAttribute(primary?'data-loaded':'data-compared-loaded',vessel.id);scene?.setAttribute(primary?'data-loaded-lod':'data-compared-lod',String(lowDetail?0:1));invalidate();return()=>{document.body.style.cursor='auto';};},[vessel.id,primary,lowDetail,gltf,invalidate]);
 return <group position={[0,0,offset]}>{batches.map((b,i)=><MeshBatch key={i} {...b} scale={scale} manifest={manifest} eligibleIds={eligibleIds} offset={offset} interactive={!comparison&&!state.drive}/>)}
 {!comparison&&vessel.kind!=='pirate'&&<ShipMarkings vessel={vessel} scale={scale} state={state}/>}
 </group>;
}
function ShipMarkings({vessel,scale,state}:{vessel:VesselRecord;scale:number;state:ReturnType<typeof useApp.getState>}){
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle='#e1e8d5';ctx.font='600 94px Barlow Condensed';ctx.textAlign='center';ctx.fillText(vessel.kind==='container'?'EVERGREEN':vessel.kind==='naval'?'D36':vessel.name.toUpperCase(),512,100);return new THREE.CanvasTexture(c);},[vessel]);useEffect(()=>()=>texture.dispose(),[texture]);
 if(state.explode>3||state.view!=='Exterior')return null;
 return <mesh position={[vessel.length*(vessel.kind==='naval'?.28:.07)*scale,0,vessel.beam*.501*scale]}><planeGeometry args={[vessel.length*(vessel.kind==='naval'?.17:.33)*scale,2]}/><meshBasicMaterial map={texture} transparent depthWrite={false} side={THREE.DoubleSide}/></mesh>;
}
function Flow({manifest,vessel}:{manifest:ModelManifest;vessel:VesselRecord}) {
 const markers=useRef<THREE.Group>(null);
 const links=useRef<THREE.BufferGeometry>(null);
 const current=useRef(0);
 const state=useApp();
 const targetSystem=state.system??'propulsion';
 const comps=useMemo(()=>{
  const candidates=manifest.components.filter(c=>c.systemId===targetSystem&&!c.decorative);
  const assemblies=[...new Set(candidates.map(c=>c.assembly))];
  const representatives=assemblies.map(assembly=>candidates.find(c=>c.assembly===assembly&&!c.parentId)??candidates.find(c=>c.assembly===assembly)!);
  return representatives.length>1?representatives.slice(0,12):candidates.slice(0,12);
 },[manifest,targetSystem]);
 const eligibleIds=useMemo(()=>getExplodeSelection(manifest,state.scope,state.system,manifest.components.find(c=>c.id===(state.selected??state.assemblyTarget))),[manifest,state.scope,state.system,state.selected,state.assemblyTarget]);
 const selected=manifest.components.find(c=>c.id===(state.selected??state.assemblyTarget));
 const positions=useMemo(()=>new Float32Array(comps.length*6),[comps]);
 const points=useMemo(()=>comps.map(()=>new THREE.Vector3()),[comps]);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const visible=state.flow&&!state.hidden.includes(targetSystem)&&(!state.isolated||state.isolated===targetSystem);
 useFrame(({clock},dt)=>{
  current.current=reduced?state.explode:THREE.MathUtils.damp(current.current,state.explode,7,dt);
  if(!visible)return;
  comps.forEach((c,i)=>points[i].fromArray(modelPosition(c,current.current,state.scope,state.system,selected,eligibleIds)).multiplyScalar(100/vessel.length));
  for(let i=0;i<comps.length;i++){
   const a=points[i],b=points[(i+1)%points.length];
   a.toArray(positions,i*6);b.toArray(positions,i*6+3);
   const marker=markers.current?.children[i];
   if(marker)marker.position.copy(a).lerp(b,reduced?.5:(clock.elapsedTime*.25+i*.13)%1);
  }
  if(links.current){links.current.attributes.position.needsUpdate=true;links.current.computeBoundingSphere();}
 });
 return <group visible={visible}>
  <lineSegments frustumCulled={false}><bufferGeometry ref={links}><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><lineBasicMaterial color="#79d4ef" transparent opacity={.75}/></lineSegments>
  <group ref={markers}>{comps.map(c=><mesh key={c.id}><sphereGeometry args={[.4,8,8]}/><meshBasicMaterial color="#b2ecff"/></mesh>)}</group>
 </group>;
}
class SceneBoundary extends ReactComponent<{children:ReactNode;onFallback:()=>void},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div className="scene-error"><h2>The 3D scene couldn’t load.</h2><p>You can still explore every system and specification in the text catalogue.</p><button onClick={this.props.onFallback}>Open text catalogue</button><button onClick={()=>location.reload()}>Retry</button></div>:this.props.children;}}
function DemandFrames(){
 const state=useApp();const {invalidate}=useThree();
 useEffect(()=>invalidate(),[state,invalidate]);
 useFrame(()=>{if(state.drive)invalidate();});
 return null;
}
function BoundsTelemetry({vessel,manifest,compare}:{vessel:VesselRecord;manifest:ModelManifest;compare?:{vessel:VesselRecord;manifest:ModelManifest}}) {
 const state=useApp(); const {camera,size,gl}=useThree(); const elapsed=useRef(0);
 const corners=useMemo(()=>{
 const points:THREE.Vector3[]=[];const selected=manifest.components.find(c=>c.id===(state.selected??state.assemblyTarget));
 const add=(m:ModelManifest,scale:number,offset:number)=>{const eligibleIds=getExplodeSelection(m,state.scope,state.system,selected);for(const c of m.components){if(state.hidden.includes(c.systemId)||(state.isolated&&state.isolated!==c.systemId))continue;points.push(...componentCorners(c,modelPosition(c,state.explode,state.scope,state.system,selected,eligibleIds),scale,offset));}};
 add(manifest,compare?.25:100/vessel.length,compare?-12:0);if(compare)add(compare.manifest,.25,30);
 return points;
 },[manifest,vessel,compare,state.explode,state.scope,state.system,state.selected,state.assemblyTarget,state.hidden,state.isolated]);
 useFrame((_,dt)=>{if(state.drive)return;elapsed.current+=dt;if(elapsed.current<.25&&!matchMedia('(prefers-reduced-motion: reduce)').matches)return;elapsed.current=0;const projected=new THREE.Vector3();const box=[Infinity,Infinity,-Infinity,-Infinity];for(const p of corners){projected.copy(p).project(camera);const x=(projected.x+1)*size.width/2,y=(1-projected.y)*size.height/2;box[0]=Math.min(box[0],x);box[1]=Math.min(box[1],y);box[2]=Math.max(box[2],x);box[3]=Math.max(box[3],y);}gl.domElement.closest('[data-scene-status]')?.setAttribute('data-model-bounds',JSON.stringify(box.map(n=>Math.round(n))));});return null;
}
export default function Viewer({vessel,manifest,compare,onFallback}:{vessel:VesselRecord;manifest:ModelManifest;compare?:{vessel:VesselRecord;manifest:ModelManifest};onFallback:()=>void}){
 const [capability]=useState(()=>{try{const c=document.createElement('canvas');const gl=c.getContext('webgl2');const debug=gl?.getExtension('WEBGL_debug_renderer_info');const software=isSoftwareRenderer(gl&&debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'');gl?.getExtension('WEBGL_lose_context')?.loseContext();return {supported:Boolean(gl),software};}catch{return {supported:false,software:false};}});
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 const [software,setSoftware]=useState(capability.software);const [compact,setCompact]=useState(()=>matchMedia('(max-width:768px)').matches);
 useEffect(()=>{const media=matchMedia('(max-width:768px)');const update=()=>setCompact(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 const motion=useRef(createDriveMotion());const labels=useLabels(manifest);const elements=useRef<LabelElements>(new Map());const state=useApp();
 if(!capability.supported)return <div className="scene-error"><h2>Explore without 3D</h2><p>This device does not provide WebGL. All vessel knowledge is available in the text catalogue.</p><button onClick={onFallback}>Open text catalogue</button></div>;
 return <SceneBoundary key={vessel.id} onFallback={onFallback}><div data-scene-status data-loaded="" data-renderer-tier={software?'compatibility':compact?'mobile':'enhanced'} className="canvas-wrap"><Canvas frameloop={reduced?'demand':'always'} onPointerMissed={event=>{if(event.type==='click'&&!useApp.getState().drive)useApp.getState().set({selected:null,system:useApp.getState().scope==='system'?useApp.getState().system:null});}} shadows={software?false:"percentage"} camera={{position:[110,70,160],fov:36,near:.05,far:2000}} dpr={software?.8:compact?[1,1.25]:[1,1.6]} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} onCreated={({gl})=>{const context=gl.getContext();const debug=context.getExtension('WEBGL_debug_renderer_info');const fallback=isSoftwareRenderer(debug?String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'');setSoftware(fallback);gl.shadowMap.enabled=!fallback;gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=true;gl.localClippingEnabled=true;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=.92;}}><DemandFrames/><Lighting vessel={vessel} manifest={manifest} comparison={compare} motion={motion} compact={compact||software}/><Suspense fallback={<Html center><div className="loading-model"><span/>Preparing vessel geometry</div></Html>}><DriveRig vessel={vessel} manifest={manifest} motion={motion} comparison={Boolean(compare)}><Ship key={vessel.id+Boolean(compare)} vessel={vessel} manifest={manifest} lowDetail={compact||software} comparison={Boolean(compare)} offset={compare?-12:0}/></DriveRig>{compare&&<Ship key={compare.vessel.id} vessel={compare.vessel} manifest={compare.manifest} lowDetail={compact||software} comparison primary={false} offset={30}/>}</Suspense><Ocean vessel={vessel} comparison={Boolean(compare)} motion={motion} compact={compact||software}/><StormWeather vessel={vessel} motion={motion} compact={compact||software} comparison={Boolean(compare)}/><CameraRig vessel={vessel} manifest={manifest} compare={compare}/>{!compare&&<><Flow manifest={manifest} vessel={vessel}/><LabelProjection labels={labels} elements={elements} vessel={vessel} manifest={manifest} motion={motion}/></>}<BoundsTelemetry vessel={vessel} manifest={manifest} compare={compare}/><PostEffects enabled={!software&&!compact} view={state.view}/></Canvas>
 {!compare&&!state.drive&&<div className="annotation-layer"><svg className="annotation-leaders" aria-hidden="true">{labels.map(c=><polyline key={c.id} ref={line=>{const entry=elements.current.get(c.id);if(entry)entry.line=line;}}/>)}</svg>{labels.map(c=><button key={c.id} data-component-id={c.id} title={`${c.assembly} · ${c.name}`} className={`scene-label annotation-button ${state.selected===c.id?'selected':''}`} ref={button=>{if(button){const index=labels.indexOf(c);const line=button.parentElement?.querySelectorAll('polyline')[index]??null;elements.current.set(c.id,{button,line});}else elements.current.delete(c.id);}} onClick={()=>state.set({selected:c.id,system:c.systemId,isolated:state.isolated===c.systemId?state.isolated:null,hidden:state.hidden.filter(id=>id!==c.systemId),...(c.interior&&state.view==='Exterior'?{view:'X-ray' as const}:{})})}><span/><span className="annotation-name">{c.name}</span><span aria-hidden="true">+</span></button>)}</div>}
 </div></SceneBoundary>;
}
