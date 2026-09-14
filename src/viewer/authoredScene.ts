import * as THREE from 'three';
import type { AuthoredManifest, Component } from '../data/schema';

export type AuthoredMesh = { mesh: THREE.Mesh; component: Component; initialPosition: THREE.Vector3; initialMatrix: THREE.Matrix4; originals: THREE.Material[] };

/** Clone mutable render state, retaining source geometry/textures for shared cache ownership. */
export function prepareAuthoredScene(source: THREE.Object3D, manifest: AuthoredManifest, expectedIds: readonly string[]) {
  const root = source.clone(true);
  root.updateMatrixWorld(true);
  const components = new Map(manifest.components.map(component => [component.id, component]));
  const owners = new Set(expectedIds);
  const seen = new Set<string>();
  const meshes: AuthoredMesh[] = [];
  const flat = new THREE.Group();
  const dispose = () => meshes.forEach(({mesh}) => (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => material.dispose()));
  try { root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    let owner: THREE.Object3D | null = object;
    while (owner && !owner.userData.componentId) owner = owner.parent;
    const id = owner?.userData.componentId;
    const component = components.get(id);
    if (!component || !owners.has(id)) throw new Error(`Authored mesh has an undeclared assembly: ${object.name}`);
    seen.add(id);
    const mesh = object.clone();
    // Preserve shear introduced by nested rotations/non-uniform scales exactly.
    mesh.matrixAutoUpdate = false;
    mesh.matrix.copy(object.matrixWorld);
    object.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale);
    const originals = (Array.isArray(object.material) ? object.material : [object.material]);
    const materials = originals.map(material => material.clone());
    mesh.material = Array.isArray(object.material) ? materials : materials[0];
    mesh.userData.componentId = id;
    flat.add(mesh);
    meshes.push({ mesh, component, initialPosition: mesh.position.clone(), initialMatrix: object.matrixWorld.clone(), originals });
  });
  if (expectedIds.some(id => !seen.has(id))) {
    throw new Error('Authored asset is missing a declared assembly.');
  }
  } catch (error) { dispose(); throw error; }
  return { root: flat, meshes, dispose };
}

/** Preserve authored finishes; highlight through emission rather than repainting. */
export function setAuthoredAppearance(material: THREE.Material, original: THREE.Material, options: { ghost: boolean; selected: boolean; clip: THREE.Plane | null }) {
  const changed = material.transparent !== (options.ghost || original.transparent) || Boolean(material.clippingPlanes?.length) !== Boolean(options.clip);
  material.opacity = options.ghost ? original.opacity * .09 : original.opacity;
  material.transparent = options.ghost || original.transparent;
  material.depthWrite = !options.ghost && original.depthWrite;
  material.clippingPlanes = options.clip ? [options.clip] : null;
  if (material instanceof THREE.MeshStandardMaterial && original instanceof THREE.MeshStandardMaterial) {
    material.emissive.copy(options.selected ? new THREE.Color('#2e819a') : original.emissive);
    material.emissiveIntensity = options.selected ? .45 : original.emissiveIntensity;
  }
  if (changed) material.needsUpdate = true;
}
