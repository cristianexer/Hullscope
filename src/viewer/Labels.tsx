import { useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Component, ModelManifest, VesselRecord } from '../data/schema';
import { useApp } from '../state';
import type { DriveMotion } from './Drive';
import { canPickComponent } from './visibility';
import { componentBounds, getExplodeSelection, modelPosition } from './positions';

export type LabelElements = Map<string, { button: HTMLButtonElement; line: SVGPolylineElement | null }>;
export function useLabels(manifest: ModelManifest) {
  const state = useApp();
  return useMemo(() => {
    if (!state.labels || state.drive) return [];
    const selected = manifest.components.find(c => c.id === state.selected);
    const candidates = manifest.components.filter(c => (!c.decorative || (c.assembly==='Container stacks' && /tier [56]$/.test(c.name))) &&
      (!c.interior || state.view !== 'Exterior' || state.explode > 0 || Boolean(state.isolated)) &&
      !state.hidden.includes(c.systemId) && (!state.isolated || c.systemId === state.isolated) &&
      (!(state.system && !selected) || c.systemId === state.system) &&
      (selected || state.system || !['Hull','Decks'].includes(c.assembly)));
    const result: Component[] = selected && !state.hidden.includes(selected.systemId) ? [selected] : [];
    const remaining = new Set(candidates.filter(c=>c.id!==selected?.id));
    const assemblyCounts = new Map<string,number>();
    if(selected)assemblyCounts.set(selected.assembly,1);
    // Offer spatially distributed physical anchors. Placement below decides how many fit.
    // Selecting one part keeps surrounding systems available instead of renaming every label.
    while(result.length<36 && remaining.size){
      const diverse=[...remaining].filter(c=>(assemblyCounts.get(c.assembly)??0)<1);
      const pool=diverse.length?diverse:[...remaining].filter(c=>(assemblyCounts.get(c.assembly)??0)<3);
      if(!pool.length)break;
      const score=(c:Component)=>{
        const distance=result.length?Math.min(...result.map(r=>new THREE.Vector3(...c.position).distanceTo(new THREE.Vector3(...r.position)))):0;
        return distance+Math.cbrt(c.size[0]*c.size[1]*c.size[2])*.3;
      };
      pool.sort((a,b)=>score(b)-score(a));
      const next=pool[0];result.push(next);remaining.delete(next);
      assemblyCounts.set(next.assembly,(assemblyCounts.get(next.assembly)??0)+1);
    }
    return result;
  }, [manifest, state.labels, state.drive, state.view, state.explode, state.selected, state.system, state.hidden, state.isolated]);
}

