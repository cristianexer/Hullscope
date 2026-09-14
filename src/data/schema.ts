import { z } from 'zod';
import { assertAssetPath } from '../assets/resolver';
export const modes = ['Explore','Performance','Risk'] as const;
export const views = ['Exterior','X-ray','Cutaway','Exploded'] as const;
export type Mode = typeof modes[number];
export type View = typeof views[number];
export const vectorSchema = z.tuple([z.number(),z.number(),z.number()]);
export type Vec3 = z.infer<typeof vectorSchema>;
export const sourceSchema = z.object({id:z.string(),publisher:z.string(),title:z.string(),url:z.url(),accessed:z.string(),published:z.string().nullable(),scope:z.string()});
export type Source = z.infer<typeof sourceSchema>;
export const factSchema = z.object({label:z.string(),value:z.union([z.string(),z.number()]).nullable(),unit:z.string(),status:z.enum(['verified','reported','estimated','inferred','unknown']),sourceId:z.string().nullable(),effective:z.string().nullable(),note:z.string().optional(),currency:z.string().optional(),valueType:z.string().optional()});
export type Fact = z.infer<typeof factSchema>;
export type VesselFamily = {id:string;name:string;group:string;description:string;subtypes:string[]};
export type YachtIdentity = {brand:'Sunseeker'|'Princess';range:string;type:string;generation:string;productionStart:number|null;productionEnd:number|null;productionStatus:'current'|'historical'|'announced'|'unknown';aliases:string[];thumbnail:string;manifest:string;};
export type VesselRecord = {fictional?:boolean;yacht?:YachtIdentity;id:string;name:string;family:VesselFamily;subtitle:string;purpose:string;length:number;beam:number;depth:number;year:number;hullColor:string;deckColor:string;kind:string;configuration:string;dimensionStatus:'verified'|'inferred';facts:Fact[];sources:Source[];signature:string;operation:string;efficiency:string;risk:string;modelNote:string;};
export const systemIds = ['structure','propulsion','electrical','fuel','cargo','navigation','safety','ballast','utilities','accommodation','mooring'] as const;
export type SystemId = typeof systemIds[number];
export type System = {id:SystemId;name:string;color:string;summary:string;operation:string;failure:string;dependencies:SystemId[];sourceIds:string[]};
export const componentSchema = z.object({id:z.string(),vesselId:z.string(),name:z.string(),systemId:z.enum(systemIds),assembly:z.string(),parentId:z.string().nullable(),shape:z.enum(['box','chamferedBox','cylinder','sphere','hull','deck','torus','cone','sail','triangularSail','barrel','timberFrame','cannonBarrel']),position:vectorSchema,size:vectorSchema,rotation:vectorSchema,color:z.string(),explode:vectorSchema,localExplode:vectorSchema,interior:z.boolean(),decorative:z.boolean(),fidelity:z.enum(['reconstructed','reference-informed']),purpose:z.string(),sourceIds:z.array(z.string()),enclosure:z.enum(['shell','envelope','equipment']).optional(),deckId:z.string().optional(),roomId:z.string().optional()});
export type Component = z.infer<typeof componentSchema>;
export const legacyManifestSchema = z.object({vesselId:z.string(),version:z.literal(1),units:z.literal('metres'),components:z.array(componentSchema),meaningfulCount:z.number(),lods:z.array(z.object({level:z.number(),url:z.string(),bytes:z.number()}))});
export const assetPathSchema = z.string().refine(value=>{try{assertAssetPath(value);return true;}catch{return false;}},'Expected a safe dataset-relative asset path');
export const yachtAssetSchema = z.object({id:z.string().min(1),kind:z.enum(['exterior','interior']),level:z.union([z.literal(0),z.literal(1)]),path:assetPathSchema,bytes:z.number().int().positive(),sha256:z.string().regex(/^[a-f0-9]{64}$/),componentIds:z.array(z.string()).min(1),deckId:z.string().optional()});
export const authoredManifestSchema = legacyManifestSchema.extend({
 version:z.literal(2),
 assets:z.array(yachtAssetSchema).min(2),
 decks:z.array(z.object({id:z.string(),name:z.string(),componentId:z.string()})),
 rooms:z.array(z.object({id:z.string(),name:z.string(),deckId:z.string(),componentId:z.string(),fidelity:z.enum(['reconstructed','reference-informed']),note:z.string(),sourceIds:z.array(z.string())})),
 cameras:z.array(z.object({id:z.string(),name:z.string(),position:vectorSchema,target:vectorSchema,roomId:z.string().optional(),deckId:z.string().optional()})),
 fidelity:z.string().min(1),
}).superRefine((manifest,context)=>{
 const fail=(message:string)=>context.addIssue({code:'custom',message});
 const parts=new Map(manifest.components.map(c=>[c.id,c]));
 if(parts.size!==manifest.components.length)fail('Component IDs must be unique.');
 if(manifest.meaningfulCount!==manifest.components.filter(c=>!c.decorative).length)fail('Meaningful count must match the inventory.');
 const decks=new Set(manifest.decks.map(d=>d.id)),rooms=new Set(manifest.rooms.map(r=>r.id));
 for(const values of [manifest.assets,manifest.decks,manifest.rooms,manifest.cameras])if(new Set(values.map(v=>v.id)).size!==values.length)fail('Asset, deck, room and camera IDs must be unique within their collections.');
 for(const c of manifest.components){
  if(c.vesselId!==manifest.vesselId||c.size.some(n=>n<=0))fail('Components must have the correct owner and positive bounds.');
  const ancestors=new Set([c.id]);let parent=c.parentId;
  while(parent){if(ancestors.has(parent)||!parts.has(parent)){fail('Invalid physical support hierarchy.');break;}ancestors.add(parent);parent=parts.get(parent)!.parentId;}
  if(c.deckId&&!decks.has(c.deckId)||c.roomId&&!rooms.has(c.roomId))fail('Unknown component room/deck.');
 }
 for(const asset of manifest.assets){
  if(asset.componentIds.some(id=>!parts.has(id)))fail('Unknown asset component.');
  if(asset.deckId&&!decks.has(asset.deckId))fail('Unknown asset deck.');
  if(new Set(asset.componentIds).size!==asset.componentIds.length)fail('Asset component IDs must be unique.');
 }
 for(const level of [0,1]){
  if(!manifest.assets.some(a=>a.kind==='exterior'&&a.level===level))fail('Both exterior detail levels are required.');
  const covered=new Set(manifest.assets.filter(a=>a.level===level).flatMap(a=>a.componentIds));
  if(manifest.components.some(c=>!covered.has(c.id)))fail('Every assembly must be represented at both detail levels.');
 }
 for(const deck of manifest.decks)if(!parts.has(deck.componentId))fail('Unknown deck component.');
 for(const room of manifest.rooms)if(!decks.has(room.deckId)||!parts.has(room.componentId))fail('Unknown room deck/component.');
 for(const camera of manifest.cameras)if(camera.roomId&&!rooms.has(camera.roomId)||camera.deckId&&!decks.has(camera.deckId))fail('Unknown camera room/deck.');
});
export const manifestSchema = z.discriminatedUnion('version',[legacyManifestSchema,authoredManifestSchema]);
export type ModelManifest = z.infer<typeof manifestSchema>;
export type AuthoredManifest = z.infer<typeof authoredManifestSchema>;
export type YachtAsset = z.infer<typeof yachtAssetSchema>;
export type GuidedTour = {id:string;title:string;steps:{title:string;body:string;system:SystemId;view:View;explode:number}[]};
