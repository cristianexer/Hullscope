import { describe, it, expect } from 'vitest';
import { Euler, Quaternion, Vector3 } from 'three';
import { makeGeometry } from '../src/model/geometry';
import { fleet } from '../src/data/fleet';
import { buildModel } from '../src/model/build';
import { componentSchema, systemIds } from '../src/data/schema';
import { parseRoute, serializeRoute } from '../src/state';
import { modelPosition, componentBounds, getExplodeSelection } from '../src/viewer/positions';
import { enclosureClass, canPickComponent } from '../src/viewer/visibility';
describe('semantic fleet',()=>{
 it.each(fleet.map(v=>[v.name,v] as const))('%s has a complete selectable hierarchy',(_,v)=>{const parts=buildModel(v);const ids=new Set(parts.map(p=>p.id));expect(ids.size).toBe(parts.length);expect(parts.filter(p=>!p.decorative).length).toBeGreaterThanOrEqual(300);for(const s of systemIds)expect(parts.some(p=>p.systemId===s&&!p.decorative)).toBe(true);parts.forEach(p=>{if(p.parentId)expect(ids.has(p.parentId)).toBe(true);});});
 it('rejects malformed vectors and meaningless system identities',()=>{const part=buildModel(fleet[0])[0];expect(componentSchema.safeParse({...part,systemId:'unknown'}).success).toBe(false);expect(componentSchema.safeParse({...part,position:[1,2]}).success).toBe(false);});
 it('does not count container repetition as technical detail',()=>{const p=buildModel(fleet[0]).filter(c=>c.assembly==='Container stacks');expect(p.length).toBeGreaterThan(500);expect(p.every(c=>c.decorative)).toBe(true);});
 it('returns to assembled positions and respects disassembly scope',()=>{const p=buildModel(fleet[0]);const a=p.find(c=>c.systemId==='propulsion')!;const b=p.find(c=>c.systemId==='cargo')!;expect(modelPosition(a,0,'vessel',null,undefined)).toEqual(a.position);expect(modelPosition(b,100,'system','propulsion',a)).toEqual(b.position);expect(modelPosition(a,100,'assembly','propulsion',a)).not.toEqual(a.position);});
});
describe('shareable route state',()=>{
 it('roundtrips a component and disassembly state',()=>{const route={vesselId:'ever-ace',mode:'Performance' as const,view:'Exploded' as const,selected:'ever-ace.part',explode:67};expect(parseRoute(serializeRoute(route))).toEqual(route);});
 it('handles invalid input without NaN or unknown destinations',()=>{expect(parseRoute('#/vessel/missing?mode=invalid&explode=NaN').vesselId).toBe('ever-ace');expect(parseRoute('#/vessel/sparky?explode=200').explode).toBe(100);expect(parseRoute('#/vessel/sparky?explode=-2').explode).toBe(0);expect(parseRoute('#/vessel/sparky?view=invalid').view).toBe('Exterior');});
});

