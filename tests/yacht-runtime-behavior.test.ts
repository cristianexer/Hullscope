import { afterEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { AuthoredManifest, Component } from '../src/data/schema';
import { fetchAssetBytes } from '../src/assets/request';
import { parseRoute, serializeRoute, useApp } from '../src/state';
import { prepareAuthoredScene } from '../src/viewer/authoredScene';

function component(id: string): Component {
  return {
    id,
    vesselId: 'synthetic-runtime-qa',
    name: id,
    systemId: 'structure',
    assembly: id,
    parentId: null,
    shape: 'box',
    position: [0, 0, 0],
    size: [1, 1, 1],
    rotation: [0, 0, 0],
    color: '#ffffff',
    explode: [1, 0, 0],
    localExplode: [0, 0, 0],
    interior: false,
    decorative: false,
    fidelity: 'reference-informed',
    purpose: 'synthetic QA fixture',
    sourceIds: [],
  };
}

function manifest(ids: readonly string[]): AuthoredManifest {
  return {
    vesselId: 'synthetic-runtime-qa',
    version: 2,
    units: 'metres',
    components: ids.map(component),
    meaningfulCount: ids.length,
    lods: [],
    assets: [{
      id: 'synthetic-exterior-lod1',
      kind: 'exterior',
      level: 1,
      path: 'models/synthetic-runtime-qa/exterior.lod1.glb',
      bytes: 1,
      sha256: 'a'.repeat(64),
      componentIds: [...ids],
    }],
    decks: [],
    rooms: [],
    cameras: [],
    fidelity: 'synthetic fixture only',
  };
}

afterEach(() => {
  useApp.getState().reset();
});

describe('shareable interior route state', () => {
  it('round-trips room and deck selections without losing the view contract', () => {
    const route = parseRoute(
      '#/vessel/ever-ace?view=Cutaway&room=main.salon&deck=main-deck&part=main.salon&explode=37',
    );

    expect(route).toMatchObject({
      vesselId: 'ever-ace',
      view: 'Cutaway',
      roomId: 'main.salon',
      deckId: 'main-deck',
      selected: 'main.salon',
      explode: 37,
    });
    expect(parseRoute(serializeRoute(route))).toEqual(route);
  });

  it('drops unsafe room and deck query values instead of creating interior state', () => {
    const route = parseRoute('#/vessel/ever-ace?room=main%2Fsalon&deck=%22main%22');

    expect(route.roomId).toBeUndefined();
    expect(route.deckId).toBeUndefined();
  });
});

describe('interior-to-exterior state transition', () => {
  it('clears interior selectors when the public view control returns to Exterior', () => {
    useApp.getState().set({
      roomId: 'main.salon',
      deckId: 'main-deck',
      preset: 'interior:salon-camera',
      view: 'Cutaway',
      explode: 0,
    });

    // This is the exact public update issued by App.tsx view-switch buttons.
    useApp.getState().set({ view: 'Exterior', explode: 0 });

    expect(useApp.getState()).toMatchObject({
      roomId: null,
      deckId: null,
      preset: 'Three-quarter',
      view: 'Exterior',
    });
  });
});

describe('anonymous authored-asset requests', () => {
  it('retries transient responses with anonymous CORS requests', async () => {
    let calls = 0;
    const requests: Array<{ credentials?: RequestCredentials; mode?: RequestMode; aborted?: boolean }> = [];
    const bytes = new Uint8Array([0x67, 0x6c, 0x54, 0x46]);

    const result = await fetchAssetBytes('https://assets.example.test/yacht.glb', {
      fetcher: async (_url, init) => {
        requests.push({ credentials: init?.credentials, mode: init?.mode, aborted: init?.signal?.aborted });
        return calls++ === 0
          ? new Response('', { status: 503 })
          : new Response(bytes);
      },
      wait: async () => {},
    });

    expect(new Uint8Array(result)).toEqual(bytes);
    expect(requests).toHaveLength(2);
    expect(requests).toEqual([
      { credentials: 'omit', mode: 'cors', aborted: false },
      { credentials: 'omit', mode: 'cors', aborted: false },
    ]);
  });

  it('does not start a second request after cancellation during backoff', async () => {
    const controller = new AbortController();
    let calls = 0;

    await expect(fetchAssetBytes('https://assets.example.test/yacht.glb', {
      signal: controller.signal,
      fetcher: async () => {
        calls++;
        return new Response('', { status: 503 });
      },
      wait: async (_milliseconds, signal) => {
        controller.abort('route changed');
        signal?.throwIfAborted();
      },
    })).rejects.toBe('route changed');

    expect(calls).toBe(1);
  });
});

describe('authored component coordinates', () => {
  it('retains the authored world matrix while applying a component translation', () => {
    const source = new THREE.Group();
    source.rotation.z = Math.PI / 5;
    source.scale.set(1.5, 0.75, 2);
    const owner = new THREE.Group();
    owner.userData.componentId = 'nested';
    owner.rotation.y = Math.PI / 7;
    owner.scale.set(0.5, 1.25, 1);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    mesh.position.set(2, -1, 0.5);
    owner.add(mesh);
    source.add(owner);
    source.updateMatrixWorld(true);

    const scene = prepareAuthoredScene(source, manifest(['nested']), ['nested']);
    const prepared = scene.meshes[0];
    const authored = prepared.initialMatrix.clone();
    const translatedPosition = prepared.initialPosition.clone().add(new THREE.Vector3(4, 0, 0));

    expect(prepared.mesh.matrixAutoUpdate).toBe(false);
    expect(authored.elements.slice(0, 12)).toEqual(prepared.mesh.matrix.elements.slice(0, 12));

    prepared.mesh.matrix.copy(authored).setPosition(translatedPosition);

    expect(prepared.mesh.matrix.elements.slice(0, 12)).toEqual(authored.elements.slice(0, 12));
    expect(prepared.mesh.matrix.elements.slice(12, 15)).toEqual([
      translatedPosition.x,
      translatedPosition.y,
      translatedPosition.z,
    ]);
    expect(prepared.mesh.matrix.elements[15]).toBe(authored.elements[15]);
    scene.dispose();
  });
});
