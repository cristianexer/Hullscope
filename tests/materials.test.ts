import { describe, expect, it } from 'vitest';
import { fleet } from '../src/data/fleet';
import { buildModel } from '../src/model/build';
import { componentSurface, surfaceProfiles } from '../src/viewer/materials';
import { isSoftwareRenderer } from '../src/viewer/renderQuality';

describe('physical surface treatment', () => {
  const models = new Map(['ever-ace', 'sparky', 'ocean-drover'].map(id => [id, buildModel(fleet.find(v => v.id === id)!)]));
  it.each([
    ['ever-ace', 'Outer hull shell', 'hull'],
    ['ever-ace', 'Main strength deck', 'deck'],
    ['ever-ace', 'Deck 1 floor', 'deck'],
    ['ever-ace', 'Superstructure weather deck', 'deck'],
    ['ever-ace', 'Crankshaft', 'metal'],
    ['ever-ace', 'Engine bedplate', 'paint'],
    ['sparky', 'Wheelhouse side pane -1 1', 'glass'],
    ['sparky', 'Hull fender 1', 'rubber'],
  ])('%s / %s receives its physical surface class', (vessel, name, expected) => {
    const component = models.get(vessel)!.find(c => c.name === name);
    expect(component).toBeDefined();
    const original = structuredClone(component!);
    expect(componentSurface(component!)).toBe(expected);
    expect(component).toEqual(original);
  });
  it('does not render livestock ventilation openings as reflective window glass', () => {
    const openings = models.get('ocean-drover')!.filter(c => c.name.includes('ventilation opening'));
    expect(openings.length).toBeGreaterThan(0);
    for (const opening of openings) expect(componentSurface(opening)).not.toBe('glass');
  });
  it('keeps physical material values finite and differentiates rubber, steel, glass and walking decks', () => {
    for (const profile of Object.values(surfaceProfiles)) {
      expect(Object.values(profile).every(Number.isFinite)).toBe(true);
      expect(profile.roughness).toBeGreaterThanOrEqual(0);
      expect(profile.roughness).toBeLessThanOrEqual(1);
      expect(profile.metalness).toBeGreaterThanOrEqual(0);
      expect(profile.metalness).toBeLessThanOrEqual(1);
      expect(profile.envMapIntensity).toBeGreaterThanOrEqual(0);
    }
    expect(surfaceProfiles.rubber.metalness).toBe(0);
    expect(surfaceProfiles.metal.metalness).toBeGreaterThan(surfaceProfiles.paint.metalness);
    expect(surfaceProfiles.deck.roughness).toBeGreaterThan(surfaceProfiles.glass.roughness);
    expect(surfaceProfiles.rubber.roughness).toBeGreaterThan(surfaceProfiles.hull.roughness);
  });
});

describe('software renderer detection', () => {
  it.each([
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)), SwiftShader driver)',
    'llvmpipe (LLVM 15.0.7, 256 bits)',
    'softpipe',
    'Software Rasterizer',
    'ANGLE (Microsoft, Microsoft Basic Render Driver, D3D11)',
  ])('identifies explicit CPU rendering: %s', renderer => expect(isSoftwareRenderer(renderer)).toBe(true));
  it.each([
    'ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)',
    'ANGLE (Intel, Intel(R) UHD Graphics 620, OpenGL 4.6)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060, D3D11)',
    'AMD Radeon RX 6800',
    'WebKit WebGL',
    '',
  ])('does not classify hardware or unavailable vendor details as CPU rendering: %s', renderer => expect(isSoftwareRenderer(renderer)).toBe(false));
});
