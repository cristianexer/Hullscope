import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { manifestSchema } from '../src/data/schema';

const legacy = JSON.parse(readFileSync('public/models/sparky.json', 'utf8'));
function authored() {
  const component = { ...legacy.components[0], id: 'test.hull', vesselId: 'test', parentId: null, enclosure: 'shell' };
  return {
    vesselId: 'test', version: 2, units: 'metres', components: [component], meaningfulCount: 1, lods: [],
    assets: [
      { id: 'exterior-low', kind: 'exterior', level: 0, path: 'models/test/exterior.lod0.glb', bytes: 200, sha256: 'a'.repeat(64), componentIds: ['test.hull'] },
      { id: 'exterior-high', kind: 'exterior', level: 1, path: 'models/test/exterior.lod1.glb', bytes: 400, sha256: 'b'.repeat(64), componentIds: ['test.hull'] },
    ],
    decks: [], rooms: [], cameras: [],
    fidelity: 'reference-informed reconstruction',
  };
}
describe('authored yacht manifests', () => {
  it('retains the existing version-one vessel manifest', () => {
    expect(manifestSchema.parse(legacy).version).toBe(1);
  });
  it('accepts an authored assembly without hundreds of artificial subparts', () => {
    const manifest = manifestSchema.parse(authored());
    expect(manifest.version).toBe(2);
    expect(manifest.meaningfulCount).toBe(1);
  });
  it('rejects undeclared mesh owners and mutable/unsafe asset paths', () => {
    const unknownOwner = authored();
    unknownOwner.assets[0].componentIds = ['missing'];
    expect(manifestSchema.safeParse(unknownOwner).success).toBe(false);
    const traversal = authored();
    traversal.assets[0].path = '../secret';
    expect(manifestSchema.safeParse(traversal).success).toBe(false);
  });

  it('rejects physical support hierarchy cycles', () => {
    const cycle = authored();
    cycle.components = [
      { ...cycle.components[0], id: 'test.a', parentId: 'test.b' },
      { ...cycle.components[0], id: 'test.b', parentId: 'test.a' },
    ];
    cycle.meaningfulCount = 2;
    cycle.assets.forEach((asset) => { asset.componentIds = ['test.a', 'test.b']; });

    expect(manifestSchema.safeParse(cycle).success).toBe(false);
  });

  it('rejects a detail level that does not cover every declared component', () => {
    const missingHighDetail = authored();
    missingHighDetail.components = [
      ...missingHighDetail.components,
      { ...missingHighDetail.components[0], id: 'test.mast' },
    ];
    missingHighDetail.meaningfulCount = 2;
    missingHighDetail.assets[0].componentIds = ['test.hull', 'test.mast'];

    expect(manifestSchema.safeParse(missingHighDetail).success).toBe(false);
  });

  it('rejects invalid component deck, room deck, and camera room references', () => {
    const invalidComponentDeck = {
      ...authored(),
      components: authored().components.map((component) => ({ ...component, deckId: 'missing-deck' })),
    };
    expect(manifestSchema.safeParse(invalidComponentDeck).success).toBe(false);

    const invalidRoomDeck = {
      ...authored(),
      rooms: [{
        id: 'salon',
        name: 'Salon',
        deckId: 'missing-deck',
        componentId: 'test.hull',
        fidelity: 'reference-informed' as const,
        note: 'synthetic fixture',
        sourceIds: [],
      }],
    };
    expect(manifestSchema.safeParse(invalidRoomDeck).success).toBe(false);

    const invalidCameraRoom = {
      ...authored(),
      cameras: [{
        id: 'bridge',
        name: 'Bridge',
        position: [0, 0, 0] as [number, number, number],
        target: [0, 0, 0] as [number, number, number],
        roomId: 'missing-room',
      }],
    };
    expect(manifestSchema.safeParse(invalidCameraRoom).success).toBe(false);
  });
});
