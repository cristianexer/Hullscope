import { describe, expect, it } from 'vitest';
import { parseYachtRelease } from '../src/data/yachts/releaseSchema';
import { legacyFleet, fleet } from '../src/data/fleet';
import { vesselManifestUrl } from '../src/assets/yachts';

describe('pinned yacht release admission',()=>{
 it('keeps the original fleet and Octopus route intact before publication',()=>{
  expect(legacyFleet).toHaveLength(29);
  expect(legacyFleet.filter(vessel=>!vessel.fictional)).toHaveLength(28);
  expect(fleet.find(vessel=>vessel.id==='octopus')?.family.group).toBe('Yachts');
  expect(legacyFleet.every(vessel=>fleet.some(item=>item.id===vessel.id))).toBe(true);
 });
 it('rejects moving revisions and incomplete pin pairs',()=>{
  const base={schemaVersion:1,repository:'example/hullscope-yachts',revision:'a'.repeat(40),vessels:[]};
  expect(parseYachtRelease(base).revision).toBe('a'.repeat(40));
  expect(()=>parseYachtRelease({...base,revision:'main'})).toThrow();
  expect(()=>parseYachtRelease({...base,revision:null})).toThrow(/pinned together/);
 });
 it('rejects a draft preview when building production',()=>{
  const preview={schemaVersion:1,repository:null,revision:null,preview:true,vessels:[]};
  expect(()=>parseYachtRelease(preview)).toThrow(/Draft/);
  expect(parseYachtRelease(preview,true).preview).toBe(true);
 });
 it('loads legacy manifests locally when yacht binaries use the Hub',()=>{
  const octopus=legacyFleet.find(vessel=>vessel.id==='octopus')!;
  expect(vesselManifestUrl(octopus)).toBe(`${import.meta.env.BASE_URL}models/octopus.json`);
 });
 it('preserves the draft status on a pinned published snapshot',()=>{
  expect(parseYachtRelease({schemaVersion:1,repository:'example/hullscope-yachts',revision:'a'.repeat(40),status:'draft',vessels:[]}).status).toBe('draft');
 });
});
