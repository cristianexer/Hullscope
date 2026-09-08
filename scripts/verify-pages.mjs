const site=new URL(process.env.HULLSCOPE_SITE_URL??'https://hullscope.cristianexer.dev/');
if(site.pathname==='/'||site.pathname==='')site.pathname='/Hullscope/';
if(site.pathname!=='/Hullscope/')throw new Error(`Unexpected release path: ${site.pathname}`);
const expected=process.env.HULLSCOPE_RELEASE_SHA;
async function get(path){const url=new URL(path,site);url.searchParams.set('release',expected??'check');const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`${url.pathname}: HTTP ${response.status}`);return response;}
let release;
for(let attempt=0;attempt<12;attempt++){
 try{release=await(await get('release.json')).json();if(expected&&release.commit!==expected)throw new Error('Previous deployment is still cached.');break;}
 catch(error){if(attempt===11)throw error;await new Promise(resolve=>setTimeout(resolve,5000));}
}
const html=await(await get('')).text();
const assets=[...html.matchAll(/(?:src|href)="(\/Hullscope\/assets\/[^"]+)"/g)].map(match=>match[1]);
if(!assets.some(path=>path.endsWith('.js')))throw new Error('No production JavaScript in the released HTML.');
await Promise.all(assets.map(async path=>{await(await get(path)).arrayBuffer();}));
// Read every deployed manifest and verify both exported LODs are real GLBs.
const {fleet}=await import('../src/data/fleet.ts');
for(let start=0;start<fleet.length;start+=4){
 await Promise.all(fleet.slice(start,start+4).map(async vessel=>{
  const manifest=await(await get(`models/${vessel.id}.json`)).json();
  if(manifest.vesselId!==vessel.id||manifest.lods.length!==2)throw new Error(`Invalid manifest: ${vessel.id}`);
  for(const lod of manifest.lods){
   const data=await(await get(lod.url)).arrayBuffer();
   if(data.byteLength!==lod.bytes||new DataView(data).getUint32(0,true)!==0x46546c67)throw new Error(`Invalid GLB: ${lod.url}`);
  }
 }));
}
console.log(JSON.stringify({site:site.href,commit:release.commit,vessels:fleet.length,glbs:fleet.length*2,status:'verified'},null,2));