/** HTML stays at native pixel size. Only the anchor is projected from the 3D scene. */
export function LabelProjection({ labels, elements, vessel, manifest, motion }: { motion:RefObject<DriveMotion>; labels: Component[]; elements: RefObject<LabelElements>; vessel: VesselRecord; manifest: ModelManifest }) {
  const { camera, size, scene } = useThree();
  const state = useApp();
  const current = useRef(state.explode);
  const visibility=useRef(new Map<string,boolean>());const visibilityAge=useRef(1);
  const raycaster=useMemo(()=>new THREE.Raycaster(),[]);
  const rayPoint=useMemo(()=>new THREE.Vector3(),[]);
  const cameraPoint=useMemo(()=>new THREE.Vector3(),[]);
  const componentById=useMemo(()=>new Map(manifest.components.map(c=>[c.id,c])),[manifest]);
  const point = useMemo(() => new THREE.Vector3(), []);
  const eligibleIds = useMemo(() => getExplodeSelection(manifest, state.scope, state.system, manifest.components.find(c => c.id === (state.selected??state.assemblyTarget))), [manifest, state.scope, state.system, state.selected, state.assemblyTarget]);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  useFrame((_, dt) => {
    current.current = reduced ? state.explode : THREE.MathUtils.damp(current.current, state.explode, 7, dt);
    visibilityAge.current+=dt;
    if(reduced||visibilityAge.current>.25){
      visibilityAge.current=0;scene.updateMatrixWorld(true);camera.getWorldPosition(cameraPoint);
      const meshes:THREE.Object3D[]=[];
      scene.traverse(object=>{if(object instanceof THREE.InstancedMesh && object.visible && object.userData.componentIds)meshes.push(object);});
      const explodeTarget=manifest.components.find(c=>c.id===(state.selected??state.assemblyTarget));
      for(const c of labels){
        if(c.id===state.selected){visibility.current.set(c.id,true);continue;}
        rayPoint.fromArray(modelPosition(c,current.current,state.scope,state.system,explodeTarget,eligibleIds)).multiplyScalar(100/vessel.length).applyQuaternion(motion.current.quaternion).add(motion.current.position);
        const waterline=-Math.min(22,vessel.depth/vessel.length*100)*.13;
        if(state.water&&state.view==='Exterior'&&rayPoint.y<waterline){visibility.current.set(c.id,false);continue;}
        raycaster.set(cameraPoint,rayPoint.clone().sub(cameraPoint).normalize());
        const hit=raycaster.intersectObjects(meshes,false).find(hit=>{const id=hit.object.userData.componentIds?.[hit.instanceId??-1];const part=componentById.get(id);return part&&canPickComponent(part,state.view,hit.point.z);});
        let part=hit?componentById.get(hit.object.userData.componentIds[hit.instanceId??-1]):undefined;
        const visited=new Set<string>();let visible=false;
        while(part&&!visited.has(part.id)){if(part.id===c.id){visible=true;break;}visited.add(part.id);part=part.parentId?componentById.get(part.parentId):undefined;}
        visibility.current.set(c.id,visible);
      }
    }
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    const limit = size.width < 430 ? 4 : size.width < 850 ? 8 : 12;
    const selected = manifest.components.find(c => c.id === (state.selected??state.assemblyTarget));
    labels.forEach(c => {
      const element = elements.current.get(c.id);
      if (!element) return;
      const { button, line } = element;
      const hide = () => { button.style.visibility = 'hidden'; if (line) line.style.visibility = 'hidden'; };
      if (placed.length >= limit || visibility.current.get(c.id)===false) { hide(); return; }
      const position = modelPosition(c, current.current, state.scope, state.system, selected, eligibleIds);
      point.fromArray(position).multiplyScalar(100 / vessel.length);
      point.y = componentBounds(c, position, 100 / vessel.length).max.y;
      point.applyQuaternion(motion.current.quaternion).add(motion.current.position);
      point.project(camera);
      if (point.z < -1 || point.z > 1 || Math.abs(point.x) > 1.04 || Math.abs(point.y) > 1.04) { hide(); return; }
      const ax = (point.x + 1) * size.width / 2, ay = (1 - point.y) * size.height / 2;
      const w = button.offsetWidth, h = button.offsetHeight;
      let chosen: { x: number; y: number; w: number; h: number } | undefined;
      for (const [dx, dy] of [[-w / 2, -h - 35], [-w - 28, -h / 2], [28, -h / 2], [-w / 2, 34], [-w / 2, -h - 85], [-w / 2, 80], [-w-35,-h-75], [35,-h-75], [-w-35,75], [35,75], [-w/2,-h-135], [-w/2,130]]) {
        const x = Math.round(Math.max(12, Math.min(size.width - w - 52, ax + dx)));
        const y = Math.round(Math.max(14, Math.min(size.height - h - 20, ay + dy)));
        if (x + w > size.width - 12 || y + h > size.height - 12) continue;
        const collides = placed.some(p => x < p.x + p.w + 12 && x + w + 12 > p.x && y < p.y + p.h + 10 && y + h + 10 > p.y);
        if (!collides) { chosen = { x, y, w, h }; break; }
      }
      if (!chosen) { hide(); return; }
      placed.push(chosen);
      button.style.transform = `translate(${chosen.x}px, ${chosen.y}px)`;
      button.style.visibility = 'visible';
      if (line) {
        const bx = Math.max(chosen.x + 8, Math.min(chosen.x + w - 8, ax));
        const by = ay > chosen.y + h ? chosen.y + h : ay < chosen.y ? chosen.y : chosen.y + h / 2;
        line.setAttribute('points', `${Math.round(ax)},${Math.round(ay)} ${Math.round(bx)},${Math.round(by)}`);
        line.style.visibility = 'visible';
      }
    });
  });
  return null;
}
