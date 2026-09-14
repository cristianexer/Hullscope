import { spawnSync } from 'node:child_process';
import { copyFile, lstat, mkdir, mkdtemp, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { authoredManifestSchema } from '../../src/data/schema';
import { qualityReviewSchema, reviewFailures, collectionFailures } from '../../src/data/yachts/quality';
import type { YachtSeedRow } from '../../src/data/yachts/seedAudit';
import { assertAssetPath } from '../../src/assets/resolver';
import { auditCatalog, readReleaseResearch, readReleaseSelection } from './catalog';
import { sha256 } from './export';

const root=resolve('.tools/yachts');
const permittedExtensions=new Set(['.md','.json','.csv','.parquet','.glb','.blend','.png','.jpg','.webp','.py','.txt']);
export async function inspectStage(directory:string) {
 const files:{path:string;bytes:number;sha256:string}[]=[];
 async function walk(folder:string){
  for(const name of await readdir(folder)){
   const path=resolve(folder,name),entry=await lstat(path),rel=relative(directory,path).split(sep).join('/');
   assertAssetPath(rel);
   if(entry.isSymbolicLink())throw new Error(`Symlinks are not permitted in uploads: ${rel}`);
   if(entry.isDirectory()){await walk(path);continue;}
   const extension=name.includes('.')?name.slice(name.lastIndexOf('.')):'';
   if(!permittedExtensions.has(extension)||/(^|\/)(?:\.env|\.git|\.cache|logs?|node_modules|.*token.*)(\/|\.|$)/i.test(rel))throw new Error(`Unintended staged file: ${rel}`);
   const bytes=await readFile(path);
   // Scan originals and binary metadata without printing matching content.
   if(/(?:hf_[A-Za-z0-9]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{24,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(bytes.toString('latin1')))throw new Error(`Potential credential in staged file: ${rel}`);
   files.push({path:rel,bytes:bytes.length,sha256:sha256(bytes)});
  }
 }
 await walk(directory);
 return files.sort((a,b)=>a.path.localeCompare(b.path));
}

export async function stageDataset() {
 const audit=await auditCatalog(),models=await readReleaseResearch(),selection=await readReleaseSelection();
 const seed=JSON.parse(await readFile('output/yachts/seed-audit.json','utf8')) as {rows:YachtSeedRow[]};
 const selectedIds=new Set(selection.ids);
 const selectedRows=seed.rows.filter(row=>{
  const id='canonicalId' in row.disposition?row.disposition.canonicalId:undefined;
  return Boolean(id&&selectedIds.has(id));
 });
 const errors=collectionFailures(selectedRows,models,models.filter(model=>model.productionStatus!=='announced').map(model=>model.id));
 if(errors.length)throw new Error(`Collection is incomplete; nothing staged.\n${errors.slice(0,30).join('\n')}\n${errors.length} release blockers in total.`);
 const production=models.filter(model=>model.productionStatus!=='announced');
 const authoringIndex=JSON.parse(await readFile('scripts/yachts/authoring-index.json','utf8')) as Record<string,string>;
 const inputs:{source:string;path:string}[]=[];
 for(const model of production){
  const authoringScript=authoringIndex[model.id];
  if(!authoringScript||!/^[a-z0-9-]+\.py$/.test(authoringScript))throw new Error(`Missing original authoring source: ${model.id}`);
  const source=resolve(root,'assets/models',model.id),manifestBytes=await readFile(`${source}/manifest.json`),manifest=authoredManifestSchema.parse(JSON.parse(manifestBytes.toString('utf8')));
  const master=resolve(root,'masters',`${model.id}.blend`),masterHash=sha256(await readFile(master));
  const reviewPath=resolve(root,'review',model.id,'quality.json'),review=qualityReviewSchema.parse(JSON.parse(await readFile(reviewPath,'utf8')));
  const failures=reviewFailures(manifest,review);
  if(review.masterSha256!==masterHash||review.manifestSha256!==sha256(manifestBytes))failures.push('Review no longer matches authored master/manifest.');
  const technical=JSON.parse(await readFile(`${source}/technical-review.json`,'utf8'));
  if(technical.masterSha256!==masterHash||technical.dimensions.withinOnePercent!==true)failures.push('Export dimensions or master checksum failed.');
  if(failures.length)throw new Error(`${model.id} is not ready:\n${failures.join('\n')}`);
  for(const asset of manifest.assets){
   if(!asset.path.startsWith(`models/${model.id}/`))throw new Error('A yacht asset points outside its generation directory.');
   const path=resolve(root,'assets',asset.path),bytes=await readFile(path);
   if(bytes.length!==asset.bytes||sha256(bytes)!==asset.sha256)throw new Error(`Asset integrity failure: ${asset.path}`);
   inputs.push({source:path,path:asset.path});
  }
  inputs.push({source:`${source}/manifest.json`,path:`models/${model.id}/manifest.json`},{source:`${source}/technical-review.json`,path:`quality/${model.id}/technical.json`},{source:reviewPath,path:`quality/${model.id}/review.json`},{source:master,path:`masters/${model.id}.blend`});
  inputs.push({source:resolve('scripts/yachts/models',authoringScript),path:`authoring/models/${authoringScript}`});
  for(const screenshot of review.screenshots){
   const path=resolve(root,'review',model.id,screenshot.path);
   const bytes=await readFile(path);if(sha256(bytes)!==screenshot.sha256)throw new Error(`Review image changed: ${model.id}/${screenshot.path}`);
   inputs.push({source:path,path:`quality/${model.id}/${screenshot.path}`});
  }
  const thumbnail=review.screenshots.find(image=>image.view==='three-quarter')!;
  inputs.push({source:resolve(root,'review',model.id,thumbnail.path),path:`thumbnails/${model.id}${thumbnail.path.slice(thumbnail.path.lastIndexOf('.'))}`});
 }
 await mkdir(`${root}/stages`,{recursive:true});
 const stage=await mkdtemp(`${root}/stages/release-`);
 const copied=new Set<string>();
 for(const input of inputs){
  assertAssetPath(input.path);if(copied.has(input.path))continue;
  const sourceStat=await lstat(input.source);if(!sourceStat.isFile()||sourceStat.isSymbolicLink())throw new Error('Upload input must be a regular file.');
  const actualSource=await realpath(input.source),assetRoot=await realpath(root),scriptRoot=await realpath('scripts/yachts/models');
  if(!actualSource.startsWith(assetRoot+sep)&&!actualSource.startsWith(scriptRoot+sep))throw new Error('Upload input resolves outside the explicit original-asset roots.');
  const destination=resolve(stage,input.path);await mkdir(dirname(destination),{recursive:true});await copyFile(input.source,destination);copied.add(input.path);
 }
 const tables=spawnSync(resolve('.tools/yacht-publish/bin/python'),['scripts/yachts/tables.py','output/yachts/researched-catalog.json',`${stage}/catalog`],{stdio:'inherit'});
 if(tables.status!==0)throw new Error('Catalog table generation failed.');
 await mkdir(`${stage}/provenance`,{recursive:true});
 await copyFile('output/yachts/seed-audit.json',`${stage}/provenance/seed-dispositions.json`);
 await copyFile('output/yachts/release-selection.json',`${stage}/provenance/release-selection.json`);
 await writeFile(`${stage}/provenance/sources.json`,JSON.stringify(models.map(model=>({id:model.id,sources:model.sources,uncertainties:model.uncertainties})),null,2));
 await copyFile('docs/yachts/DATASET_CARD.md',`${stage}/README.md`);
 await copyFile('docs/yachts/ASSET_LICENSE.md',`${stage}/LICENSE.md`);
 await copyFile('docs/yachts/DATASET_USAGE.md',`${stage}/USAGE.md`);
 await mkdir(`${stage}/authoring`,{recursive:true});
 await copyFile('scripts/yachts/export_blender.py',`${stage}/authoring/export_blender.py`);
 await copyFile('scripts/yachts/authoring-index.json',`${stage}/authoring/index.json`);
 await copyFile('docs/yachts/AUTHORING.md',`${stage}/authoring/README.md`);
 await writeFile(`${stage}/release.json`,JSON.stringify({schemaVersion:1,project:'hullscope-yachts',status:'validated',catalogGenerations:models.length,productionGenerations:production.length,availableResearchedGenerations:audit.availableGenerations,seedRows:audit.seedRows,unresolvedSeedRows:audit.unresolvedSeedRows,scope:selection,models:production.map(model=>model.id),createdAt:new Date().toISOString()},null,2));
 const files=await inspectStage(stage);
 await writeFile(`${stage}/checksums.txt`,files.map(file=>`${file.sha256}  ${file.path}`).join('\n')+'\n');
 const checksumBytes=await readFile(`${stage}/checksums.txt`);
 const result={stage,files:files.length+1,bytes:files.reduce((sum,file)=>sum+file.bytes,0)+checksumBytes.length,checksumsSha256:sha256(checksumBytes),published:false};
 console.log(JSON.stringify(result,null,2));return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await stageDataset();
