import { z } from 'zod';

const year = z.number().int().min(1900).max(2035).nullable();
export const yachtResearchSchema = z.object({
 id:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),brand:z.enum(['Sunseeker','Princess']),name:z.string().min(1),range:z.string(),type:z.string(),generation:z.string(),
 productionStart:year,productionEnd:year,productionStatus:z.enum(['current','historical','announced','unknown']),aliases:z.array(z.string()),referenceConfiguration:z.string(),
 dimensions:z.object({lengthM:z.number().positive().nullable(),beamM:z.number().positive().nullable(),draftM:z.number().nonnegative().nullable()}),
 facts:z.array(z.object({key:z.string(),label:z.string(),value:z.union([z.string(),z.number()]).nullable(),unit:z.string().nullable().transform(unit=>unit??''),status:z.enum(['verified','reported','unknown']),sourceUrl:z.url().nullable(),note:z.string()})),
 sources:z.array(z.object({url:z.url(),title:z.string(),publisher:z.string(),accessed:z.string(),scope:z.string()})).min(1),
 layout:z.object({decks:z.number().int().positive().nullable(),cabins:z.number().int().nonnegative().nullable(),heads:z.number().int().nonnegative().nullable(),rooms:z.array(z.string()),description:z.string(),evidenceUrls:z.array(z.url())}),
 visual:z.object({hullDescription:z.string(),superstructureDescription:z.string(),glazingDescription:z.string(),distinctiveFeatures:z.array(z.string()),referenceUrls:z.array(z.url())}),
 uncertainties:z.array(z.string()),
}).superRefine((model,ctx)=>{
 const fail=(message:string)=>ctx.addIssue({code:'custom',message});
 if(model.productionStart!==null&&model.productionEnd!==null&&model.productionEnd<model.productionStart)fail('Production interval is reversed.');
 const sources=new Set(model.sources.map(source=>source.url));
 for(const fact of model.facts){
  if((fact.value===null)!==(fact.status==='unknown'))fail(`Unknown fact must be null: ${fact.key}`);
  if(fact.status!=='unknown'&&(!fact.sourceUrl||!sources.has(fact.sourceUrl)))fail(`Fact lacks a declared source: ${fact.key}`);
 }
});
export type YachtResearch = z.infer<typeof yachtResearchSchema>;
