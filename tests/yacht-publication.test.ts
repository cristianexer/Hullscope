import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, writeFile, rm, symlink } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baselineInventoryRoles, collectionFailures, qualityReviewSchema, requiredQualityChecks, requiredVisualViews, reviewFailures } from '../src/data/yachts/quality';
import { auditYachtSeed } from '../src/data/yachts/seedAudit';
import { yachtResearchSchema } from '../src/data/yachts/researchSchema';
import type { AuthoredManifest } from '../src/data/schema';
import { inspectStage } from '../scripts/yachts/stage';

const folders:string[]=[];
afterEach(async()=>{for(const path of folders.splice(0))await rm(path,{recursive:true,force:true});});
const seed=auditYachtSeed(readFileSync('research/sunseeker-princess-yacht-range.md','utf8'));
const sun=yachtResearchSchema.parse(JSON.parse(readFileSync('research/yachts/sunseeker-batch-01.json','utf8')).models[0]);
function fixture(){
 const component=JSON.parse(readFileSync('public/models/sparky.json','utf8')).components[0];
 const manifest:AuthoredManifest={vesselId:'test',version:2,units:'metres',components:[{...component,id:'hull',vesselId:'test',parentId:null}],meaningfulCount:1,lods:[],assets:[],decks:[],rooms:[],cameras:[],fidelity:'synthetic test only'};
 const review=qualityReviewSchema.parse({id:'test',status:'approved',author:'author',reviewer:'independent-qa',reviewedAt:'2026-09-14T10:00:00Z',masterSha256:'a'.repeat(64),manifestSha256:'b'.repeat(64),checks:requiredQualityChecks.map(id=>({id,status:'pass',note:'Synthetic test assertion, not an actual yacht review.'})),screenshots:[...requiredVisualViews.map(view=>({view,path:`${view}.png`,sha256:'c'.repeat(64)})),...[0,50,100].map(explode=>({view:'exploded',explode,path:`exploded-${explode}.png`,sha256:'d'.repeat(64)}))],inventory:baselineInventoryRoles.map(role=>({role,applicability:'present',componentIds:['hull'],note:'Synthetic interface fixture only.'})),defects:[],uncertainties:[]});
 return {manifest,review};
}
describe('publication gates',()=>{
 it('cannot confuse the 172-row seed with a complete released collection',()=>{
  const failures=collectionFailures(seed.rows,[sun],[]);
  expect(failures.filter(item=>item.startsWith('Unresolved seed row:'))).toHaveLength(172);
  expect(failures).toContain(`No approved model: ${sun.id}`);
  expect(failures).toContain('Both manufacturers must be represented.');
 });
 it('requires independent inspection, every named view, rooms and inventory dispositions',()=>{
  const {manifest,review}=fixture();expect(reviewFailures(manifest,review)).toEqual([]);
  review.reviewer=review.author;review.screenshots=review.screenshots.filter(image=>image.view!=='stern');review.inventory.pop();
  manifest.rooms.push({id:'cabin',name:'Cabin',componentId:'hull',deckId:'lower',fidelity:'reconstructed',note:'Synthetic test.',sourceIds:[]});
  expect(reviewFailures(manifest,review)).toEqual(expect.arrayContaining(['An independent reviewer is required.','Missing visual evidence: stern','Missing room inspection: cabin','Inventory role needs one disposition: helms']));
 });
 it('rejects credentials and symlinks without echoing secret content',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'hullscope-stage-test-'));folders.push(directory);
  await writeFile(join(directory,'README.md'),'Original test documentation.');
  expect(await inspectStage(directory)).toHaveLength(1);
  await writeFile(join(directory,'data.json'),JSON.stringify({synthetic:'hf_'+'A'.repeat(25)}));
  await expect(inspectStage(directory)).rejects.toThrow('Potential credential in staged file: data.json');
  await rm(join(directory,'data.json'));
  await symlink(join(directory,'README.md'),join(directory,'copy.md'));
  await expect(inspectStage(directory)).rejects.toThrow('Symlinks are not permitted');
 });
 it('rejects caches and non-allowlisted upload files',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'hullscope-stage-test-'));folders.push(directory);
  await writeFile(join(directory,'debug.log'),'unrelated log');
  await expect(inspectStage(directory)).rejects.toThrow('Unintended staged file: debug.log');
 });
});
