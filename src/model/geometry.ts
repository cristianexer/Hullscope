import * as THREE from 'three';
import type { Component } from '../data/schema';

/** Half-beam in a unit hull; shared by shell, deck and edge fittings. Bow is +X. */
export function hullHalfWidth(u:number,kind='container'):number {
 if(kind==='pirate'){
  const aft=.64+.36*Math.sin(Math.min(1,u/.27)*Math.PI/2);
  const bow=Math.pow(Math.max(0,1-Math.pow(Math.max(0,(u-.82)/.18),2)),.72);
  return .5*aft*bow;
 }
 const full=['bulk','tanker','chemical','fpso','roro','livestock','inland'].includes(kind);
 const compact=['tug','icebreaker','ahts','rescue'].includes(kind);
 const start=full?.77:compact?.66:kind==='catamaran'?.65:.72;
 const stern=kind==='inland'?.91:compact?.74:full?.82:.68;
 const aft=stern+(1-stern)*Math.sin(Math.min(1,u/.18)*Math.PI/2);
 const t=Math.max(0,(u-start)/(1-start));
 const bow=Math.pow(Math.max(0,1-t*t),compact?.64:.84);
 return .5*aft*bow;
}

export type HullSection='full'|'upper'|'lower';
export const HULL_PAINT_SEAM=-.16;
export function hullSectionFor(c:Pick<Component,'name'|'shape'>):HullSection{return c.shape!=='hull'?'full':c.name==='Outer hull shell'?'upper':c.name==='Antifouling underwater shell'?'lower':'full';}

