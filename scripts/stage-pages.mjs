import { cp, mkdir, readFile, readdir, rm, lstat, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function stagePages({source='dist',destination='.pages',basePath='',commit='local'}={}) {
 const base=basePath.replace(/\/$/,'');
 if(base!==''&&base!=='/Hullscope')throw new Error(`Unsupported Pages base path: ${base}`);
 const html=await readFile(join(source,'index.html'),'utf8');
 if(!html.includes('/Hullscope/assets/'))throw new Error('Build must use the /Hullscope/ asset base.');
 await rm(destination,{recursive:true,force:true});
 const appRoot=base?destination:join(destination,'Hullscope');
 await mkdir(appRoot,{recursive:true});
 await cp(source,appRoot,{recursive:true});
 await writeFile(join(appRoot,'release.json'),JSON.stringify({commit,builtAt:new Date().toISOString()},null,2));
 await writeFile(join(destination,'.nojekyll'),'');
 if(!base)await writeFile(join(destination,'index.html'),`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hullscope</title>
<script>location.replace('/Hullscope/'+location.search+location.hash)</script>
<a href="/Hullscope/">Open Hullscope</a></html>\n`);
 let bytes=0;
 async function inspect(directory){for(const entry of await readdir(directory,{withFileTypes:true})){
  const path=join(directory,entry.name);const stat=await lstat(path);
  if(stat.isSymbolicLink())throw new Error(`Pages cannot contain symlinks: ${path}`);
  if(stat.isDirectory())await inspect(path);else bytes+=stat.size;
 }}
 await inspect(destination);
 if(bytes>=800_000_000)throw new Error(`Pages artifact exceeds the 800 MB project budget: ${bytes}`);
 return {bytes,appRoot,basePath:base,commit};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 console.log(JSON.stringify(await stagePages({basePath:process.env.PAGES_BASE_PATH??'',commit:process.env.HULLSCOPE_RELEASE_SHA??'local'}),null,2));
}
