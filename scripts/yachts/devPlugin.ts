import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import type { Plugin } from 'vite';
import { assertAssetPath } from '../../src/assets/resolver';

/** Explicit opt-in local QA only. Large yacht binaries never enter Vite's public directory. */
export function yachtDevelopmentAssets():Plugin {
 const enabled=process.env.HULLSCOPE_YACHT_PREVIEW==='1',assets=resolve('.tools/yachts/assets'),releaseFile=resolve('src/data/yachts/release.json');
 return {name:'hullscope-local-yachts',apply:'serve',enforce:'pre',
  async load(id){
   const cleanId=id.split('?')[0].replaceAll('\\\\','/');
   // Vite may pass either the absolute filesystem path or the URL-form path
   // for JSON imports depending on the dev-server middleware order. Match
   // both forms so the explicit local preview catalog cannot silently fall
   // back to the empty production release snapshot.
   if(enabled&&(cleanId===releaseFile||cleanId.endsWith('/src/data/yachts/release.json')))return await readFile('.tools/yachts/preview/release.json','utf8');
  },
  configureServer(server){
   if(!enabled)return;
   server.middlewares.use(async(req,res,next)=>{
    const url=new URL(req.url??'/', 'http://localhost'),prefix=url.pathname.startsWith('/Hullscope/yacht-assets/')?'/Hullscope/yacht-assets/':'/yacht-assets/';
    if(!url.pathname.startsWith(prefix)){next();return;}
    try{
     if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;res.end();return;}
     const path=url.pathname.slice(prefix.length);assertAssetPath(path);
     if(!/\.(glb|json|png|jpg|webp)$/.test(path))throw new Error('Unsupported local asset.');
     const file=await realpath(resolve(assets,path)),root=await realpath(assets);
     if(!file.startsWith(root+sep))throw new Error('Asset outside local collection.');
     const info=await stat(file);if(!info.isFile())throw new Error('Not a file.');
     res.setHeader('Content-Type',path.endsWith('.glb')?'model/gltf-binary':path.endsWith('.json')?'application/json':path.endsWith('.png')?'image/png':path.endsWith('.webp')?'image/webp':'image/jpeg');
     res.setHeader('Content-Length',info.size);res.setHeader('Cache-Control','no-store');
     if(req.method==='HEAD'){res.end();return;}
     const stream=createReadStream(file);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
    }catch{res.statusCode=404;res.end('Local QA asset unavailable');}
   });
  },
 };
}