describe('physical model regression checks', () => {
 it('naval mast faces retain flat normals instead of rounded cylinder shading',()=>{
  for(const detail of [0,1]){
   const geometry=makeGeometry('cone',detail,'naval'),positions=geometry.getAttribute('position'),normals=geometry.getAttribute('normal'),index=geometry.getIndex();
   for(let i=0;i<(index?.count??positions.count);i+=3){
    const ids=[0,1,2].map(offset=>index?index.getX(i+offset):i+offset);
    const [a,b,c]=ids.map(id=>new Vector3().fromBufferAttribute(positions,id));
    const face=b.sub(a).cross(c.sub(a)).normalize();
    for(const id of ids)expect(new Vector3().fromBufferAttribute(normals,id).dot(face)).toBeGreaterThan(.99999);
   }
   geometry.dispose();
  }
 });
 it('chamfered equipment and deckhouses have closed outward faces within their unit envelope',()=>{
  for(const detail of [0,1]){
   const geometry=makeGeometry('chamferedBox',detail,'naval');
   geometry.computeBoundingBox();
   expect(geometry.boundingBox!.min.toArray()).toEqual([-.5,-.5,-.5]);
   expect(geometry.boundingBox!.max.toArray()).toEqual([.5,.5,.5]);
   const positions=geometry.getAttribute('position'),index=geometry.getIndex(),edges=new Map<string,number>();
   let volume=0,angledFaces=0;
   for(let i=0;i<(index?.count??positions.count);i+=3){
    const [a,b,c]=[0,1,2].map(offset=>new Vector3().fromBufferAttribute(positions,index?index.getX(i+offset):i+offset));
    const normal=b.clone().sub(a).cross(c.clone().sub(a));
    expect(normal.length()).toBeGreaterThan(1e-6);
    expect(normal.dot(a.clone().add(b).add(c).divideScalar(3))).toBeGreaterThan(0);
    if(Math.abs(normal.x)>1e-5&&Math.abs(normal.z)>1e-5)angledFaces++;
    volume+=a.dot(b.clone().cross(c))/6;
    for(const [from,to]of [[a,b],[b,c],[c,a]]){
     const key=[from,to].map(point=>point.toArray().map(value=>value.toFixed(6)).join(',')).sort().join('/');
     edges.set(key,(edges.get(key)??0)+1);
    }
   }
   expect([...edges.values()].every(count=>count===2)).toBe(true);
   expect(volume).toBeGreaterThan(.5);expect(volume).toBeLessThan(1);
   expect(angledFaces).toBeGreaterThan(0);geometry.dispose();
  }
 });
 it.each(fleet.map(v => [v.name, v] as const))('%s hull is closed, outward facing and finite at both detail levels', (_, vessel) => {
  for (const detail of [0, 1]) {
   const geometry = makeGeometry('hull', detail, vessel.kind);
   const positions = geometry.getAttribute('position');
   const normals = geometry.getAttribute('normal');
   const starboardMidship: number[] = [];
   const bow: number[] = [];
   for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i);
    expect([x, positions.getY(i), z, normals.getX(i), normals.getY(i), normals.getZ(i)].every(Number.isFinite)).toBe(true);
    if (Math.abs(x) < .08 && z > .45) starboardMidship.push(normals.getZ(i));
    if (x > .499) bow.push(z);
   }
   expect(starboardMidship.length).toBeGreaterThan(0);
   expect(starboardMidship.every(normal => normal > 0)).toBe(true);
   expect(bow.length).toBeGreaterThan(0);
   expect(bow.every(z => Math.abs(z) < .0001)).toBe(true);
   geometry.dispose();
  }
 });
 it.each(fleet.filter(v=>v.kind!=='pirate').map(v => [v.name, v] as const))('%s railing beams connect their actual endpoints', (_, vessel) => {
  const components = buildModel(vessel);
  const rail = components.find(part => part.name === 'Deck safety rail -1 1')!;
  const stanchions = ['Rail stanchion -1 1', 'Rail stanchion -1 2'].map(name => components.find(part => part.name === name)!);
  expect(rail).toBeDefined();
  expect(stanchions.every(Boolean)).toBe(true);
  const rotation = new Quaternion().setFromEuler(new Euler(...rail.rotation));
  const halfSpan = new Vector3(0, rail.size[1] / 2, 0).applyQuaternion(rotation);
  const center = new Vector3(...rail.position);
  const ends = [center.clone().sub(halfSpan), center.clone().add(halfSpan)];
  for (const stanchion of stanchions) {
   const top = new Vector3(...stanchion.position).add(new Vector3(0, stanchion.size[1] / 2, 0));
   expect(Math.min(...ends.map(end => end.distanceTo(top)))).toBeLessThan(.001);
  }
 });
 it('unknown dimensions and financial observations are never encoded as a numeric zero', () => {
  for (const vessel of fleet) for (const fact of vessel.facts) {
   if (fact.status === 'unknown') {
    expect(fact.value).toBeNull();
    expect(fact.sourceId).toBeNull();
   }
   if (fact.status === 'verified') expect(vessel.sources.some(source => source.id === fact.sourceId)).toBe(true);
  }
 });
});


