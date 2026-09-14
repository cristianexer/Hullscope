import { z } from 'zod';
import { assetPathSchema } from '../schema';
import type { AuthoredManifest } from '../schema';
import type { YachtResearch } from './researchSchema';
import type { YachtSeedRow } from './seedAudit';

const digest=z.string().regex(/^[a-f0-9]{64}$/);
export const requiredVisualViews=['port','starboard','bow','stern','above','below','three-quarter'] as const;
export const requiredQualityChecks=['identity','measurement-endpoints','dimensions-within-one-percent','distinctive-features','furnished-rooms','no-intersections','no-floating-fittings','closed-seams','normals','textures','camera-clipping','physical-supports','materials-in-all-views','both-detail-levels','reconstruction-disclosures'] as const;
export const baselineInventoryRoles=['hull','superstructure','electrical-power','fuel','freshwater-sanitation','ventilation-hvac','safety','mooring','engines','drives','helms'] as const;
export const qualityReviewSchema=z.object({
 id:z.string(),status:z.enum(['approved','changes-required']),author:z.string().min(1),reviewer:z.string().min(1),reviewedAt:z.iso.datetime(),masterSha256:digest,manifestSha256:digest,
 checks:z.array(z.object({id:z.enum(requiredQualityChecks),status:z.enum(['pass','fail']),note:z.string().min(1)})),
 screenshots:z.array(z.object({view:z.enum([...requiredVisualViews,'room','deck','exploded']),path:assetPathSchema,sha256:digest,roomId:z.string().optional(),deckId:z.string().optional(),explode:z.number().min(0).max(100).optional()})),
 inventory:z.array(z.object({role:z.enum(baselineInventoryRoles),applicability:z.enum(['present','not-applicable']),componentIds:z.array(z.string()),note:z.string().min(1)})),
 defects:z.array(z.string()),uncertainties:z.array(z.string()),
});
export type QualityReview=z.infer<typeof qualityReviewSchema>;

export function reviewFailures(manifest:AuthoredManifest,review:QualityReview):string[] {
 const errors:string[]=[];
 if(review.id!==manifest.vesselId)errors.push('Review generation does not match its manifest.');
 if(review.status!=='approved'||review.defects.length)errors.push('Unresolved quality defects.');
 if(review.author===review.reviewer)errors.push('An independent reviewer is required.');
 for(const check of requiredQualityChecks)if(review.checks.filter(item=>item.id===check&&item.status==='pass').length!==1)errors.push(`Missing independent check: ${check}`);
 if(review.checks.some(item=>item.status==='fail'))errors.push('A quality check failed.');
 for(const view of requiredVisualViews)if(!review.screenshots.some(image=>image.view===view))errors.push(`Missing visual evidence: ${view}`);
 for(const room of manifest.rooms)if(!review.screenshots.some(image=>image.view==='room'&&image.roomId===room.id))errors.push(`Missing room inspection: ${room.id}`);
 for(const deck of manifest.decks)if(!review.screenshots.some(image=>image.view==='deck'&&image.deckId===deck.id))errors.push(`Missing deck inspection: ${deck.id}`);
 for(const explode of [0,50,100])if(!review.screenshots.some(image=>image.view==='exploded'&&image.explode===explode))errors.push(`Missing disassembly review at ${explode}%.`);
 const parts=new Set(manifest.components.map(component=>component.id));
 for(const role of baselineInventoryRoles){
  const rows=review.inventory.filter(item=>item.role===role),entry=rows[0];
  if(rows.length!==1){errors.push(`Inventory role needs one disposition: ${role}`);continue;}
  if(entry.applicability==='present'&&(!entry.componentIds.length||entry.componentIds.some(id=>!parts.has(id))))errors.push(`Missing selectable inventory: ${role}`);
  if(entry.applicability==='not-applicable'&&entry.componentIds.length)errors.push(`Contradictory inventory: ${role}`);
 }
 return errors;
}

export function collectionFailures(rows:readonly YachtSeedRow[],models:readonly YachtResearch[],reviewedIds:readonly string[]):string[] {
 const errors:string[]=[];
 for(const row of rows){
  if(row.disposition.type==='unresolved')errors.push(`Unresolved seed row: ${row.rowId}`);
  const id='canonicalId' in row.disposition?row.disposition.canonicalId:undefined;
  if(id&&!models.some(model=>model.id===id))errors.push(`Missing canonical profile: ${row.rowId}`);
 }
 for(const model of models){
  if(model.productionStatus==='announced')continue;
  if(model.productionStart===null||model.productionStart>2026||model.productionEnd!==null&&model.productionEnd<2006)errors.push(`Unverified production overlap: ${model.id}`);
  if(!reviewedIds.includes(model.id))errors.push(`No approved model: ${model.id}`);
 }
 if(!models.some(model=>model.brand==='Sunseeker')||!models.some(model=>model.brand==='Princess'))errors.push('Both manufacturers must be represented.');
 return errors;
}
