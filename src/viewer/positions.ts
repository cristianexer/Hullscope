import * as THREE from 'three';
import type { Component, ModelManifest, Vec3 } from '../data/schema';

/** Include supported children even when their equipment belongs to another system. */
export function getExplodeSelection(manifest: ModelManifest, scope: string, system: string | null, selected: Component | undefined): ReadonlySet<string> {
  const eligible = new Set(manifest.components.filter(c => scope === 'vessel' || (scope === 'system' && c.systemId === system) || (scope === 'assembly' && c.systemId === selected?.systemId && c.assembly === selected?.assembly)).map(c => c.id));
  const children = new Map<string, string[]>();
  for (const c of manifest.components) {
    if (!c.parentId) continue;
    const siblings = children.get(c.parentId) ?? [];
    siblings.push(c.id); children.set(c.parentId, siblings);
  }
  const queue = [...eligible];
  for (let i = 0; i < queue.length; i++) {
    for (const child of children.get(queue[i]) ?? []) {
      if (!eligible.has(child)) { eligible.add(child); queue.push(child); }
    }
  }
  return eligible;
}

export function modelPosition(c: Component, explode: number, scope: string, system: string | null, selected: Component | undefined, eligibleIds?: ReadonlySet<string>): Vec3 {
  const eligible = eligibleIds ? eligibleIds.has(c.id) : scope === 'vessel' || (scope === 'system' && c.systemId === system) || (scope === 'assembly' && c.systemId === selected?.systemId && c.assembly === selected?.assembly);
  const t = eligible ? explode / 100 : 0;
  return c.position.map((p, i) => p + (c.explode[i] + (scope === 'assembly' ? c.localExplode[i] * 3 : 0)) * t) as Vec3;
}

/** Conservative rotated bounds, in viewer units. The same transforms drive picking and rendering. */
export function componentCorners(c: Component, position: Vec3, scale: number, offset = 0): THREE.Vector3[] {
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(...position).multiplyScalar(scale).add(new THREE.Vector3(0, 0, offset)),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...c.rotation)),
    new THREE.Vector3(...c.size).multiplyScalar(scale),
  );
  return [-.5,.5].flatMap(x=>[-.5,.5].flatMap(y=>[-.5,.5].map(z=>new THREE.Vector3(x,y,z).applyMatrix4(matrix))));
}

export function componentBounds(c: Component, position: Vec3, scale: number, offset = 0): THREE.Box3 {
  return new THREE.Box3().setFromPoints(componentCorners(c,position,scale,offset));
}
