import type { Component } from '../data/schema';

export type SurfaceKind = 'paint' | 'hull' | 'deck' | 'metal' | 'glass' | 'rubber' | 'wood' | 'cloth' | 'rope' | 'iron';
export const surfaceProfiles: Record<SurfaceKind, {roughness:number;metalness:number;envMapIntensity:number}> = {
 paint: {roughness:.48, metalness:.12, envMapIntensity:.75},
 hull: {roughness:.42, metalness:.22, envMapIntensity:.85},
 deck: {roughness:.79, metalness:.06, envMapIntensity:.4},
 metal: {roughness:.31, metalness:.72, envMapIntensity:.9},
 glass: {roughness:.14, metalness:.35, envMapIntensity:1.1},
 rubber: {roughness:.9, metalness:0, envMapIntensity:.2},
 wood: {roughness:.8, metalness:0, envMapIntensity:.48},
 cloth: {roughness:.98, metalness:0, envMapIntensity:.3},
 rope: {roughness:.95, metalness:0, envMapIntensity:.3},
 iron: {roughness:.67, metalness:.68, envMapIntensity:.55},
};

/** Surface treatment only; every vessel retains its authored paint and livery colours. */
export function componentSurface(component: Pick<Component,'name'|'assembly'|'shape'|'systemId'> & Partial<Pick<Component,'vesselId'>>): SurfaceKind {
 const name=`${component.assembly} ${component.name}`.toLowerCase();
 if (component.vesselId==='black-pearl') {
  if (component.shape==='sail'||component.shape==='triangularSail') return 'cloth';
  if (component.shape==='cannonBarrel') return 'iron';
  if (/glazing|window pane|lantern glass|lantern.+translucent panes/.test(name)) return 'glass';
  if (/anchor stock/.test(component.name.toLowerCase())) return 'wood';
  if (/cannon barrel|iron|anchor(?! cable)|hinge|chain|gun trunnion/.test(component.name.toLowerCase())) return 'iron';
  if (/sail|canvas|hammock|flag/.test(name) && !/yard|mast|boom|cleat|block|sheet|brace|stay|rope/.test(name)) return 'cloth';
  if (/rope|rigging|ratline|shroud|stay|halyard|sheet|brace|breeching|cable|\blift\b|sail.+seam/.test(name) && !/block|pin|cleat|rack|bitt|deadeye/.test(name)) return 'rope';
  return 'wood';
 }
 if (/ventilation opening/.test(name)) return 'paint';
 if (/glazing|window pane|bridge window|wheelhouse window/.test(name)) return 'glass';
 if (/fender|rubber|rescue craft collar|inflatable/.test(name)) return 'rubber';
 if (component.shape==='hull') return 'hull';
 if (component.shape==='deck' || /deck plating|deck \d+ floor|strength deck|weather deck|walkway grating|helideck surface/.test(name)) return 'deck';
 if (/railings|handrail|guardrail|propeller|propulsor blade|shaft|piston|pipework|pipe rack|hydraulic ram|mooring chain/.test(name)) return 'metal';
 return 'paint';
}
