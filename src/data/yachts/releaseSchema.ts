import { z } from 'zod';
import { assetPathSchema, factSchema, sourceSchema } from '../schema';
import type { VesselRecord } from '../schema';

const yachtIdentity=z.object({brand:z.enum(['Sunseeker','Princess']),range:z.string(),type:z.string(),generation:z.string(),productionStart:z.number().int().nullable(),productionEnd:z.number().int().nullable(),productionStatus:z.enum(['current','historical','announced','unknown']),aliases:z.array(z.string()),thumbnail:assetPathSchema,manifest:assetPathSchema});
export const yachtVesselSchema:z.ZodType<VesselRecord>=z.object({
 id:z.string().regex(/^[a-z0-9-]+$/),name:z.string(),family:z.object({id:z.string(),name:z.string(),group:z.literal('Yachts'),description:z.string(),subtypes:z.array(z.string())}),yacht:yachtIdentity,
 subtitle:z.string(),purpose:z.string(),length:z.number().positive(),beam:z.number().positive(),depth:z.number().positive(),year:z.number().int(),hullColor:z.string(),deckColor:z.string(),kind:z.literal('yacht'),configuration:z.string(),dimensionStatus:z.enum(['verified','inferred']),facts:z.array(factSchema),sources:z.array(sourceSchema),signature:z.string(),operation:z.string(),efficiency:z.string(),risk:z.string(),modelNote:z.string(),
});
const releaseSchema=z.object({schemaVersion:z.literal(1),repository:z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/).nullable(),revision:z.string().regex(/^[a-f0-9]{40}$/).nullable(),vessels:z.array(yachtVesselSchema),manifests:z.array(z.object({id:z.string(),path:assetPathSchema,sha256:z.string().regex(/^[a-f0-9]{64}$/)})).default([]),preview:z.boolean().optional()});
export function parseYachtRelease(input:unknown,allowLocalPreview=false){
 const release=releaseSchema.parse(input);
 if(release.preview&&!allowLocalPreview)throw new Error('Draft yacht catalogs cannot be used in a production build.');
 if(Boolean(release.repository)!==Boolean(release.revision))throw new Error('Repository and full commit revision must be pinned together.');
 if(release.vessels.length&&!release.repository&&!(allowLocalPreview&&release.preview))throw new Error('A released collection requires a pinned dataset.');
 if(new Set(release.vessels.map(vessel=>vessel.id)).size!==release.vessels.length)throw new Error('Duplicate generation IDs in released fleet.');
 if(!release.preview){
  if(release.manifests.length!==release.vessels.length||new Set(release.manifests.map(manifest=>manifest.id)).size!==release.manifests.length)throw new Error('Each released yacht needs exactly one bundled manifest checksum.');
  for(const vessel of release.vessels)if(!release.manifests.some(manifest=>manifest.id===vessel.id&&manifest.path===vessel.yacht?.manifest))throw new Error('Bundled manifest does not match its released yacht.');
 }
 return release;
}
