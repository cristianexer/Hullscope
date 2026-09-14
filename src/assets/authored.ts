import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { MeshoptDecoder } from 'meshoptimizer';
import type { YachtAsset } from '../data/schema';
import { fetchAssetBytes } from './request';
import { yachtAssetResolver } from './yachts';
import { assertEmbeddedGLB } from './glb';

type Entry = { users: number; controller: AbortController; promise: Promise<GLTF>; data?: GLTF; failed?: boolean; timer?: ReturnType<typeof setTimeout> };
const active = new Map<string, Entry>();

function dispose(gltf: GLTF) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  gltf.scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => { t.dispose(); if (typeof ImageBitmap !== 'undefined' && t.image instanceof ImageBitmap) t.image.close(); });
}

/** Sharing is scoped to live consumers; browser caching handles revisits without retaining GPU scenes. */
export function acquireAuthoredAsset(asset: YachtAsset) {
  const url = yachtAssetResolver().resolve(asset.path);
  const key = `${url}#${asset.sha256}`;
  let entry = active.get(key);
  if (!entry || entry.failed) {
    const controller = new AbortController();
    const created: Entry = { users: 0, controller, promise: fetchAssetBytes(url, { signal: controller.signal }).then(async bytes => {
      if (bytes.byteLength !== asset.bytes) throw new Error('Asset length does not match its release manifest.');
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const hash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
      if (hash !== asset.sha256) throw new Error('Asset checksum does not match its release manifest.');
      assertEmbeddedGLB(new Uint8Array(bytes));
      controller.signal.throwIfAborted();
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setCrossOrigin('anonymous');
      const gltf = await loader.parseAsync(bytes, url.slice(0, url.lastIndexOf('/') + 1));
      if (controller.signal.aborted) { dispose(gltf); controller.signal.throwIfAborted(); }
      created.data = gltf;
      return gltf;
    }).catch(error=>{created.failed=true;throw error;}) };
    entry = created; active.set(key, entry);
  }
  clearTimeout(entry.timer);
  entry.users++;
  let released = false;
  return { promise: entry.promise, release() {
    if (released) return;
    released = true; entry!.users--;
    if (!entry!.users) entry!.timer = setTimeout(() => {
      if (entry!.users) return;
      entry!.controller.abort();
      if (entry!.data) dispose(entry!.data);
      if (active.get(key) === entry) active.delete(key);
    }, 250);
  } };
}