describe('rotated component bounds and selection scope', () => {
 it('uses world-space height for a horizontal pipe, rather than its local length', () => {
  const source = buildModel(fleet[0])[0];
  const pipe = {...source, shape: 'cylinder' as const, size: [2, 100, 2] as [number,number,number], position: [0, 5, 0] as [number,number,number], rotation: [0, 0, Math.PI / 2] as [number,number,number]};
  const bounds = componentBounds(pipe, pipe.position, 1);
  expect(bounds.max.y).toBeCloseTo(6);
  expect(bounds.min.x).toBeCloseTo(-50);
  expect(bounds.max.x).toBeCloseTo(50);
 });
 it('cannot disassemble an identically named assembly in another system', () => {
  const selected = buildModel(fleet[0]).find(part => part.systemId === 'propulsion')!;
  const other = {...selected, id: 'other-system', systemId: 'cargo' as const};
  expect(modelPosition(other, 100, 'assembly', 'propulsion', selected)).toEqual(other.position);
  expect(modelPosition(selected, 100, 'assembly', 'propulsion', selected)).not.toEqual(selected.position);
 });
});

const layeredVessels = fleet.filter(vessel => buildModel(vessel).filter(part => /^Deck \d+ floor$/.test(part.name)).length > 1);
describe('authored deck separation and supported equipment', () => {
 it.each(layeredVessels.map(vessel => [vessel.name, vessel] as const))('%s progressively separates physical deck layers', (_, vessel) => {
  const floors = buildModel(vessel).filter(part => /^Deck \d+ floor$/.test(part.name)).sort((a,b) => a.position[1]-b.position[1]);
  for(let i=1;i<floors.length;i++) {
   const gap=(explode:number)=>{
    const above=componentBounds(floors[i],modelPosition(floors[i],explode,'vessel',null,undefined),1);
    const below=componentBounds(floors[i-1],modelPosition(floors[i-1],explode,'vessel',null,undefined),1);
    return above.min.y-below.max.y;
   };
   expect(gap(40)).toBeGreaterThan(gap(0)+.001);
   expect(gap(100)).toBeGreaterThan(gap(40)+.001);
  }
 });
 it.each(layeredVessels.map(vessel => [vessel.name, vessel] as const))('%s deck glazing follows its enclosure while vessel layers separate', (_, vessel) => {
  const parts=buildModel(vessel);
  const glazing=parts.filter(part=>part.assembly==='Glazing'&&/^Deck \d+ (?:window|ventilation opening)/.test(part.name));
  expect(glazing.length).toBeGreaterThan(0);
  for(const window of glazing) {
   const enclosure=parts.find(part=>part.id===window.parentId);
   expect(enclosure?.name).toMatch(/^Deck \d+ enclosure$/);
   const floor=parts.find(part=>part.id===enclosure!.parentId);
   expect(floor?.name).toMatch(/^Deck \d+ floor$/);
   for(const explode of [40,100]) {
    const windowDelta=modelPosition(window,explode,'vessel',null,undefined).map((n,i)=>n-window.position[i]);
    const enclosureDelta=modelPosition(enclosure!,explode,'vessel',null,undefined).map((n,i)=>n-enclosure!.position[i]);
    windowDelta.forEach((value,axis)=>expect(value).toBeCloseTo(enclosureDelta[axis],5));
   }
  }
 });
 it('Icon rooftop amenities never move down into their supporting roof during explosion', () => {
  const parts=buildModel(fleet.find(vessel=>vessel.id==='icon-of-the-seas')!);
  const roof=parts.find(part=>part.name==='Superstructure weather deck')!;
  const fittings=parts.filter(part=>['Public decks','Waterpark','AquaDome','Cruise uptakes'].includes(part.assembly));
  expect(fittings.length).toBeGreaterThan(10);
  for(const fitting of fittings) {
   const ancestors = new Set<string>();
   let parentId = fitting.parentId;
   while(parentId && !ancestors.has(parentId)) {
    ancestors.add(parentId);
    parentId = parts.find(part => part.id === parentId)?.parentId ?? null;
   }
   expect(ancestors.has(roof.id), `${fitting.name} is supported by the weather roof`).toBe(true);
   const clearance=(explode:number)=>{
    const equipment=componentBounds(fitting,modelPosition(fitting,explode,'vessel',null,undefined),1);
    const support=componentBounds(roof,modelPosition(roof,explode,'vessel',null,undefined),1);
    return equipment.min.y-support.max.y;
   };
   // The AquaDome begins intersecting its supporting roof intentionally; expansion must never worsen it.
   expect(clearance(40),fitting.name).toBeGreaterThanOrEqual(clearance(0)-.001);
   expect(clearance(100),fitting.name).toBeGreaterThanOrEqual(clearance(40)-.001);
  }
 });
});


