import { describe, expect, it } from 'vitest';
import { Euler, Quaternion, DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { hullSectionFor, makeGeometry } from '../src/model/geometry';
import { buildModel } from '../src/model/build';
import { componentBounds, modelPosition } from '../src/viewer/positions';
import { componentSurface } from '../src/viewer/materials';
import { canPickComponent, enclosureClass } from '../src/viewer/visibility';
import { fleet } from '../src/data/fleet';
import { parseRoute, serializeRoute } from '../src/state';

describe('fictional bonus vessel catalogue',()=>{
 it('preserves the 28 real families while adding a disclosed fictional sailing vessel',()=>{
  const modern=fleet.filter(v=>!v.fictional),pearl=fleet.find(v=>v.id==='black-pearl')!;
  expect(modern).toHaveLength(28);expect(new Set(modern.map(v=>v.family.id)).size).toBe(28);
  expect(pearl.fictional).toBe(true);expect(pearl.kind).toBe('pirate');expect(pearl.family.group).toBe('Special');
  expect(pearl.dimensionStatus).toBe('inferred');expect(pearl.modelNote).toMatch(/not verified film canon/);
  expect(pearl.facts.filter(f=>/length|beam|depth/i.test(f.label)).every(f=>f.status!=='verified')).toBe(true);
  expect(new Set(fleet.map(v=>v.id)).size).toBe(fleet.length);
 });
 it('restores bonus-vessel deep links without redirecting to the default modern ship',()=>{
  const route={vesselId:'black-pearl',mode:'Risk' as const,view:'Exploded' as const,selected:'black-pearl.mainmast',explode:65};
  expect(parseRoute(serializeRoute(route))).toEqual(route);
 });
});

describe('period equipment geometry',()=>{
 for(const detail of [0,1]){
  for(const shape of ['sail','triangularSail'] as const){
   it(`${shape} LOD${detail} has billowing finite cloth and closed edges`,()=>{
    const geometry=makeGeometry(shape,detail,'pirate'),p=geometry.getAttribute('position'),index=geometry.getIndex()!;
    const edges=new Map<string,number>();let volume=0;
    for(let i=0;i<index.count;i+=3){
     const points=[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,index.getX(i+j)));
     for(const point of points)expect(point.toArray().every(v=>Number.isFinite(v)&&Math.abs(v)<=.501)).toBe(true);
     const [a,b,c]=points;expect(b.clone().sub(a).cross(c.clone().sub(a)).length()).toBeGreaterThan(1e-10);
     volume+=a.dot(b.clone().cross(c))/6;
     for(let edge=0;edge<3;edge++){
      const key=[index.getX(i+edge),index.getX(i+(edge+1)%3)].sort((a,b)=>a-b).join('/');edges.set(key,(edges.get(key)??0)+1);
     }
    }
    expect([...edges.values()].every(count=>count===2)).toBe(true);
    expect(volume).toBeGreaterThan(.001);expect(volume).toBeLessThan(.01);
    geometry.computeBoundingBox();expect(geometry.boundingBox!.max.z-geometry.boundingBox!.min.z).toBeGreaterThan(.4);
    if(shape==='triangularSail'){
     const top:number[]=[],bottom:number[]=[];
     for(let i=0;i<p.count;i++){if(p.getY(i)>.49)top.push(p.getX(i));if(p.getY(i)<-.49)bottom.push(p.getX(i));}
     expect(Math.max(...top)-Math.min(...top)).toBeLessThan((Math.max(...bottom)-Math.min(...bottom))*.1);
    }
    geometry.dispose();
   });
  }
  it(`LOD${detail} cannon has a recessed muzzle and timber frames retain an open centre`,()=>{
   const material=new MeshBasicMaterial({side:DoubleSide});
   const cannon=new Mesh(makeGeometry('cannonBarrel',detail,'pirate'),material);cannon.updateMatrixWorld();
   const muzzle=new Raycaster(new Vector3(0,1,0),new Vector3(0,-1,0)).intersectObject(cannon);
   expect(muzzle.length).toBeGreaterThan(0);expect(muzzle[0].point.y).toBeLessThan(.4);expect(muzzle[0].point.y).toBeGreaterThan(.2);
   const frame=new Mesh(makeGeometry('timberFrame',detail,'pirate'),material);frame.updateMatrixWorld();
   expect(new Raycaster(new Vector3(1,0,0),new Vector3(-1,0,0)).intersectObject(frame)).toHaveLength(0);
   expect(new Raycaster(new Vector3(1,0,.46),new Vector3(-1,0,0)).intersectObject(frame).length).toBeGreaterThan(0);
   cannon.geometry.dispose();frame.geometry.dispose();material.dispose();
  });
 }
});


