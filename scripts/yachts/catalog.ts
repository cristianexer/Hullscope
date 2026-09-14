import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { yachtResearchSchema } from '../../src/data/yachts/researchSchema';
import type { YachtResearch } from '../../src/data/yachts/researchSchema';
import { applyDispositions, auditYachtSeed } from '../../src/data/yachts/seedAudit';
import type { DispositionInput } from '../../src/data/yachts/seedAudit';

export interface YachtReleaseSelection {
 schemaVersion: 1;
 status: 'draft-scope' | 'validated';
 description: string;
 maxPerBrand: number;
 ids: string[];
}

export async function readReleaseSelection(): Promise<YachtReleaseSelection> {
 const selection=JSON.parse(await readFile('research/yachts/release-selection.json','utf8')) as Partial<YachtReleaseSelection>;
 if(selection.schemaVersion!==1||!Array.isArray(selection.ids)||selection.ids.length!==20||selection.maxPerBrand!==10)throw new Error('Release selection must contain exactly 20 generations with a maximum of 10 per brand.');
 if(new Set(selection.ids).size!==selection.ids.length)throw new Error('Release selection contains duplicate generation IDs.');
 return {schemaVersion:1,status:selection.status==='validated'?'validated':'draft-scope',description:selection.description??'',maxPerBrand:10,ids:[...selection.ids]};
}

export async function readResearch(ids?:readonly string[]): Promise<YachtResearch[]> {
 const paths=(await readdir('research/yachts')).filter(name=>/^(princess|sunseeker)-batch-\d+\.json$/.test(name)).sort();
 const records:YachtResearch[]=[];
 for(const path of paths){
  const batch=JSON.parse(await readFile(`research/yachts/${path}`,'utf8'));
  if(!Array.isArray(batch.models)||batch.models.length>8)throw new Error(`Research batch must contain at most eight profiles: ${path}`);
  for(const model of batch.models){
   if(ids&&!ids.includes(model?.id))continue;
   const parsed=yachtResearchSchema.safeParse(model);
   if(!parsed.success)throw new Error(`${path} / ${model?.id??'unknown identity'}: ${parsed.error.message}`);
   records.push(parsed.data);
  }
 }
 if(new Set(records.map(model=>model.id)).size!==records.length)throw new Error('Duplicate canonical generation IDs across research batches.');
 return records;
}

export async function readReleaseResearch(): Promise<YachtResearch[]> {
 const selection=await readReleaseSelection();
 const records=await readResearch();
 const byId=new Map(records.map(model=>[model.id,model]));
 const selected=selection.ids.map(id=>byId.get(id));
 if(selected.some(model=>!model))throw new Error(`Release selection references an unresearched generation: ${selection.ids[selected.findIndex(model=>!model)]}`);
 const result=selected as YachtResearch[];
 const byBrand=result.reduce<Record<string,number>>((counts,model)=>({...counts,[model.brand]:(counts[model.brand]??0)+1}),{});
 if(byBrand.Princess!==10||byBrand.Sunseeker!==10)throw new Error(`Release selection must contain 10 Princess and 10 Sunseeker generations: ${JSON.stringify(byBrand)}`);
 return result;
}

export async function auditCatalog() {
 const seed=auditYachtSeed(await readFile('research/sunseeker-princess-yacht-range.md','utf8'));
 const records=await readResearch();
 const selected=await readReleaseResearch();
 const assignments:Record<string,DispositionInput>={};
 for(const path of (await readdir('research/yachts')).filter(name=>/^dispositions-[a-z0-9-]+\.json$/.test(name)).sort()){
  const file=JSON.parse(await readFile(`research/yachts/${path}`,'utf8'));
  for(const entry of file.dispositions){
   if(assignments[entry.rowId])throw new Error(`Duplicate disposition assignment: ${entry.rowId}`);
   if(entry.disposition.canonicalId&&!records.some(model=>model.id===entry.disposition.canonicalId))throw new Error(`Disposition references an unresearched generation: ${entry.disposition.canonicalId}`);
   assignments[entry.rowId]=entry.disposition;
  }
 }
 const rows=applyDispositions(seed.rows,assignments);
 const dispositions=rows.reduce<Record<string,number>>((counts,row)=>({...counts,[row.disposition.type]:(counts[row.disposition.type]??0)+1}),{});
 await mkdir('output/yachts',{recursive:true});
 await writeFile('output/yachts/seed-audit.json',JSON.stringify({...seed,rows,counts:{...seed.counts,byDisposition:dispositions}},null,2));
 await writeFile('output/yachts/researched-catalog-all.json',JSON.stringify(records,null,2));
 await writeFile('output/yachts/researched-catalog.json',JSON.stringify(selected,null,2));
 await writeFile('output/yachts/release-selection.json',JSON.stringify(await readReleaseSelection(),null,2));
 return {seedRows:seed.counts.totalRows,researchedGenerations:selected.length,availableGenerations:records.length,unresolvedSeedRows:rows.filter(row=>row.disposition.type==='unresolved').length,publicationReady:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await auditCatalog(),null,2));
