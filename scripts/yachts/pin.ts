import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { authoredManifestSchema } from '../../src/data/schema';
import { yachtResearchSchema } from '../../src/data/yachts/researchSchema';
import { parseYachtRelease } from '../../src/data/yachts/releaseSchema';
import { assertAssetPath, createAssetResolver } from '../../src/assets/resolver';
import { sha256 } from './export';
import { yachtVessel } from './preview';

const {values}=parseArgs({options:{snapshot:{type:'string'},repository:{type:'string'},revision:{type:'string'},'allow-draft':{type:'boolean',default:false}}});
if(!values.snapshot||!values.repository||!values.revision)throw new Error('Specify an anonymously verified snapshot, repository, and full revision.');
createAssetResolver({provider:'huggingface',repository:values.repository,revision:values.revision});
const root=resolve(values.snapshot);
const checksumBytes=await readFile(`${root}/checksums.txt`);
const checksums=new Map<string,string>();
for(const line of checksumBytes.toString('utf8').trim().split('\n')){
 const match=/^([a-f0-9]{64}) {2}(.+)$/.exec(line);
 if(!match)throw new Error('Invalid checksum entry.');
 assertAssetPath(match[2]);
 if(checksums.has(match[2]))throw new Error('Duplicate checksum path.');
 checksums.set(match[2],match[1]);
}
// Recheck every file in the anonymous snapshot, including masters and images.
for(const [path,expected] of checksums){
 if(sha256(await readFile(`${root}/${path}`))!==expected)throw new Error(`Snapshot integrity failed: ${path}`);
}
const metadata=JSON.parse(await readFile(`${root}/release.json`,'utf8'));
if(metadata.project!=='hullscope-yachts'||!['draft','validated'].includes(metadata.status))throw new Error('Unexpected dataset release.');
if(metadata.status==='draft'&&!values['allow-draft'])throw new Error('Draft app publication requires explicit --allow-draft.');
const models=yachtResearchSchema.array().parse(JSON.parse(await readFile(`${root}/catalog/catalog.json`,'utf8')));
if(models.length!==metadata.models.length||models.some(model=>!metadata.models.includes(model.id)))throw new Error('Catalog and release generations disagree.');
const vessels=[],manifests=[],copies=[];
for(const model of models){
 const source=`models/${model.id}/manifest.json`;
 const manifest=authoredManifestSchema.parse(JSON.parse(await readFile(`${root}/${source}`,'utf8')));
 const vessel=yachtVessel(model,manifest,`thumbnails/${model.id}.png`);
 if(metadata.status==='draft')vessel.modelNote=`DRAFT RECONSTRUCTION — visual review requires changes. ${vessel.modelNote}`;
 vessels.push(vessel);
 manifests.push({id:model.id,path:vessel.yacht!.manifest,sha256:checksums.get(source)!});
 copies.push({source:`${root}/${source}`,destination:`public/${vessel.yacht!.manifest}`});
}
const release=parseYachtRelease({schemaVersion:1,repository:values.repository,revision:values.revision,status:metadata.status,vessels,manifests});
for(const copy of copies){await mkdir(resolve(copy.destination,'..'),{recursive:true});await copyFile(copy.source,copy.destination);}
await writeFile('src/data/yachts/release.json',JSON.stringify(release,null,2)+'\n');
console.log(JSON.stringify({repository:release.repository,revision:release.revision,status:release.status,vessels:vessels.length,verifiedFiles:checksums.size+1,checksumsSha256:sha256(checksumBytes)},null,2));