describe('authored Black Pearl arrangement',()=>{
 const parts=buildModel(fleet.find(v=>v.id==='black-pearl')!);
 const part=(name:string)=>{const result=parts.find(c=>c.name===name);expect(result,name).toBeDefined();return result!;};
 const bounds=(name:string,amount=0)=>{const c=part(name);return componentBounds(c,modelPosition(c,amount,'vessel',null,undefined),1);};
 it('has three connected staged masts and nine supported square sails',()=>{
  expect(parts.filter(c=>c.shape==='sail'&&!c.interior&&!c.decorative)).toHaveLength(9);
  for(const prefix of ['Foremast','Mainmast','Mizzen mast']){
   const stages=['lower mast','topmast','topgallant mast'].map(stage=>part(`${prefix} ${stage}`));
   const deck=parts.find(c=>c.id===stages[0].parentId)!;expect(deck).toBeDefined();
   expect(bounds(stages[0].name).min.y).toBeLessThanOrEqual(bounds(deck.name).max.y);
   expect(bounds(stages[0].name).min.y).toBeGreaterThanOrEqual(bounds(deck.name).min.y);
   for(let i=1;i<stages.length;i++){
    expect(stages[i].parentId).toBe(stages[i-1].id);
    expect(bounds(stages[i].name).min.y).toBeLessThan(bounds(stages[i-1].name).max.y);
    expect(bounds(stages[i].name).max.y).toBeGreaterThan(bounds(stages[i-1].name).max.y);
   }
   for(let i=1;i<=3;i++){
    const sail=part(`${prefix} ${i} black sail`),yard=part(`${prefix} ${i} yard`);
    expect(sail.parentId).toBe(yard.id);expect(yard.parentId).toBe(stages[i-1].id);
    expect(bounds(sail.name).max.y).toBeGreaterThanOrEqual(bounds(yard.name).min.y);
    expect(bounds(sail.name).max.y).toBeLessThanOrEqual(bounds(yard.name).max.y);
   }
  }
 });
 it('separates the three gun and working decks progressively',()=>{
  const decks=['Lower gun deck','Upper gun deck','Main strength deck'];
  for(let i=1;i<decks.length;i++){
   const gap=(amount:number)=>bounds(decks[i],amount).min.y-bounds(decks[i-1],amount).max.y;
   expect(gap(0)).toBeGreaterThan(1);expect(gap(40)).toBeGreaterThan(gap(0));expect(gap(100)).toBeGreaterThan(gap(40));
  }
 });
 it('places 32 cannon muzzles outboard and carries barrels with their assigned carriage',()=>{
  const guns=parts.filter(c=>c.shape==='cannonBarrel');expect(guns).toHaveLength(32);
  for(const gun of guns){
   const side=gun.name.startsWith('Port')?-1:1,carriage=parts.find(c=>c.id===gun.parentId)!;expect(carriage.name).toMatch(/carriage$/);
   const muzzle=new Vector3(0,gun.size[1]/2,0).applyQuaternion(new Quaternion().setFromEuler(new Euler(...gun.rotation))).add(new Vector3(...gun.position));
   expect((muzzle.z-gun.position[2])*side).toBeGreaterThan(1);
   const initial=new Vector3(...gun.position).sub(new Vector3(...carriage.position));
   for(const amount of [40,100])expect(new Vector3(...modelPosition(gun,amount,'vessel',null,undefined)).sub(new Vector3(...modelPosition(carriage,amount,'vessel',null,undefined))).distanceTo(initial)).toBeLessThan(.001);
  }
 });
 it('closes both upper bow sides between the lower hull and working deck',()=>{
  const vessel=fleet.find(v=>v.id==='black-pearl')!,scale=vessel.length/100,material=new MeshBasicMaterial({side:DoubleSide});
  const geometries=new Map<string,ReturnType<typeof makeGeometry>>();
  const meshes=parts.filter(c=>c.systemId==='structure'&&!c.interior).map(c=>{
   const section=hullSectionFor(c),key=`${c.shape}/${section}`;
   if(!geometries.has(key))geometries.set(key,makeGeometry(c.shape,1,'pirate',section));
   const mesh=new Mesh(geometries.get(key)!,material);mesh.position.fromArray(c.position);mesh.scale.fromArray(c.size);mesh.rotation.set(...c.rotation);mesh.updateMatrixWorld();return mesh;
  });
  try{
   for(const side of [-1,1])for(let step=0;step<=59;step++)for(const y of [8,10,12]){
    const x=36+step*.2,ray=new Raycaster(new Vector3(x*scale,y*scale,side*vessel.beam),new Vector3(0,0,-side));
    const hit=ray.intersectObjects(meshes,false)[0];
    expect(hit,`uncovered bow at x${x.toFixed(1)}, y${y}, side${side}`).toBeDefined();
    expect(hit.point.z*side,`ray passed through to opposite bow at x${x.toFixed(1)}, y${y}`).toBeGreaterThan(.005);
   }
  }finally{geometries.forEach(g=>g.dispose());material.dispose();}
 });
 it('contains period systems rather than modern machinery fillers',()=>{
  expect(parts.filter(c=>!c.decorative).length).toBeGreaterThanOrEqual(1476);
  expect(parts.some(c=>/diesel|generator|switchboard|radar|propeller|electric motor/i.test(c.name))).toBe(false);
  expect(parts.filter(c=>/deadeye/.test(c.name)).length).toBeGreaterThan(20);
  expect(parts.filter(c=>/ratline/.test(c.name)).every(c=>c.decorative)).toBe(true);
 });
 it('opens exterior cabin joinery during inspection without blocking the visible interior',()=>{
  for(const name of ['Forward cabin screen, port panel','Forward cabin screen, starboard panel','Cabin door leaf']){
   const wall=part(name);expect(wall.interior).toBe(false);expect(enclosureClass(wall)).toBe('envelope');
   expect(canPickComponent(wall,'Exterior',1)).toBe(true);
   expect(canPickComponent(wall,'X-ray',-1)).toBe(false);
   expect(canPickComponent(wall,'Cutaway',1)).toBe(false);
   expect(canPickComponent(wall,'Cutaway',-1)).toBe(true);
  }
 });
 it.each([
  ['Mainmast 1 black sail','cloth'],['Mainmast lower mast','wood'],['Mainmast 1 yard','wood'],
  ['Port lower gun 1 barrel','iron'],['Port lower gun 1 carriage','wood'],
  ['Mainmast 1 port brace','rope'],['Mainmast 1 port lift','rope'],['Mainmast deadeye -1-1','wood'],
  ['Anchor stock -1','wood'],['Anchor cable -1','rope'],['Lantern 1 translucent panes','glass'],
 ] as const)('%s receives its physical material rather than an assembly-name guess',(name,surface)=>{expect(componentSurface(part(name))).toBe(surface);});
});
