import type { Component } from '../data/schema';

/** Enclosures must use the same classification for batching, materials and picking. */
export function enclosureClass(c: Component): 'shell' | 'envelope' | 'equipment' {
  if (['Hull', 'Twin hulls'].includes(c.assembly)) return 'shell';
  if (c.vesselId==='black-pearl' && ['Gunport walls','Gunport lids','Bulwarks','Stern gallery'].includes(c.assembly)) return 'envelope';
  if (c.vesselId==='black-pearl' && (/^Forward cabin screen/.test(c.name)||/cabin door/i.test(c.name))) return 'envelope';
  if (['Superstructure', 'Decks', 'Glazing', 'Bridge'].includes(c.assembly) ||
      ['Helicopter hangar', 'Hangar roof', 'Hangar door'].includes(c.name) || c.name.startsWith('Hangar door segment')) return 'envelope';
  return 'equipment';
}

export function canPickComponent(c: Component, view: string, pointZ: number, vesselOffset = 0): boolean {
  // Decorative instances are still visible physical surfaces: select the actual hit
  // rather than letting a click fall through to unrelated equipment behind them.
  // Three.js raycasting does not apply material clipping planes.
  if (view === 'Cutaway' && enclosureClass(c) !== 'equipment' && pointZ > vesselOffset) return false;
  // Transparent shells should not intercept the equipment visible through them.
  if (view === 'X-ray' && enclosureClass(c) !== 'equipment') return false;
  return true;
}
