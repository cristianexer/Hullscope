import { readFile, stat, readdir } from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { Euler, Quaternion } from 'three';
import assert from 'node:assert/strict';
import { fleet } from '../src/data/fleet';
import { commonSources } from '../src/data/systems';
import { manifestSchema, factSchema, sourceSchema, systemIds } from '../src/data/schema';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder': MeshoptDecoder});
await MeshoptDecoder.ready;
const realFleet=fleet.filter(vessel=>!vessel.fictional);
assert.equal(realFleet.length,28,'The original 28 real reference vessels remain present');
assert.equal(new Set(realFleet.map(v=>v.family.id)).size,28,'Each real reference family remains represented');
assert.equal(new Set(fleet.map(v=>v.id)).size,fleet.length);
assert.equal(new Set(fleet.map(v=>v.family.id)).size,fleet.length);
let bytes = 0;
let minimum = Infinity;
let total = 0;
for (const vessel of fleet) {
  const sources = [...vessel.sources, ...commonSources];
  if(vessel.fictional){
    assert.equal(vessel.dimensionStatus,'inferred',`${vessel.id}: fictional dimensions must not be presented as verified`);
    assert(/fictional/i.test(vessel.modelNote),`${vessel.id}: missing fictional-model disclosure`);
  }
  sources.forEach(source => sourceSchema.parse(source));
  vessel.facts.forEach(fact => {
    factSchema.parse(fact);
    assert.equal(fact.value === null, fact.status === 'unknown', `${vessel.id}: unknown facts must be null`);
    if (fact.status === 'verified') assert(sources.some(source => source.id === fact.sourceId));
  });
  const manifest = manifestSchema.parse(JSON.parse(await readFile(`public/models/${vessel.id}.json`, 'utf8')));
  assert.equal(manifest.vesselId, vessel.id);
  const ids = new Set(manifest.components.map(component => component.id));
  assert.equal(ids.size, manifest.components.length);
  const componentsById = new Map(manifest.components.map(component => [component.id, component]));
  const count = manifest.components.filter(component => !component.decorative).length;
  assert.equal(count, manifest.meaningfulCount);
  assert(count >= 300, `${vessel.id}: fewer than 300 meaningful components`);
  if (vessel.length >= 180) assert(count >= 800, `${vessel.id}: fewer than 800 meaningful components`);
  minimum = Math.min(minimum, count);
  total += count;
  for (const system of systemIds) assert(manifest.components.some(component => component.systemId === system && !component.decorative), `${vessel.id} missing ${system}`);
  for (const component of manifest.components) {
    assert.equal(component.vesselId, vessel.id);
    if (component.parentId) {
      assert(ids.has(component.parentId), `Missing parent ${component.parentId}`);
      assert.notEqual(component.parentId, component.id, `Self-parenting ${component.id}`);
      const ancestors = new Set([component.id]);
      let parentId: string | null = component.parentId;
      while (parentId) {
        assert(!ancestors.has(parentId), `${component.id}: cyclic support hierarchy`);
        ancestors.add(parentId);
        parentId = componentsById.get(parentId)?.parentId ?? null;
      }
    }
    assert(component.size.every(value => Number.isFinite(value) && value > 0));
    for (const vector of [component.position, component.rotation, component.explode, component.localExplode]) assert(vector.every(Number.isFinite), `${component.id}: nonfinite transform`);
    assert(component.purpose.length > 20);
    assert(component.sourceIds.every(id => sources.some(source => source.id === id)));
  }
  assert.deepEqual(manifest.lods.map(lod => lod.level).sort(), [0, 1]);
  for (const lod of manifest.lods) {
    assert(!lod.url.includes('..') && lod.url.startsWith('models/'), 'Asset must use a base-relative model URL');
    assert.equal((await stat('public/' + lod.url)).size, lod.bytes);
    assert(lod.bytes < 5_000_000);
    bytes += lod.bytes;
    const document = await io.read('public/' + lod.url);
    assert(document.getRoot().listExtensionsRequired().some(extension => extension.extensionName === 'EXT_meshopt_compression'), `${lod.url}: missing compression`);
    const nodes = document.getRoot().listNodes();
    assert.equal(nodes.length, manifest.components.length);
    const actual = new Map(nodes.map(node => [node.getExtras().componentId, node]));
    assert.equal(actual.size, manifest.components.length, `${lod.url}: repeated semantic IDs`);
    const upper=manifest.components.find(c=>c.name==='Outer hull shell');
    const lower=manifest.components.find(c=>c.name==='Antifouling underwater shell');
    if(upper&&lower){
      assert.deepEqual(upper.position,lower.position,`${lod.url}: split hull position`);
      assert.deepEqual(upper.size,lower.size,`${lod.url}: split hull scale`);
      const positions=[upper,lower].map(c=>actual.get(c.id)!.getMesh()!.listPrimitives()[0].getAttribute('POSITION')!);
      const seam=(p:typeof positions[number])=>{const a=p.getArray()!;const set=new Set<string>();for(let i=0;i<a.length;i+=3)if(Math.abs(a[i+1]+.16)<.00005)set.add([a[i],a[i+2]].map(n=>n.toFixed(4)).join('/'));return [...set].sort();};
      assert.deepEqual(seam(positions[0]),seam(positions[1]),`${lod.url}: mismatching exported paint seam`);
      assert(seam(positions[0]).length>40,`${lod.url}: missing exported paint seam`);
      for(let side=0;side<2;side++){const a=positions[side].getArray()!;for(let i=1;i<a.length;i+=3)assert(side===0?a[i]>=-.16005:a[i]<=-.15995,`${lod.url}: overlapping full shells`);}
    }
    for (const component of manifest.components) {
      const node = actual.get(component.id);
      assert(node, `Missing GLB component ${component.id}`);
      assert.equal(node.getExtras().systemId, component.systemId);
      assert.equal(node.getExtras().assembly, component.assembly);
      for (let axis = 0; axis < 3; axis++) {
        assert(Math.abs(node.getTranslation()[axis] - component.position[axis]) < .001, `${component.id}: incorrect translation`);
        assert(Math.abs(node.getScale()[axis] - component.size[axis]) < .001, `${component.id}: incorrect scale`);
      }
      const expected = new Quaternion().setFromEuler(new Euler(...component.rotation));
      assert(expected.angleTo(new Quaternion().fromArray(node.getRotation())) < .001, `${component.id}: incorrect rotation`);
      const mesh = node.getMesh();
      assert(mesh, `${component.id}: no mesh`);
      for (const primitive of mesh.listPrimitives()) {
        const position = primitive.getAttribute('POSITION');
        assert(position && position.getCount() >= 3, `${component.id}: no vertices`);
        const array = position.getArray();
        assert(array);
        for (const value of array) assert(Number.isFinite(value) && Math.abs(value) <= .501, `${component.id}: invalid unit geometry bounds`);
        const normals = primitive.getAttribute('NORMAL')?.getArray();
        assert(normals && [...normals].every(Number.isFinite), `${component.id}: invalid normals`);
        const indices = primitive.getIndices()?.getArray();
        if (indices) for (const index of indices) assert(Number.isInteger(index) && index >= 0 && index < position.getCount(), `${component.id}: invalid triangle index`);
      }
    }
  }
  assert(manifest.lods.reduce((sum, lod) => sum + lod.bytes, 0) < 20_000_000);
  const dossier = await readFile(`docs/dossiers/${vessel.id}.md`, 'utf8');
  assert(dossier.includes(vessel.name) && dossier.includes('reconstruction'), `${vessel.id}: missing reconstruction disclosure`);
  console.log(`PASS ${vessel.name} · ${count} components · 2 semantic LODs`);
}
assert(bytes < 800_000_000);
assert.deepEqual((await readdir('docs/dossiers')).filter(name=>name.endsWith('.md')).sort(),fleet.map(vessel=>`${vessel.id}.md`).sort(),'Reference dossiers must exactly match the current catalogue');
console.log(`VALIDATED: ${fleet.length} vessels (${realFleet.length} real references, ${fleet.length-realFleet.length} fictional), ${total} meaningful components, minimum ${minimum}, ${(bytes / 1048576).toFixed(2)} MiB of GLB assets. Structural validation does not establish replica accuracy.`);
