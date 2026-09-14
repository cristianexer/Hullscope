import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import type { Document, Node, Scene } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, prune, simplify } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import { Box3, Matrix4, Vector3 } from 'three';
import { authoredManifestSchema } from '../../src/data/schema';
import type { AuthoredManifest, Vec3, YachtAsset } from '../../src/data/schema';
import { readResearch } from './catalog';
import { assertEmbeddedGLB } from '../../src/assets/glb';
export { assertEmbeddedGLB } from '../../src/assets/glb';

export const sha256 = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
export const sourceId = (url: string) => `source-${sha256(url).slice(0,16)}`;

function owner(node:Node):string|null {
 let cursor:Node|null=node;
 while(cursor){const id=cursor.getExtras().componentId;if(typeof id==='string')return id;cursor=cursor.getParentNode();}
 return null;
}

function triangleCount(node:Node):number {
 const mesh=node.getMesh();if(!mesh)return 0;
 return mesh.listPrimitives().reduce((total,primitive)=>total+(primitive.getIndices()?.getCount()??primitive.getAttribute('POSITION')?.getCount()??0)/3,0);
}

/** Remove Blender-only review helpers that can be carried by a parent root. */
function stripReviewHelpers(document:Document) {
 const doomed:Array<{scene:Scene;node:Node}> = [];
 for(const scene of document.getRoot().listScenes())scene.traverse(node=>{
  const name=node.getName().toLowerCase(),extras=node.getExtras();
  if(name.includes('review water')||extras.reviewEnvironment===true)doomed.push({scene,node});
 });
 for(const {scene,node} of doomed){
  const parent=node.getParentNode();
  if(parent)parent.removeChild(node);else scene.removeChild(node);
  node.dispose();
 }
 return doomed.length;
}

/** Keep one structural render mesh per selectable assembly in the mobile LOD. */
function pruneDecorativeForLod1(document:Document) {
 const byComponent=new Map<string,Node[]>();
 for(const scene of document.getRoot().listScenes())scene.traverse(node=>{
  if(!node.getMesh())return;
  const id=node.getExtras().componentId;
  if(typeof id!=='string')return;
  const nodes=byComponent.get(id)??[];nodes.push(node);byComponent.set(id,nodes);
 });
 for(const nodes of byComponent.values()){
  const structural=nodes.filter(node=>node.getExtras().decorative!==true);
  const keep=new Set(structural.length?structural:[nodes.reduce((best,node)=>triangleCount(node)>triangleCount(best)?node:best,nodes[0])]);
  for(const node of nodes)if(node.getExtras().decorative===true&&!keep.has(node))node.setMesh(null);
 }
}

export function inspectGeometry(document:Document,expectedIds:readonly string[]) {
 const bounds=new Map<string,Box3>();const overall=new Box3();let renderMeshes=0,drawCalls=0,triangles=0;
 for(const scene of document.getRoot().listScenes())scene.traverse(node=>{
  const mesh=node.getMesh();if(!mesh)return;
  const id=owner(node);if(!id||!expectedIds.includes(id))throw new Error(`Undeclared render assembly: ${node.getName()}`);
  const box=bounds.get(id)??new Box3(),matrix=new Matrix4().fromArray(node.getWorldMatrix());renderMeshes++;
  for(const primitive of mesh.listPrimitives()){
   const position=primitive.getAttribute('POSITION'),normal=primitive.getAttribute('NORMAL');
   if(!position||!normal||primitive.getMode()!==4)throw new Error(`Expected triangle geometry with normals: ${node.getName()}`);
   const material=primitive.getMaterial();if(!material)throw new Error(`Missing authored material: ${node.getName()}`);
   drawCalls++;triangles+=(primitive.getIndices()?.getCount()??position.getCount())/3;
   for(let i=0;i<position.getCount();i++){
    const point=new Vector3().fromArray(position.getElement(i,[])).applyMatrix4(matrix);
    if(!point.toArray().every(Number.isFinite))throw new Error('Nonfinite authored vertex.');
    box.expandByPoint(point);
   }
  }
  bounds.set(id,box);overall.union(box);
 });
 if(expectedIds.some(id=>!bounds.has(id)))throw new Error('An assembly disappeared from the exported detail level.');
 return {bounds,overall,renderMeshes,drawCalls,triangles};
}

