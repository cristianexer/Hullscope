import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import type { AuthoredManifest, Component } from '../src/data/schema';
import { prepareAuthoredScene, setAuthoredAppearance } from '../src/viewer/authoredScene';

function component(id: string): Component {
  return {
    id,
    vesselId: 'test',
    name: id,
    systemId: 'structure',
    assembly: id,
    parentId: null,
    shape: 'box',
    position: [0, 0, 0],
    size: [1, 1, 1],
    rotation: [0, 0, 0],
    color: '#ffffff',
    explode: [0, 0, 0],
    localExplode: [0, 0, 0],
    interior: false,
    decorative: false,
    fidelity: 'reference-informed',
    purpose: 'synthetic QA fixture',
    sourceIds: [],
  };
}

function manifest(ids: readonly string[]): AuthoredManifest {
  const assets = [0, 1].map((level) => ({
    id: `exterior-${level}`,
    kind: 'exterior' as const,
    level: level as 0 | 1,
    path: `models/test/exterior.lod${level}.glb`,
    bytes: 100 + level,
    sha256: String.fromCharCode(97 + level).repeat(64),
    componentIds: [...ids],
  }));
  return {
    vesselId: 'test',
    version: 2,
    units: 'metres',
    components: ids.map(component),
    meaningfulCount: ids.length,
    lods: [],
    assets,
    decks: [],
    rooms: [],
    cameras: [],
    fidelity: 'synthetic fixture only',
  };
}

function ownerMesh(id: string, geometry = new THREE.BoxGeometry(), material = new THREE.MeshStandardMaterial()) {
  const owner = new THREE.Group();
  owner.userData.componentId = id;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `${id}-mesh`;
  owner.add(mesh);
  return owner;
}

describe('authored scene preparation', () => {
  it('preserves PBR textures and restores authored material appearance after selection and ghosting', () => {
    const map = new THREE.Texture();
    const normalMap = new THREE.Texture();
    const original = new THREE.MeshStandardMaterial({
      color: '#27485a',
      map,
      normalMap,
      roughness: 0.37,
      metalness: 0.82,
      emissive: '#091017',
      emissiveIntensity: 0.18,
      opacity: 0.74,
      transparent: false,
      depthWrite: true,
    });
    const source = new THREE.Group();
    source.add(ownerMesh('hull', new THREE.BoxGeometry(), original));
    const scene = prepareAuthoredScene(source, manifest(['hull']), ['hull']);
    const material = scene.meshes[0].mesh.material as THREE.MeshStandardMaterial;
    const originalEmissive = original.emissive.clone();

    expect(material).not.toBe(original);
    expect(material.map).toBe(map);
    expect(material.normalMap).toBe(normalMap);
    expect(material.roughness).toBe(original.roughness);
    expect(material.metalness).toBe(original.metalness);

    setAuthoredAppearance(material, original, {
      ghost: false,
      selected: true,
      clip: null,
    });
    expect(material.map).toBe(map);
    expect(material.normalMap).toBe(normalMap);
    expect(material.emissive.getHexString()).toBe('2e819a');
    expect(material.emissiveIntensity).toBe(0.45);
    expect(original.emissive).toEqual(originalEmissive);

    setAuthoredAppearance(material, original, {
      ghost: true,
      selected: false,
      clip: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    });
    expect(material.opacity).toBeCloseTo(original.opacity * 0.09);
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);

    setAuthoredAppearance(material, original, {
      ghost: false,
      selected: false,
      clip: null,
    });
    expect(material.map).toBe(map);
    expect(material.normalMap).toBe(normalMap);
    expect(material.color).toEqual(original.color);
    expect(material.roughness).toBe(original.roughness);
    expect(material.metalness).toBe(original.metalness);
    expect(material.emissive).toEqual(original.emissive);
    expect(material.emissiveIntensity).toBe(original.emissiveIntensity);
    expect(material.opacity).toBe(original.opacity);
    expect(material.transparent).toBe(original.transparent);
    expect(material.depthWrite).toBe(original.depthWrite);
  });

  it('flattens nested owner transforms into world-space mesh transforms', () => {
    const source = new THREE.Group();
    source.position.set(4, -2, 3);
    source.rotation.z = Math.PI / 4;
    source.scale.set(1.5, 2, 0.75);
    const owner = ownerMesh('nested');
    owner.position.set(2, 1, -1);
    owner.rotation.y = Math.PI / 6;
    const inner = new THREE.Group();
    inner.position.set(-0.5, 3, 2);
    inner.scale.set(0.5, 1.25, 2);
    const mesh = owner.children[0] as THREE.Mesh;
    mesh.position.set(1, -2, 0.25);
    mesh.rotation.x = Math.PI / 8;
    source.add(owner);
    owner.add(inner);
    inner.add(mesh);
    source.updateMatrixWorld(true);
    const expectedWorld = mesh.matrixWorld.clone();

    const scene = prepareAuthoredScene(source, manifest(['nested']), ['nested']);
    scene.root.updateMatrixWorld(true);
    const flattened = scene.meshes[0].mesh;

    expect(scene.root.children).toEqual([flattened]);
    expect(flattened.parent).toBe(scene.root);
    expect(flattened.matrixWorld.elements).toEqual(expectedWorld.elements);
    expect(flattened.position).toEqual(scene.meshes[0].initialPosition);
  });

  it('tracks multiple mesh owners independently', () => {
    const source = new THREE.Group();
    source.add(ownerMesh('hull'), ownerMesh('mast'));
    const scene = prepareAuthoredScene(source, manifest(['hull', 'mast']), ['hull', 'mast']);

    expect(scene.meshes.map(({ component }) => component.id)).toEqual(['hull', 'mast']);
    expect(scene.meshes.map(({ mesh }) => mesh.userData.componentId)).toEqual(['hull', 'mast']);
    expect(scene.root.children).toHaveLength(2);
  });

  it('rejects undeclared mesh owners and missing declared owners', () => {
    const undeclared = new THREE.Group();
    undeclared.add(ownerMesh('hull'), ownerMesh('rogue'));
    expect(() => prepareAuthoredScene(undeclared, manifest(['hull']), ['hull'])).toThrow(
      'Authored mesh has an undeclared assembly',
    );

    const missing = new THREE.Group();
    missing.add(ownerMesh('hull'));
    expect(() => prepareAuthoredScene(missing, manifest(['hull', 'mast']), ['hull', 'mast'])).toThrow(
      'Authored asset is missing a declared assembly',
    );
  });

  it('disposes cloned materials without disposing shared source geometry, material, or textures', () => {
    const geometry = new THREE.BoxGeometry();
    const map = new THREE.Texture();
    const original = new THREE.MeshStandardMaterial({ map });
    const source = new THREE.Group();
    source.add(ownerMesh('hull', geometry, original));
    const scene = prepareAuthoredScene(source, manifest(['hull']), ['hull']);
    const cloned = scene.meshes[0].mesh.material as THREE.MeshStandardMaterial;
    const clonedDispose = vi.spyOn(cloned, 'dispose');
    const geometryDispose = vi.spyOn(geometry, 'dispose');
    const originalDispose = vi.spyOn(original, 'dispose');
    const textureDispose = vi.spyOn(map, 'dispose');

    expect(scene.meshes[0].mesh.geometry).toBe(geometry);
    expect(cloned).not.toBe(original);
    scene.dispose();

    expect(clonedDispose).toHaveBeenCalledTimes(1);
    expect(geometryDispose).not.toHaveBeenCalled();
    expect(originalDispose).not.toHaveBeenCalled();
    expect(textureDispose).not.toHaveBeenCalled();
  });
});
