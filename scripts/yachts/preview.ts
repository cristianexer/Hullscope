import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AuthoredManifest, VesselRecord } from '../../src/data/schema';
import type { YachtResearch } from '../../src/data/yachts/researchSchema';
import { yachtVesselSchema } from '../../src/data/yachts/releaseSchema';
import { readResearch } from './catalog';
import { sourceId } from './export';

export function yachtVessel(model:YachtResearch,manifest:AuthoredManifest,thumbnail:string,preview=false):VesselRecord {
 if(model.dimensions.lengthM===null||model.dimensions.beamM===null||model.productionStart===null)throw new Error('App geometry requires supported length, beam and generation year.');
 const maxY=Math.max(...manifest.components.map(component=>component.position[1]+component.size[1]/2)),minY=Math.min(...manifest.components.map(component=>component.position[1]-component.size[1]/2));
 const sources=model.sources.map(source=>({...source,id:sourceId(source.url),published:null}));
 return yachtVesselSchema.parse({
  id:model.id,name:`${model.brand} ${model.name}`,family:{id:`${model.brand.toLowerCase()}-${model.range.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,name:`${model.brand} ${model.range}`,group:'Yachts',description:model.visual.superstructureDescription,subtypes:[model.type]},
  yacht:{brand:model.brand,range:model.range,type:model.type,generation:model.generation,productionStart:model.productionStart,productionEnd:model.productionEnd,productionStatus:model.productionStatus,aliases:model.aliases,thumbnail,manifest:preview?`yacht-assets/models/${model.id}/manifest.json`:`yachts/${model.id}/manifest.json`},
  subtitle:model.type,purpose:'Explore the documented configuration and reference-informed exterior and interior arrangement.',length:model.dimensions.lengthM,beam:model.dimensions.beamM,depth:maxY-minY,year:model.productionStart,hullColor:'#f4f1e9',deckColor:'#a48a68',kind:'yacht',configuration:model.referenceConfiguration,dimensionStatus:'verified',
  facts:model.facts.map(fact=>({label:fact.label,value:fact.value,unit:fact.unit,status:fact.status,sourceId:fact.status==='unknown'?null:fact.sourceUrl?sourceId(fact.sourceUrl):null,effective:null,note:fact.note})),sources,
  signature:model.visual.distinctiveFeatures.join(' · '),operation:'Room and deck cameras inspect the representative configuration. Equipment arrangements marked reconstructed are illustrative, not a factory survey.',efficiency:'Recorded performance depends on propulsion option, loading and conditions; no design or fuel-consumption simulation is implied.',risk:'Do not use this educational reconstruction for navigation, vessel operation, emergency planning or engineering.',modelNote:`${preview?'DRAFT — NOT RELEASE-APPROVED. ':''}${manifest.fidelity} ${model.uncertainties.join(' ')}`,
 });
}
export async function preparePreview(ids:string[]){
 if(!ids.length)throw new Error('Specify one or more exported generation IDs for local QA.');
 const models=await readResearch(ids);
 if(models.length!==new Set(ids).size)throw new Error('Some preview generations lack research records.');
 const vessels=[];
 for(const model of models){
  const manifest=JSON.parse(await readFile(`.tools/yachts/assets/models/${model.id}/manifest.json`,'utf8')) as AuthoredManifest;
  // No reference image is used as a preview thumbnail. Authors/exporters supply original renders.
  const thumbnail=`yacht-assets/thumbnails/${model.id}.png`;
  vessels.push(yachtVessel(model,manifest,thumbnail,true));
 }
 await mkdir('.tools/yachts/preview',{recursive:true});
 await writeFile('.tools/yachts/preview/release.json',JSON.stringify({schemaVersion:1,repository:null,revision:null,preview:true,vessels},null,2));
 console.log(JSON.stringify({previewOnly:true,vessels:vessels.map(vessel=>vessel.id),command:'HULLSCOPE_YACHT_PREVIEW=1 npm run dev'},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await preparePreview(process.argv.slice(2));