/** Optimize an exchange produced through Blender MCP; never launch or overwrite Blender masters. */
export async function exportYacht(id:string) {
 if(!/^[a-z0-9-]+$/.test(id))throw new Error('Unsafe generation ID.');
 const research=(await readResearch([id])).find(model=>model.id===id);
 if(!research)throw new Error(`No audited research profile: ${id}`);
 const assetRoot=resolve(process.env.HULLSCOPE_YACHT_ASSET_ROOT ?? '.tools/yachts');
 const master=resolve(assetRoot,'masters',`${id}.blend`),exchange=resolve(assetRoot,'exchange',id),destination=resolve(assetRoot,'assets/models',id);
 const before=sha256(await readFile(master));
 const authoring=JSON.parse(await readFile(`${exchange}/authoring.json`,'utf8')) as {masterSha256:string;manifest:AuthoredManifest;chunks:{name:string;kind:'exterior'|'interior';componentIds:string[];deckId?:string}[]};
 if(authoring.masterSha256!==before)throw new Error('Exchange is stale. Export this master through Blender MCP before optimizing.');
 if(authoring.manifest.vesselId!==id)throw new Error('Master generation identity mismatch.');
 await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready,MeshoptSimplifier.ready]);
 const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
 await mkdir(destination,{recursive:true});
 const assets:YachtAsset[]=[],metrics:Record<string,unknown>[]=[],bounds=new Map<string,Box3>();
 for(const chunk of authoring.chunks){
  if(!/^[a-zA-Z0-9._-]+$/.test(chunk.name))throw new Error('Unsafe exported chunk name.');
  const original=await readFile(`${exchange}/${chunk.name}.glb`);assertEmbeddedGLB(original);
  for(const level of [0,1] as const){
   const document=await io.readBinary(original);
   stripReviewHelpers(document);
   // LOD0 is the authored high-detail stream; LOD1 is the bounded mobile/detail
   // fallback. Keep authored fittings and furniture in both streams: removing
   // every decorative node from a component makes the yacht look unfinished
   // on software-renderer/browser paths. Simplification still reduces the
   // geometry payload without destroying recognition cues.
   if(level===1){
    pruneDecorativeForLod1(document);
    await document.transform(prune());
    await document.transform(simplify({simplifier:MeshoptSimplifier,ratio:.68,error:.0005,lockBorder:false}));
   }
   // LOD1 must remain a distinct, smaller delivery stream even when a very
   // small chunk has too few triangles for simplification to remove a face.
   // Tighter quantization preserves the authored silhouette while preventing
   // byte-identical mobile assets from silently passing as a reduced level.
   await document.transform(meshopt({
    encoder:MeshoptEncoder,
    level:'medium',
    quantizePosition:level===1?14:16,
    quantizeNormal:level===1?10:12,
    quantizeTexcoord:level===1?12:14,
   }));
   const binary=await io.writeBinary(document);assertEmbeddedGLB(binary);
   const verified=await io.readBinary(binary),inspection=inspectGeometry(verified,chunk.componentIds);
   if(level===1)for(const [id,box] of inspection.bounds)bounds.set(id,(bounds.get(id)??new Box3()).union(box));
   const filename=`${chunk.name}.lod${level}.glb`,path=`models/${id}/${filename}`;
   await writeFile(`${destination}/${filename}`,binary);
   assets.push({id:`${chunk.name}-lod${level}`,kind:chunk.kind,level,path,bytes:binary.length,sha256:sha256(binary),componentIds:chunk.componentIds,...(chunk.deckId?{deckId:chunk.deckId}:{})});
   metrics.push({path,level,bytes:binary.length,renderMeshes:inspection.renderMeshes,triangles:inspection.triangles,estimatedDrawCalls:inspection.drawCalls});
  }
 }
 const sources=new Set(research.sources.map(source=>source.url));
 const normalizeSources=(ids:string[])=>ids.map(id=>{
  if(sources.has(id))return sourceId(id);
  if([...sources].some(url=>sourceId(url)===id))return id;
  throw new Error(`Master cites a source absent from its research dossier: ${id}`);
 });
 const components=authoring.manifest.components.map(component=>{
  const box=bounds.get(component.id);if(!box||box.isEmpty())throw new Error(`Missing assembly geometry: ${component.id}`);
  const size=box.getSize(new Vector3()).toArray() as Vec3;
  if(size.some(value=>value<=0))throw new Error(`Zero-volume selectable bounds: ${component.id}`);
  return {...component,shape:component.shape ?? 'box',position:box.getCenter(new Vector3()).toArray() as Vec3,size,rotation:[0,0,0] as Vec3,sourceIds:normalizeSources(component.sourceIds)};
 });
 const manifest=authoredManifestSchema.parse({...authoring.manifest,components,assets,lods:[],meaningfulCount:components.filter(c=>!c.decorative).length,rooms:authoring.manifest.rooms.map(room=>({...room,sourceIds:normalizeSources(room.sourceIds)}))});
 const overall=[...bounds.values()].reduce((result,box)=>result.union(box),new Box3()).getSize(new Vector3());
 const lengthError=research.dimensions.lengthM===null?null:Math.abs(overall.x/research.dimensions.lengthM-1),beamError=research.dimensions.beamM===null?null:Math.abs(overall.z/research.dimensions.beamM-1);
 const report={id,masterSha256:before,selectableAssemblies:manifest.meaningfulCount,dimensions:{lengthM:overall.x,beamM:overall.z,heightM:overall.y,lengthError,beamError,withinOnePercent:lengthError!==null&&beamError!==null&&lengthError<=.01&&beamError<=.01},assets:metrics,visualReview:'pending',publicationReady:false};
 await writeFile(`${destination}/manifest.json`,JSON.stringify(manifest,null,2));
 await writeFile(`${destination}/technical-review.json`,JSON.stringify(report,null,2));
 if(sha256(await readFile(master))!==before)throw new Error('Master changed during optimization; repeat its MCP export.');
 console.log(JSON.stringify(report,null,2));
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==3)throw new Error('Usage: node --import tsx scripts/yachts/export.ts CANONICAL_GENERATION_ID');
 await exportYacht(process.argv[2]);
}
