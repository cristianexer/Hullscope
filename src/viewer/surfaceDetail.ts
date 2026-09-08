import type { MeshStandardMaterial } from 'three';
import type { SurfaceKind } from './materials';

/** Original procedural weathering: no image downloads or texture allocations. */
export function configureSurfaceDetail(material:MeshStandardMaterial, surface:SurfaceKind) {
 if(!['wood','cloth','rope','iron'].includes(surface))return;
 material.customProgramCacheKey=()=>`hullscope-surface-${surface}-1`;
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSurfacePosition;')
   .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurfacePosition = position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vSurfacePosition;
float surfaceNoise(vec3 p) {
 vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
 vec3 a=vec3(127.1,311.7,74.7);
 float n000=fract(sin(dot(i,a))*43758.5453);
 float n100=fract(sin(dot(i+vec3(1,0,0),a))*43758.5453);
 float n010=fract(sin(dot(i+vec3(0,1,0),a))*43758.5453);
 float n110=fract(sin(dot(i+vec3(1,1,0),a))*43758.5453);
 float n001=fract(sin(dot(i+vec3(0,0,1),a))*43758.5453);
 float n101=fract(sin(dot(i+vec3(1,0,1),a))*43758.5453);
 float n011=fract(sin(dot(i+vec3(0,1,1),a))*43758.5453);
 float n111=fract(sin(dot(i+vec3(1,1,1),a))*43758.5453);
 return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y),mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y),f.z);
}`);
  const treatment=surface==='wood'?`
vec3 grainPosition=vSurfacePosition*vec3(4.0,110.0,110.0);
float grainFade=1.0-smoothstep(0.5,2.0,length(fwidth(grainPosition)));
float broadGrain=surfaceNoise(vSurfacePosition*vec3(2.0,16.0,16.0));
float fineGrain=mix(0.5,surfaceNoise(grainPosition),grainFade);
diffuseColor.rgb*=0.72+0.38*broadGrain+0.20*fineGrain;`:
   surface==='cloth'?`
vec2 weave=vSurfacePosition.xy*460.0;
float weaveFade=1.0-smoothstep(0.7,2.0,length(fwidth(weave)));
float threads=sin(weave.x)*sin(weave.y)*weaveFade;
float weathering=surfaceNoise(vSurfacePosition*vec3(11.0,7.0,4.0));
diffuseColor.rgb*=0.77+0.32*weathering+0.045*threads;`:
   surface==='rope'?`
float fibres=surfaceNoise(vSurfacePosition*vec3(25.0,3.0,25.0));
diffuseColor.rgb*=0.84+0.25*fibres;`:`
float patina=surfaceNoise(vSurfacePosition*18.0);
diffuseColor.rgb*=0.82+0.27*patina;`;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\n${treatment}`);
 };
 material.needsUpdate=true;
}