describe('supported descendants and visible hit targets', () => {
 it('keeps roof equipment and deck glazing attached when disassembling an accommodation assembly', () => {
  const vessel=fleet.find(vessel=>vessel.id==='icon-of-the-seas')!;
  const components=buildModel(vessel);
  const manifest={vesselId:vessel.id,version:1 as const,units:'metres' as const,components,meaningfulCount:components.filter(c=>!c.decorative).length,lods:[]};
  const roof=components.find(c=>c.name==='Superstructure weather deck')!;
  const pool=components.find(c=>c.name==='Pool basin 1')!;
  const glazing=components.find(c=>c.assembly==='Glazing'&&c.name.startsWith('Deck 1 '))!;
  const engine=components.find(c=>c.name==='Engine bedplate')!;
  const eligible=getExplodeSelection(manifest,'assembly','accommodation',roof);
  expect(eligible.has(pool.id)).toBe(true);
  expect(eligible.has(glazing.id)).toBe(true);
  expect(eligible.has(engine.id)).toBe(false);
  expect(modelPosition(engine,100,'assembly','accommodation',roof,eligible)).toEqual(engine.position);
  const clearance=(explode:number)=>componentBounds(pool,modelPosition(pool,explode,'assembly','accommodation',roof,eligible),1).min.y-componentBounds(roof,modelPosition(roof,explode,'assembly','accommodation',roof,eligible),1).max.y;
  expect(clearance(40)).toBeGreaterThanOrEqual(clearance(0));
  expect(clearance(100)).toBeGreaterThanOrEqual(clearance(40));
 });
 it('classifies window skins with their enclosure for cutaway and X-ray materials', () => {
  for(const vessel of fleet) {
   const glazing=buildModel(vessel).filter(c=>c.assembly==='Glazing');
   for(const pane of glazing) expect(enclosureClass(pane)).toBe('envelope');
  }
  const hangar=buildModel(fleet.find(vessel=>vessel.id==='hms-defender')!).find(c=>c.name==='Helicopter hangar')!;
  expect(enclosureClass(hangar)).toBe('envelope');
 });
 it('skips clipped or transparent shells but selects the physical decorative surface that was hit', () => {
  const components=buildModel(fleet[0]);
  const shell=components.find(c=>c.assembly==='Hull'&&!c.decorative)!;
  const equipment=components.find(c=>c.name==='Engine bedplate')!;
  expect(canPickComponent(shell,'Cutaway',1)).toBe(false);
  expect(canPickComponent(shell,'Cutaway',-1)).toBe(true);
  expect(canPickComponent(shell,'Cutaway',31,30)).toBe(false);
  expect(canPickComponent(shell,'Cutaway',29,30)).toBe(true);
  expect(canPickComponent(shell,'X-ray',-1)).toBe(false);
  expect(canPickComponent(equipment,'X-ray',1)).toBe(true);
  expect(canPickComponent({...equipment,decorative:true},'Exterior',1)).toBe(true);
 });
});