export function makeGeometry(shape:Component['shape'],detail=1,kind='container',section:HullSection='full'):THREE.BufferGeometry{
 const segments=detail===0?10:24;
 if(shape==='barrel'){
  return new THREE.LatheGeometry([new THREE.Vector2(0,-.5),new THREE.Vector2(.36,-.5),new THREE.Vector2(.42,-.4),new THREE.Vector2(.49,-.14),new THREE.Vector2(.5,0),new THREE.Vector2(.49,.14),new THREE.Vector2(.42,.4),new THREE.Vector2(.36,.5),new THREE.Vector2(0,.5)],segments);
 }
 if(shape==='cannonBarrel'){
  const profile:[[number,number],...[number,number][]]=[[0,-.5],[.13,-.5],[.18,-.43],[.39,-.4],[.48,-.29],[.4,-.18],[.32,.31],[.35,.38],[.35,.48],[.24,.5],[.21,.43],[.21,.34],[0,.34]];
  return new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),segments);
 }
 if(shape==='timberFrame'){
  const shape=new THREE.Shape();
  const outline=[[-.5,.5],[-.48,-.12],[-.36,-.42],[0,-.5],[.36,-.42],[.48,-.12],[.5,.5],[.42,.5],[.4,-.1],[.3,-.34],[0,-.42],[-.3,-.34],[-.4,-.1],[-.42,.5]];
  outline.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,steps:1});g.translate(0,0,-.5);g.rotateY(Math.PI/2);return g;
 }
 if(shape==='sail'||shape==='triangularSail'){
  const n=detail===0?14:30,positions:number[]=[],indices:number[]=[];
  for(const face of [-1,1])for(let row=0;row<=n;row++)for(let col=0;col<=n;col++){
   const u=col/n,v=row/n,triangular=shape==='triangularSail';
   const x=triangular?-.5+u*(1-v*.96):(u-.5)*(.84+.16*v);
   const y=v-.5+(triangular?0:.075*Math.sin(Math.PI*u)*(1-v));
   const z=.46*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)+face*.002;
   positions.push(x,y,z);
  }
  const surface=(n+1)*(n+1),edges=new Map<string,[number,number]>();
  for(let row=0;row<n;row++)for(let col=0;col<n;col++){
   const u=(col+.5)/n,v=(row+.5)/n;
   // Small irregular weather tears; each edge is closed through the cloth thickness.
   if(shape==='sail'&&((Math.abs(u-.23)<.034&&v<.16)||(Math.abs(u-.73)<.025&&Math.abs(v-.39)<.05)))continue;
   const a=row*(n+1)+col,b=a+1,c=a+n+1,d=c+1;
   indices.push(a,c,b,b,c,d,a+surface,b+surface,c+surface,b+surface,d+surface,c+surface);
   for(const [x,y]of [[a,b],[b,d],[d,c],[c,a]]){const key=[Math.min(x,y),Math.max(x,y)].join(':');if(edges.has(key))edges.delete(key);else edges.set(key,[x,y]);}
  }
  for(const [a,b]of edges.values())indices.push(a,b,a+surface,b,b+surface,a+surface);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
 }
 if(shape==='box')return new THREE.BoxGeometry(1,1,1);
 if(shape==='chamferedBox'){
  // Eight-sided plan with shallow inclined walls: retains the exact unit envelope.
  const outline=new THREE.Shape();
  const plan:[number,number][]=[[-.5,-.36],[-.36,-.5],[.36,-.5],[.5,-.36],[.5,.36],[.36,.5],[-.36,.5],[-.5,.36]];
  plan.forEach(([x,z],i)=>i?outline.lineTo(x,z):outline.moveTo(x,z));outline.closePath();
  const g=new THREE.ExtrudeGeometry(outline,{depth:1,bevelEnabled:false,steps:1});
  g.rotateX(Math.PI/2);g.translate(0,.5,0);
  const p=g.getAttribute('position');
  for(let i=0;i<p.count;i++){const taper=1-.055*(p.getY(i)+.5);p.setXYZ(i,p.getX(i)*taper,p.getY(i),p.getZ(i)*taper);}
  g.computeVertexNormals();return g;
 }
 if(shape==='cylinder')return new THREE.CylinderGeometry(.5,.5,1,segments);
 if(shape==='cone'){if(kind==='naval'){const base=new THREE.CylinderGeometry(.19,.5,1,4);base.rotateY(Math.PI/4);base.scale(Math.SQRT2,1,Math.SQRT2);const g=base.toNonIndexed();base.dispose();g.computeVertexNormals();return g;}return new THREE.ConeGeometry(.5,1,segments);}
 if(shape==='sphere')return new THREE.SphereGeometry(.5,segments,detail===0?8:16);
 if(shape==='torus'){const g=new THREE.TorusGeometry(.43,.045,8,detail===0?24:48);g.rotateX(Math.PI/2);return g;}
 const points:number[]=[];const index:number[]=[];
 const stations=detail===0?24:64;
 const deck=shape==='deck';
 // One shared station surface. Upper/lower paint sections use the exact same seam
 // vertices and transform: no overlapping scaled second hull, detached keel or forked ends.
 // A closed transom, rounded bilges, flared topsides and a raked, truly closed stem.
 // The taper is family-specific; deck and rail paths use precisely the same planform.
 for(let i=0;i<=stations;i++){
  const u=i/stations,w=hullHalfWidth(u,kind);
  const seam=HULL_PAINT_SEAM,seamWidth=w*(.86+(.97-.86)*(seam+.28)/(.05+.28));
  const lower=[[0,-.5],[w*.38,-.49],[w*.67,-.43],[w*.86,-.28],[seamWidth,seam],[0,seam],[-seamWidth,seam],[-w*.86,-.28],[-w*.67,-.43],[-w*.38,-.49]];
  const upper=[[0,seam],[seamWidth,seam],[w*.97,.05],[w,.5],[0,.5],[-w,.5],[-w*.97,.05],[-seamWidth,seam]];
  const profile=deck?[[0,-.5],[w,-.5],[w,.5],[0,.5],[-w,.5],[-w,-.5]]:
   section==='lower'?lower:section==='upper'?upper:
   [[0,-.5],[w*.38,-.49],[w*.67,-.43],[w*.86,-.28],[seamWidth,seam],[w*.97,.05],[w,.5],[0,.5],[-w,.5],[-w*.97,.05],[-seamWidth,seam],[-w*.86,-.28],[-w*.67,-.43],[-w*.38,-.49]];
  for(const [z,y]of profile){
   const sheer=.34+.16*(Math.pow(1-u,4)+.6*Math.pow(u,4));
   const hullY=kind==='pirate'&&!deck&&y>.05?.05+(y-.05)*(sheer-.05)/.45:y;
   const depth=(kind==='pirate'&&!deck?sheer:.5)-hullY;
   const bowRake=kind==='ahts'?0:kind==='icebreaker'?.1:kind==='tug'?.065:.045;
   const rake=deck?0:(Math.pow(u,7)*bowRake-Math.pow(1-u,9)*.035)*depth;
   const hullZ=kind==='pirate'&&!deck&&y>.05?z*(1-.09*(y-.05)/.45):z;
   points.push(u-.5-rake,hullY,hullZ);
  }
 }
 const ring=deck?6:section==='upper'?8:section==='lower'?10:14;
 for(let i=0;i<stations;i++)for(let j=0;j<ring;j++){
  const a=i*ring+j,b=i*ring+(j+1)%ring,c=(i+1)*ring+j,d=(i+1)*ring+(j+1)%ring;
  index.push(a,c,b,b,c,d);
 }
 for(let j=1;j<ring-1;j++){index.push(0,j,j+1);const p=stations*ring;index.push(p,p+j+1,p+j);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setIndex(index);g.computeVertexNormals();
 if(!deck&&section!=='full'){
  // A paint boundary is not a physical ridge: inherit exterior normals from the
  // unsplit surface so the two colour regions do not acquire opposing seam shading.
  const whole=makeGeometry(shape,detail,kind,'full'),wp=whole.getAttribute('position'),wn=whole.getAttribute('normal');
  const normals=new Map<string,THREE.Vector3>();
  const key=(x:number,y:number,z:number)=>[x,y,z].map(n=>n.toFixed(7)).join('/');
  for(let i=0;i<wp.count;i++)normals.set(key(wp.getX(i),wp.getY(i),wp.getZ(i)),new THREE.Vector3(wn.getX(i),wn.getY(i),wn.getZ(i)));
  const p=g.getAttribute('position'),n=g.getAttribute('normal');
  for(let i=0;i<p.count;i++){const normal=normals.get(key(p.getX(i),p.getY(i),p.getZ(i)));if(normal)n.setXYZ(i,normal.x,normal.y,normal.z);}
  whole.dispose();
 }
 return g;
}