describe('continuous hull paint sections',()=>{
 it.each(fleet.map(vessel=>[vessel.name,vessel] as const))('%s has matching paint boundaries without duplicate external shell surfaces',(_,vessel)=>{
  const components=buildModel(vessel),upper=components.find(c=>c.name==='Outer hull shell'),lower=components.find(c=>c.name==='Antifouling underwater shell');
  if(upper||lower){expect(upper).toBeDefined();expect(lower).toBeDefined();expect(upper!.position).toEqual(lower!.position);expect(upper!.size).toEqual(lower!.size);expect(upper!.rotation).toEqual(lower!.rotation);}
  for(const detail of [0,1]){
   const sections=['full','upper','lower'].map(section=>makeGeometry('hull',detail,vessel.kind,section as 'full'|'upper'|'lower'));
   const seam=(g:typeof sections[number])=>{
    const p=g.getAttribute('position');return [...new Set(Array.from({length:p.count},(_,i)=>Math.abs(p.getY(i)+.16)<1e-6?[p.getX(i),p.getZ(i)].map(n=>n.toFixed(6)).join('/'):null).filter((s):s is string=>Boolean(s)))].sort();
   };
   expect(seam(sections[1])).toEqual(seam(sections[2]));expect(seam(sections[1]).length).toBeGreaterThan(40);
   const externalArea=(g:typeof sections[number])=>{
    const p=g.getAttribute('position'),index=g.getIndex()!;let area=0;
    for(let i=0;i<index.count;i+=3){const triangle=[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,index.getX(i+j)));
     if(triangle.every(v=>Math.abs(v.y+.16)<1e-6))continue;
     area+=triangle[1].sub(triangle[0]).cross(triangle[2].sub(triangle[0])).length()/2;
    }return area;
   };
   expect(externalArea(sections[1])+externalArea(sections[2])).toBeCloseTo(externalArea(sections[0]),5);
   const volume=(g:typeof sections[number])=>{const p=g.getAttribute('position'),ix=g.getIndex()!;let total=0;for(let i=0;i<ix.count;i+=3){const [a,b,c]=[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,ix.getX(i+j)));total+=a.dot(b.cross(c))/6;}return total;};
   const volumes=sections.map(volume);expect(volumes.every(v=>v>0)).toBe(true);expect(volumes[1]+volumes[2]).toBeCloseTo(volumes[0],7);
   for(let section=1;section<3;section++){const p=sections[section].getAttribute('position');for(let i=0;i<p.count;i++)expect(section===1?p.getY(i)>=-.160001:p.getY(i)<=-.159999).toBe(true);}
   sections.forEach(g=>g.dispose());
  }
 });
 it('migrates retired knowledge modes to Explore',()=>{
  for(const mode of ['Anatomy','Operations'])expect(parseRoute(`#/vessel/sparky?mode=${mode}`).mode).toBe('Explore');
 });
});

it('NLV Pharos crane boom and ram remain clear of its deckhouse',()=>{
 const vessel=fleet.find(v=>v.id==='nlv-pharos')!,parts=buildModel(vessel);
 const crane=parts.filter(c=>c.assembly==='Buoy-handling crane'&&/articulated boom|hydraulic ram/.test(c.name));
 const enclosures=parts.filter(c=>/^Deck \d+ enclosure$/.test(c.name));
 expect(crane).toHaveLength(2);expect(enclosures.length).toBeGreaterThan(0);
 for(const amount of [0,40,100])for(const component of crane)for(const enclosure of enclosures){
  const boom=componentBounds(component,modelPosition(component,amount,'vessel',null,undefined),1);
  const cabin=componentBounds(enclosure,modelPosition(enclosure,amount,'vessel',null,undefined),1);
  expect(boom.intersectsBox(cabin),`${component.name} intersects ${enclosure.name} at ${amount}%`).toBe(false);
 }
});
