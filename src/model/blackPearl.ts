import { Euler, Quaternion, Vector3 } from 'three';
import type { Component, SystemId, Vec3, VesselRecord } from '../data/schema';
import { hullHalfWidth } from './geometry';
import { appendBlackPearlInterior } from './blackPearlInterior';

/** Original fictional sailing-ship reconstruction. Dimensions and inventory are illustrative. */
export function buildBlackPearl(v: VesselRecord): Component[] {
 const out:Component[]=[];const counts:Record<string,number>={};const s=v.length/100,W=v.beam/s;
 const wood='#303431',plank='#66503a',pitch='#202320',rope='#514d43',iron='#242725',brass='#a38b52',cloth='#25292b';
 type Opt=Partial<Pick<Component,'shape'|'rotation'|'interior'|'decorative'|'parentId'|'explode'|'localExplode'>>;
 function add(name:string,sys:SystemId,assembly:string,p:Vec3,size:Vec3,color:string,why:string,opt:Opt={}):string{
  const key=`${sys}.${assembly}.${name}`.toLowerCase().replace(/[^a-z0-9.]+/g,'-');counts[key]=(counts[key]??0)+1;const id=`${v.id}.${key}.${counts[key]}`;
  out.push({id,vesselId:v.id,name,systemId:sys,assembly,parentId:opt.parentId??null,shape:opt.shape??'box',position:p.map(x=>x*s) as Vec3,size:size.map(x=>x*s) as Vec3,rotation:opt.rotation??[0,0,0],color,explode:(opt.explode??[0,20,0]).map(x=>x*s) as Vec3,localExplode:(opt.localExplode??[0,3,0]).map(x=>x*s) as Vec3,interior:opt.interior??false,decorative:opt.decorative??false,fidelity:'reconstructed',purpose:why,sourceIds:v.sources.map(r=>r.id)});return id;
 }
 const cyl=(n:string,sys:SystemId,a:string,p:Vec3,sz:Vec3,c:string,why:string,o:Opt={})=>add(n,sys,a,p,sz,c,why,{...o,shape:'cylinder'});
 function beam(n:string,sys:SystemId,a:string,p:Vec3,q:Vec3,r:number,c:string,why:string,o:Opt={}){
  const d=new Vector3(q[0]-p[0],q[1]-p[1],q[2]-p[2]);const e=new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),d.clone().normalize()));
  return cyl(n,sys,a,p.map((x,i)=>(x+q[i])/2) as Vec3,[r,d.length(),r],c,why,{...o,rotation:[e.x,e.y,e.z]});
 }
 const shell=add('Outer hull shell','structure','Hull',[0,-2,0],[96,17,W],wood,'Timber planking closes the fictional ship’s flared hull.',{shape:'hull',explode:[0,-12,0]});
 add('Antifouling underwater shell','structure','Hull',[0,-2,0],[96,17,W],pitch,'Pitch-toned lower hull; a complementary region of the same continuous shell.',{shape:'hull',parentId:shell,explode:[0,-12,0]});
 add('Keel','structure','Timber framing',[-1,-10,0],[87,.8,.9],wood,'Longitudinal backbone receiving the transverse frames.',{interior:true,explode:[0,-18,0]});
 add('Keelson','structure','Timber framing',[-1,-8.6,0],[83,.9,1.2],plank,'Internal longitudinal timber tying the frames to the keel.',{interior:true,explode:[0,-10,0]});
 for(let i=0;i<24;i++){
  const x=-42+i*84/23;const width=hullHalfWidth(x/96+.5,'pirate')*W*1.84;
  add(`Transverse oak frame ${i+1}`,'structure','Timber framing',[x,-2,0],[.48,14,width],plank,'Curved transverse timber supports the hull planking against water loads.',{shape:'timberFrame',interior:true,explode:[0,-5,0]});
 }
 const decks=[{name:'Lower gun deck',y:4.1,l:88,lift:8},{name:'Upper gun deck',y:8.6,l:92,lift:23},{name:'Main strength deck',y:13.1,l:94,lift:41}];
 const deckIds=decks.map(d=>add(d.name,'structure','Decks',[0,d.y,0],[d.l,.4,W*.91],plank,'Load-bearing timber deck supporting crew, stores and its assigned equipment.',{shape:'deck',interior:d.y<13,explode:[0,d.lift,0]}));
 for(const [di,d] of decks.entries())for(let i=0;i<14;i++){
  const x=-39+i*78/13,w=hullHalfWidth(x/96+.5,'pirate')*W*1.73;
  add(`${d.name} transverse beam ${i+1}`,'structure','Deck framing',[x,d.y-.55,0],[.6,.65,w],wood,'Transverse deck beam transfers deck loads into the side frames.',{interior:true,parentId:deckIds[di],explode:[0,d.lift,0]});
 }
 // Genuine gunport openings: narrow horizontal wales and separate solid piers leave daylight.
 for(const side of [-1,1]){
  const sideName=side<0?'Port':'Starboard';
  for(let row=0;row<2;row++){
   const floor=decks[row],y=floor.y+2.2,z=side*W*.445;
   for(const height of [floor.y+.45,floor.y+4.0])add(`${sideName} gun deck ${row+1} continuous wale ${height.toFixed(1)}`,'structure','Gunport walls',[0,height,z],[72,.72,.65],wood,'Heavy longitudinal timber stiffens the gunport band.',{parentId:deckIds[row],explode:[0,floor.lift,side*8]});
   for(let i=0;i<9;i++)add(`${sideName} gunport pier ${row+1}-${i+1}`,'structure','Gunport walls',[-34+i*8.5,y,z],[4.8,2.8,.6],wood,'Solid timber pier separates adjacent gunports.',{decorative:true,parentId:deckIds[row],explode:[0,floor.lift,side*8]});
   for(let i=0;i<8;i++){
    const x=-29.75+i*8.5,assembly=`${sideName} ${row===0?'lower':'upper'} gun ${i+1}`,ex:Vec3=[0,floor.lift+2,side*23];
    const carriage=add(`${assembly} carriage`,'cargo',assembly,[x,floor.y+.95,side*W*.35],[3.5,1.1,3.2],plank,'Wheeled timber carriage supports an illustrative period naval cannon; no operating procedure is represented.',{parentId:deckIds[row],explode:ex});
    add(`${assembly} barrel`,'cargo',assembly,[x,floor.y+2.0,side*(W*.43)],[1.25,5.8,1.25],iron,'Cast-iron external barrel silhouette; reconstructed film-era dressing rather than a documented armament specification.',{shape:'cannonBarrel',rotation:[side*Math.PI/2,0,0],parentId:carriage,explode:ex,localExplode:[0,3,side*2]});
    for(const axle of [-1,1]){
     cyl(`${assembly} ${axle<0?'rear':'front'} axle`,'cargo',assembly,[x,floor.y+.55,side*W*.35+axle*.95],[.32,4.1,.32],wood,'Axle joins the truck wheels and carries carriage loads.',{rotation:[0,0,Math.PI/2],parentId:carriage,explode:ex});
     for(const flank of [-1,1])cyl(`${assembly} truck wheel ${axle}-${flank}`,'cargo',assembly,[x+flank*1.85,floor.y+.58,side*W*.35+axle*.95],[1.15,.42,1.15],wood,'Wooden truck wheel supports the gun carriage.',{rotation:[0,0,Math.PI/2],parentId:carriage,explode:ex});
    }
    for(const flank of [-1,1]){
     add(`${assembly} ${flank<0?'left':'right'} carriage cheek`,'cargo',assembly,[x+flank*1.35,floor.y+1.5,side*W*.35],[.55,1.7,3.0],plank,'Load-bearing side timber supports the barrel and joins the carriage bed.',{shape:'chamferedBox',parentId:carriage,explode:ex});
     add(`${assembly} ${flank<0?'left':'right'} trunnion saddle`,'cargo',assembly,[x+flank*.88,floor.y+2,side*W*.41],[.75,.45,1.1],iron,'External bearing saddle supports the barrel on the wooden carriage.',{parentId:carriage,explode:ex});
    }
    const portFrame=add(`${assembly} gunport lining`,'structure','Gunport frames',[x,y+1.45,z],[3.8,.35,.8],plank,'Structural timber lining defines and reinforces this complete gunport opening.',{parentId:deckIds[row],explode:[0,floor.lift,side*8]});
    add(`${assembly} gunport sill`,'structure','Gunport frames',[x,y-1.45,z],[3.8,.35,.8],plank,'Lower member of the gunport lining.',{decorative:true,parentId:portFrame,explode:[0,floor.lift,side*8]});
    for(const edge of [-1,1])add(`${assembly} gunport jamb ${edge}`,'structure','Gunport frames',[x+edge*1.9,y,z],[.35,2.9,.8],plank,'Vertical member of the gunport lining.',{decorative:true,parentId:portFrame,explode:[0,floor.lift,side*8]});
    add(`${assembly} elevation quoin`,'cargo',assembly,[x,floor.y+1.5,side*W*.32],[.85,.45,.9],wood,'Wooden support wedge below the barrel breech.',{parentId:carriage,explode:ex});
    beam(`${assembly} breeching line`,'cargo',assembly,[x-1.5,floor.y+1.25,side*W*.43],[x+1.5,floor.y+1.25,side*W*.43],.15,rope,'Heavy rope restrains the carriage’s travel; routing is illustrative.',{parentId:carriage,explode:ex});
    add(`${assembly} gunport lid`,'structure','Gunport lids',[x,y+1.95,z+side*.8],[3.5,.26,2.65],wood,'Hinged timber lid closes this individual gunport in poor weather.',{rotation:[side*.62,0,0],parentId:deckIds[row],explode:[0,floor.lift,side*8]});
   }
  }
  // Bulwarks and carved rails; repetitive joinery is visible but excluded from component totals.
  for(let i=0;i<26;i++){
   const x=-43+i*86/25,z=side*hullHalfWidth(x/96+.5,'pirate')*W*.94;
   add(`${sideName} bulwark plank ${i+1}`,'structure','Bulwarks',[x,14.25,z],[3.6,2.2,.4],wood,'Timber bulwark protects the working deck.',{decorative:true,parentId:deckIds[2],explode:[0,41,side*6]});
   cyl(`${sideName} rail baluster ${i+1}`,'structure','Bulwarks',[x,15.65,z],[.3,1.3,.3],plank,'Turned support of the timber rail.',{decorative:true,parentId:deckIds[2],explode:[0,41,side*6]});
   if(i<25){const nx=-43+(i+1)*86/25,nz=side*hullHalfWidth(nx/96+.5,'pirate')*W*.94;beam(`${sideName} cap rail ${i+1}`,'structure','Bulwarks',[x,16.3,z],[nx,16.3,nz],.42,wood,'Continuous protective deck rail.',{decorative:true,parentId:deckIds[2],explode:[0,41,side*6]});}
  }
 }
 // Planked bow and stern shoulders continue the hull up to the weather deck.
 for(const side of [-1,1])for(const end of [-1,1])for(let i=0;i<48;i++){
  const xa=end*(36+i*.25),xb=end*(36+(i+1)*.25),ua=xa/96+.5,ub=xb/96+.5;
  const za=side*hullHalfWidth(ua,'pirate')*W*.925,zb=side*hullHalfWidth(ub,'pirate')*W*.925;
  const sheer=(u:number)=>-2+17*(.34+.16*(Math.pow(1-u,4)+.6*Math.pow(u,4)));
  const low=Math.min(sheer(ua),sheer(ub))-.2,high=13.35;
  add(`Upper ${end<0?'stern':'bow'} ceiling plank ${side}-${i+1}`,'structure','Gunport walls',[(xa+xb)/2,(low+high)/2,(za+zb)/2],[Math.hypot(xb-xa,zb-za)+.06,high-low,.62],wood,'Curved timber side planking joins the hull to the raised gun-deck shell.',{rotation:[0,-Math.atan2(zb-za,xb-xa),0],decorative:true,parentId:deckIds[2],explode:[0,41,side*8]});
 }
 add('Lower stern transom','structure','Gunport walls',[-47.2,10,0],[.8,7.4,W*.65],wood,'Lower timber transom continues the hull up to the raised stern structure.',{parentId:deckIds[1],explode:[-12,23,0]});
 // Swept head rails tie the raised bow into the projecting bowsprit.
 for(const side of [-1,1])for(let level=0;level<3;level++)for(let piece=0;piece<12;piece++){
  const point=(t:number):Vec3=>[34+22*t,15.6-level*1.25+5*t,side*(W*.28*(1-t)+1.2*t)];
  beam(`Bow head rail ${side}-${level}-${piece}`,'structure','Bow head rails',point(piece/12),point((piece+1)/12),.24,level===0?plank:wood,'Swept timber head rail supports and encloses the bow working area.',{decorative:true,parentId:deckIds[2],explode:[12,45,side*7]});
 }
 const quarter=add('Quarterdeck','accommodation','Decks',[-32,17.3,0],[28,.5,W*.86],plank,'Raised after working deck for steering and command.',{parentId:deckIds[2],explode:[-6,54,0]});
 const poop=add('Poop deck','accommodation','Decks',[-40,22,0],[16,.5,W*.76],plank,'Raised stern deck above the captain’s cabin.',{parentId:quarter,explode:[-12,68,0]});
 const fore=add('Forecastle deck','structure','Decks',[36,16.3,0],[19,.5,W*.58],plank,'Raised forward deck carries anchor-handling equipment.',{shape:'deck',parentId:deckIds[2],explode:[9,50,0]});
 add('Forecastle supporting timber bulkhead','structure','Superstructure',[28,14.6,0],[.5,2.7,W*.42],wood,'Timber bulkhead supports the raised forecastle over the main deck.',{parentId:fore,explode:[9,50,0]});
 for(const side of [-1,1]){
  add(`Stern cabin side ${side}`,'accommodation','Superstructure',[-40,19.6,side*W*.36],[15,4.1,.45],wood,'Timber wall encloses the captain’s quarters.',{parentId:quarter,explode:[-6,54,side*8]});
  for(let j=0;j<7;j++)add(`Stern gallery side window ${side}-${j+1}`,'accommodation','Glazing',[-46+j*2,19.8,side*W*.37],[1.3,2.3,.15],'#8a8d74','Small leaded stern window admits daylight.',{decorative:true,parentId:quarter,explode:[-6,54,side*8]});
  add(`Quarter gallery balcony ${side}`,'accommodation','Stern gallery',[-40,18.1,side*W*.42],[16,.4,2.4],wood,'External stern gallery, original interpretation of the fictional ship.',{parentId:quarter,explode:[-6,54,side*8]});
 }
 add('Stern transom','structure','Superstructure',[-48,18,0],[.55,9,W*.71],wood,'High timber transom closes the stern above the lower hull.',{parentId:quarter,explode:[-15,54,0]});
 for(let j=0;j<9;j++){
  add(`Transom glazed light ${j+1}`,'accommodation','Glazing',[-48.35,19.7,(j-4)*2],[.14,2.5,1.4],'#96937c','Leaded light in the stern gallery.',{decorative:true,parentId:quarter,explode:[-15,54,0]});
  beam(`Original stern carved ray ${j+1}`,'accommodation','Stern ornament',[-48.5,22.4,0],[-48.5,22.7+Math.sin(j*Math.PI/8)*2,(j-4)*1.6],.28,brass,'Original geometric stern ornament, not a copied film prop sculpture.',{decorative:true,parentId:poop,explode:[-15,68,0]});
 }
 for(const [name,x,low,high,parent,lift] of [['Quarterdeck companion stair',-18,13.1,17.3,quarter,54],['Poop deck companion stair',-31,17.3,22,poop,68],['Forecastle companion stair',25,13.1,16.3,fore,50]] as const){
  const stair=beam(name,'accommodation','Companionways',[x+3,low,5],[x-3,high,5],.5,wood,'Companionway gives crew access between working decks.',{parentId:parent,explode:[0,lift,0]});
  for(let j=0;j<8;j++)add(`${name} tread ${j+1}`,'accommodation','Companionways',[x+3-j*6/7,low+j*(high-low)/7,5],[.75,.2,3.4],plank,'Individual timber tread supports a foot on this companionway.',{decorative:true,parentId:stair,explode:[0,lift,0]});
 }
 // Each mast has individually selectable structural stages, yards, sails and complete lines.
 const masts=[{name:'Foremast',x:25,base:13.1,tops:[51,68,78],widths:[31,24,16],heights:[16,12,8]}, {name:'Mainmast',x:0,base:13.1,tops:[56,75,87],widths:[35,27,18],heights:[18,14,9]}, {name:'Mizzen mast',x:-27,base:17.3,tops:[48,62,72],widths:[24,18,12],heights:[13,10,7]}];
 for(const [mi,m] of masts.entries()){
  let base=m.base,parent=mi===2?quarter:deckIds[2];const shift=(1-mi)*18;
  for(let stage=0;stage<3;stage++){
   const top=m.tops[stage],lift=60+stage*24,assembly=`${m.name} ${['lower rig','topmast rig','topgallant rig'][stage]}`;
   const mast=cyl(`${m.name} ${['lower mast','topmast','topgallant mast'][stage]}`,'propulsion',assembly,[m.x,(base+top+2)/2,0],[1.55-stage*.48,top+2-base,1.55-stage*.48],wood,'Timber spar transfers sail and rigging loads into the hull.',{parentId:parent,explode:[shift,lift,0]});
   add(`${m.name} ${stage+1} mast cap`,'propulsion',assembly,[m.x,top+.6,0],[2.3-stage*.45,.7,1.8-stage*.3],wood,'Mast cap locates the adjoining spar and rigging.',{parentId:mast,explode:[shift,lift,0]});
   if(stage<2){cyl(`${m.name} ${stage+1} fighting top`,'propulsion',assembly,[m.x,top-1,0],[5-stage,.5,4-stage],plank,'Working platform supports rigging maintenance and lookout access.',{parentId:mast,explode:[shift,lift,0]});}
   const yard=beam(`${m.name} ${stage+1} yard`,'propulsion',assembly,[m.x+.9,top,-m.widths[stage]/2],[m.x+.9,top,m.widths[stage]/2],.65-stage*.16,wood,'Horizontal spar supports the head of a square sail.',{parentId:mast,explode:[shift+7,lift,0]});
   const sail=add(`${m.name} ${stage+1} black sail`,'propulsion',assembly,[m.x+1,top-m.heights[stage]/2,0],[m.widths[stage],m.heights[stage],8-stage*1.7],cloth,'Billowed dark canvas is an original interpretation of the Black Pearl’s screen silhouette.',{shape:'sail',rotation:[0,Math.PI/2,0],parentId:yard,explode:[shift+16,lift,0]});
   // Cloth weave is rendered by the material shader; no bright subpixel seam cylinders.
   for(const side of [-1,1]){
    const tip:Vec3=[m.x+.9,top,side*m.widths[stage]/2],foot:Vec3=[m.x+1,top-m.heights[stage],side*m.widths[stage]*.42];
    for(const block of [0,1])cyl(`${m.name} ${stage+1} brace block ${side}-${block+1}`,'propulsion',assembly,block===0?[tip[0],tip[1]-.5,tip[2]]:[m.x-9,base+1,side*W*.35],[.65,1,.55],wood,'Wooden sheave block redirects the yard brace between spar and deck.',{parentId:yard,explode:[shift+7,lift,0]});
    beam(`${m.name} ${stage+1} ${side<0?'port':'starboard'} brace`,'propulsion',assembly,tip,[m.x-9,base+1,side*W*.35],.1,rope,'Running line adjusts the yard’s orientation.',{parentId:yard,explode:[shift+7,lift,0]});
    beam(`${m.name} ${stage+1} ${side<0?'port':'starboard'} sheet`,'propulsion',assembly,foot,[m.x+5,base,side*W*.37],.1,rope,'Running line supports the sail’s lower corner.',{parentId:sail,explode:[shift+16,lift,0]});
    beam(`${m.name} ${stage+1} ${side<0?'port':'starboard'} lift`,'propulsion',assembly,tip,[m.x,top+5,0],.09,rope,'Rigging line supports the yard end.',{parentId:yard,explode:[shift+7,lift,0]});
    cyl(`${m.name} ${stage+1} sheet block ${side}`,'propulsion',assembly,[m.x+1,top-m.heights[stage]+.5,side*m.widths[stage]*.42],[.8,1.15,.6],wood,'Wooden sheave block redirects a running line.',{parentId:sail,explode:[shift+16,lift,0]});
   }
   beam(`${m.name} ${stage+1} halyard`,'propulsion',assembly,[m.x-.6,base,0],[m.x-.6,top,0],.11,rope,'Halyard supports raising and lowering this yard.',{parentId:mast,explode:[shift,lift,0]});
   parent=mast;base=top-2;
  }
  for(const side of [-1,1]){
   for(let k=0;k<5;k++){
    const a:Vec3=[m.x-4+k*1.8,m.base+.8,side*W*.48],b:Vec3=[m.x,m.tops[0]-2,side*.7];
    const shroud=beam(`${m.name} ${side<0?'port':'starboard'} shroud ${k+1}`,'propulsion',`${m.name} standing rigging`,a,b,.14,rope,'Standing shroud braces the mast laterally.',{parentId:deckIds[2],explode:[shift,55,side*12]});
    cyl(`${m.name} upper deadeye ${side}-${k+1}`,'propulsion',`${m.name} standing rigging`,[a[0],a[1]+2,a[2]],[.9,.3,.9],wood,'Upper deadeye secures the shroud above its tensioning lanyard.',{rotation:[Math.PI/2,0,0],parentId:shroud,explode:[shift,55,side*12]});
    beam(`${m.name} shroud lanyard ${side}-${k+1}`,'propulsion',`${m.name} standing rigging`,[a[0],a[1]+.7,a[2]],[a[0],a[1]+1.9,a[2]],.14,rope,'Continuous lanyard links the deadeye pair and tensions the standing shroud.',{parentId:shroud,explode:[shift,55,side*12]});
    cyl(`${m.name} deadeye ${side}-${k+1}`,'propulsion',`${m.name} standing rigging`,[a[0],a[1]+.6,a[2]],[.9,.3,.9],wood,'Deadeye provides a tensioning attachment for its shroud.',{rotation:[Math.PI/2,0,0],parentId:shroud,explode:[shift,55,side*12]});
   }
   for(let rung=1;rung<22;rung++){
    const t=rung/23,y=m.base+.8+(m.tops[0]-2-m.base-.8)*t,z=side*(W*.48*(1-t)+.7*t);
    beam(`${m.name} ratline ${side}-${rung}`,'propulsion',`${m.name} standing rigging`,[m.x-4*(1-t),y,z],[m.x+3.2*(1-t),y,z],.075,rope,'Footrope rung for climbing the shrouds.',{decorative:true,parentId:deckIds[2],explode:[shift,55,side*12]});
   }
   beam(`${m.name} ${side<0?'port':'starboard'} backstay`,'propulsion',`${m.name} standing rigging`,[m.x,m.tops[1],0],[m.x-14,m.base,side*W*.43],.14,rope,'Standing backstay restrains forward mast bending.',{parentId:deckIds[2],explode:[shift,58,side*10]});
  }
  beam(`${m.name} forestay`,'propulsion',`${m.name} standing rigging`,[m.x,m.tops[0],0],[mi===0?59:m.x+22,mi===0?23:m.base,0],.17,rope,'Longitudinal stay supports the mast against after-directed loads.',{parentId:deckIds[2],explode:[shift,55,0]});
  for(let pin=0;pin<8;pin++)cyl(`${m.name} belaying pin ${pin+1}`,'propulsion',`${m.name} line handling`,[m.x-3+(pin%4)*2,14.3,(pin<4?-1:1)*3],[.3,1.3,.3],plank,'Removable belaying pin secures an individual running line.',{parentId:deckIds[2],explode:[shift,42,0]});
 }
 const bowsprit=beam('Bowsprit','propulsion','Headsails',[39,14.5,0],[64,25,0],1.4,wood,'Forward spar carries the headsail rigging beyond the stem.',{parentId:fore,explode:[22,54,0]});
 beam('Jibboom','propulsion','Headsails',[58,22.5,0],[74,29,0],.65,wood,'Extension of the bowsprit supporting outer headsail rigging.',{parentId:bowsprit,explode:[30,62,0]});
 for(const [jib,left,right,head,foot,mastY] of [['Inner',30,64,47,25,51],['Outer',43,74,48,29,59]] as const){
  const ex:Vec3=[jib==='Inner'?25:35,jib==='Inner'?62:74,0];
  const sail=add(`${jib} black jib`,'propulsion','Headsails',[(left+right)/2,(head+foot)/2,0],[right-left,head-foot,5],cloth,'Triangular headsail is attached along its diagonal stay with a sheet at the clew.',{shape:'triangularSail',parentId:bowsprit,explode:ex});
  beam(`${jib} jib supporting stay`,'propulsion','Headsails',[left,head,0],[right,foot,0],.15,rope,'Standing stay supports the complete diagonal headsail luff.',{parentId:sail,explode:ex});
  beam(`${jib} jib mast attachment`,'propulsion','Headsails',[25,mastY,0],[left,head,0],.15,rope,'Standing stay continues from the sail head to the foremast.',{parentId:sail,explode:ex});
  for(const side of [-1,1])beam(`${jib} jib clew sheet ${side}`,'propulsion','Headsails',[left,foot,0],[29,17,side*7],.12,rope,'Sheet leads from the free headsail corner to deck handling points.',{parentId:sail,explode:ex});
 }
 for(const side of [-1,1])beam(`Bowsprit bobstay ${side}`,'propulsion','Headsails',[44,3,side*2],[65,25,0],.18,rope,'Stay restrains the bowsprit against upward rigging loads.',{parentId:bowsprit,explode:[22,54,side*7]});
 add('Mizzen lateen sail','propulsion','Mizzen lateen',[-34,39,0],[23,19,4],cloth,'After triangular canvas balances the fore-and-aft sail plan.',{shape:'triangularSail',rotation:[0,Math.PI,0],parentId:quarter,explode:[-29,76,0]});
 beam('Mizzen lateen yard','propulsion','Mizzen lateen',[-46,29,0],[-23,49,0],.42,wood,'Oblique yard carries the after sail.',{parentId:quarter,explode:[-29,76,0]});
 // Deck fittings and manually powered ship services, with no modern equipment placeholders.
 const figurehead=add('Winged sea figurehead','structure','Bow ornament',[50,13.4,0],[1.3,3.5,1.1],plank,'Original carved sea figure decorates and identifies the bow; it is not a copy of the film prop sculpture.',{shape:'sphere',parentId:fore,explode:[18,53,0]});
 add('Figurehead carved head','structure','Bow ornament',[50.2,15.5,0],[1.1,1.25,1.1],plank,'Head of the original carved figure.',{shape:'sphere',decorative:true,parentId:figurehead,explode:[18,53,0]});
 for(const side of [-1,1])for(let feather=0;feather<7;feather++)beam(`Figurehead wing feather ${side}-${feather}`,'structure','Bow ornament',[50,14.5,side*.3],[48.5-feather*.18,16.7-feather*.45,side*(2.2+feather*.14)],.24,plank,'Carved wing detail of the original figurehead.',{decorative:true,parentId:figurehead,explode:[18,53,0]});
 add('Stern carved compass crest','accommodation','Stern ornament',[-48.65,22.7,0],[.6,2.4,2.5],brass,'Original raised compass-inspired stern crest, independent of film prop ornament.',{shape:'sphere',parentId:poop,explode:[-15,71,0]});
 for(const side of [-1,1]){
  beam(`Stern lantern post ${side}`,'electrical','Oil lanterns',[-42,18.2,side*W*.4],[-42,23,side*W*.4],.35,wood,'Timber post supports the elevated stern lantern.',{parentId:quarter,explode:[-6,54,side*8]});
  for(let pillar=0;pillar<8;pillar++)cyl(`Gallery carved column ${side}-${pillar+1}`,'accommodation','Stern gallery',[-47+pillar*2,19.7,side*W*.4],[.35,3.3,.35],brass,'Carved gallery column frames the stern lights.',{decorative:true,parentId:quarter,explode:[-6,54,side*8]});
 }
 const capstan=cyl('Main capstan barrel','mooring','Capstan',[15,15,0],[3,3.3,3],wood,'Crew-powered rotating barrel takes hauling lines.',{parentId:deckIds[2],explode:[10,47,0]});
 for(const [name,y,sz] of [['Capstan crown',16.8,3.8],['Capstan pawl ring',13.5,3.6]] as const)cyl(name,'mooring','Capstan',[15,y,0],[sz,.5,sz],iron,'Part of the manual capstan assembly.',{parentId:capstan,explode:[10,47,0]});
 for(let i=0;i<6;i++){const t=i*Math.PI/3;beam(`Capstan handspike ${i+1}`,'mooring','Capstan',[15,16.3,0],[15+Math.cos(t)*5,16.3,Math.sin(t)*5],.22,plank,'Removable lever allows the crew to turn the capstan.',{parentId:capstan,explode:[10,47,0]});}
 const wheel=add('Helm wheel rim','navigation','Manual helm',[-29,20.1,0],[4,.28,4],wood,'Handwheel transmits helm movement through rope to the tiller.',{shape:'torus',rotation:[0,0,Math.PI/2],parentId:quarter,explode:[-9,61,0]});
 for(let i=0;i<10;i++){const t=i*Math.PI/5;beam(`Wheel spoke ${i+1}`,'navigation','Manual helm',[-29,20.1,0],[-29,20.1+2.5*Math.cos(t),2.5*Math.sin(t)],.15,plank,'Spoke and hand grip of the helm wheel.',{decorative:true,parentId:wheel,explode:[-9,61,0]});}
 cyl('Helm drum','navigation','Manual helm',[-29.7,20.1,0],[1.2,2,1.2],wood,'Drum takes the steering rope attached to the tiller.',{rotation:[0,0,Math.PI/2],parentId:wheel,explode:[-9,61,0]});
 add('Helm pedestal','navigation','Manual helm',[-29.7,18.8,0],[1.6,3,1.5],wood,'Timber support carries the helm spindle.',{parentId:wheel,explode:[-9,61,0]});
 add('Rudder blade','propulsion','Manual steering',[-49,-3,0],[3.2,13,.9],wood,'Immersed timber rudder turns the ship by redirecting water flow.',{parentId:shell,explode:[-20,-2,0]});
 cyl('Rudder stock','propulsion','Manual steering',[-47.8,2,0],[1.2,18,1.2],iron,'Vertical stock connects the tiller to the rudder.',{interior:true,explode:[-16,5,0]});
 beam('Manual tiller','propulsion','Manual steering',[-47.8,10.5,0],[-38,10.5,0],.7,wood,'Timber lever applies steering torque to the rudder stock.',{interior:true,explode:[-15,22,0]});
 for(const side of [-1,1]){
  beam(`Steering rope ${side}`,'navigation','Manual helm',[-29.5,17.8,side*1.2],[-40,10.5,side*4],.14,rope,'Rope connection links the helm drum to the tiller tackle.',{interior:true,explode:[-9,30,side*4]});
  const anchor=beam(`${side<0?'Port':'Starboard'} bower anchor shank`,'mooring','Anchors',[39,6,side*W*.34],[39,13,side*W*.34],.65,iron,'Bower anchor holds the vessel through the seabed and its cable.',{parentId:fore,explode:[14,20,side*16]});
  beam(`Anchor stock ${side}`,'mooring','Anchors',[36,11,side*W*.34],[42,11,side*W*.34],.7,wood,'Transverse stock encourages the anchor to settle on a fluke.',{parentId:anchor,explode:[14,20,side*16]});
  for(const branch of [-1,1])beam(`Anchor fluke arm ${side}-${branch}`,'mooring','Anchors',[39,6,side*W*.34],[39+branch*2.8,8,side*W*.34],.65,iron,'Curved arm and fluke outline of the anchor.',{decorative:true,parentId:anchor,explode:[14,20,side*16]});
  beam(`Cathead ${side}`,'mooring','Anchors',[35,17,side*W*.2],[38,18,side*W*.56],.7,wood,'Projecting timber supports the anchor while being brought aboard.',{parentId:fore,explode:[14,50,side*10]});
  beam(`Anchor cable ${side}`,'mooring','Anchors',[39,13,side*W*.34],[29,16.9,side*4],.35,rope,'Heavy rope cable connects the ship to its anchor.',{parentId:fore,explode:[14,50,side*10]});
 }
 for(let i=0;i<8;i++)add(`Mooring bitt ${i+1}`,'mooring','Deck mooring',[i<4?32:-34,14.8,(i%4-1.5)*3],[.8,2.8,.8],wood,'Strong timber post secures an external line.',{parentId:deckIds[2],explode:[i<4?12:-12,44,0]});
 for(let i=0;i<4;i++){
  const x=-10+i*5,z=i%2?5:-5,ex:Vec3=[0,47,z<0?-12:12];
  const pump=cyl(`Hand bilge pump ${i+1} barrel`,'ballast','Hand bilge pumps',[x,14.8,z],[.9,3.1,.9],wood,'Manually operated pump removes water from the bilge.',{parentId:deckIds[2],explode:ex});
  cyl(`Hand bilge pump ${i+1} suction tube`,'ballast','Hand bilge pumps',[x,4,z],[.35,18,.35],wood,'Suction tube reaches low in the hull.',{interior:true,parentId:pump,explode:ex});
  for(const [n,y] of [['piston',15.2],['non-return valve',13.4],['strainer',-4.7]] as const)cyl(`Hand bilge pump ${i+1} ${n}`,'ballast','Hand bilge pumps',[x,y,z],[.65,.65,.65],iron,`${n} within the manual bilge pumping assembly.`,{interior:n!=='piston',parentId:pump,explode:ex});
  beam(`Hand bilge pump ${i+1} lever`,'ballast','Hand bilge pumps',[x-2,16.5,z],[x+1,15.8,z],.22,wood,'Lever transfers crew effort to the pump piston.',{parentId:pump,explode:ex});
 }
 for(let i=0;i<12;i++){
  const x=-42+(i%6)*15,z=i<6?-W*.4:W*.4,y=x<-29?23.5:17.5;
  const lantern=add(`Deck lantern ${i+1}`,'electrical','Oil lanterns',[x,y,z],[.9,1.5,.9],iron,'Enclosed oil lantern provides local illumination; no electric installation is implied.',{parentId:x<-29?poop:deckIds[2],explode:[0,x<-29?74:47,z<0?-6:6]});
  add(`Lantern ${i+1} translucent panes`,'electrical','Oil lanterns',[x,y,z],[.94,1,.94],'#bfa16a','Protective translucent lantern panes.',{decorative:true,parentId:lantern,explode:[0,x<-29?74:47,z<0?-6:6]});
 }
 for(let i=0;i<8;i++)add(`Lamp oil canister ${i+1}`,'fuel','Lamp oil store',[-20+(i%4)*2,-.2,i<4?-3:3],[1.2,2,1.2],'#514837','Separate closed container for lamp fuel; fictional inventory.',{shape:'barrel',interior:true,explode:[0,8,14]});
 add('Galley fuel locker','fuel','Galley',[-20,6.4,0],[4,3.5,3],wood,'Enclosed stowage for the galley’s solid fuel.',{interior:true,explode:[0,19,10]});
 add('Galley brick hearth','utilities','Galley',[-15,6.5,0],[5,4,4],'#705245','Fire-resistant hearth supports cooking away from exposed timber.',{interior:true,explode:[0,19,-12]});
 cyl('Galley chimney','utilities','Galley',[-15,11,0],[1.2,8,1.2],iron,'Flue leads smoke above the working deck.',{parentId:deckIds[2],explode:[0,43,-8]});
 for(let i=0;i<6;i++)cyl(`Galley cooking pot ${i+1}`,'utilities','Galley',[-17+(i%3)*2,9,i<3?-1:1],[1.1,1,1.1],iron,'Individual cooking vessel in the reconstructed galley.',{interior:true,explode:[0,23,-14]});
 for(let i=0;i<32;i++){
  const water=i<16,sys=water?'utilities':'cargo',a=water?'Fresh water casks':'Provision casks';
  const cask=add(`${water?'Fresh water':'Dry provision'} cask ${i%16+1}`,sys,a,[-26+(i%8)*7,-3,(i%16<8?-1:1)*(water?3:7)],[2.6,4,2.6],plank,water?'Wooden cask stores drinking water for the crew.':'Coopered cask stores provisions for a voyage.',{shape:'barrel',interior:true,explode:[0,9,water?-14:14]});
  for(const y of [-1.4,1.4])add(`Cask ${i+1} iron hoop ${y}`,sys,a,[-26+(i%8)*7,-3+y,(i%16<8?-1:1)*(water?3:7)],[2.7,.14,2.7],iron,'Iron band holds the staves together.',{shape:'torus',decorative:true,parentId:cask,explode:[0,9,water?-14:14]});
 }
 for(let i=0;i<24;i++)add(`Crew hammock ${i+1}`,'accommodation','Crew berths',[-30+(i%8)*8,11,(Math.floor(i/8)-1)*5],[6,1.6,2.1],'#8a8065','Individual suspended sleeping berth; illustrative accommodation arrangement.',{shape:'sail',rotation:[Math.PI/2,0,0],interior:true,parentId:deckIds[1],explode:[0,31,(Math.floor(i/8)-1)*8]});
 for(let i=0;i<12;i++)add(`Crew sea chest ${i+1}`,'accommodation','Crew possessions',[-26+(i%6)*9,9.6,i<6?-7:7],[3,1.7,2],wood,'Chest protects one crew member’s possessions.',{interior:true,parentId:deckIds[1],explode:[0,26,i<6?-10:10]});
 for(const [name,x,z,sz] of [['Captain’s berth',-42,-5,[7,1.7,4]],['Chart table',-39,3,[5,2.8,3]],['Captain’s sea chest',-44,5,[3,2,2]],['Cabin writing desk',-35,-4,[4,3,2]],['Cabin bench',-37,6,[5,1.6,1.5]]] as const)add(name,'accommodation','Captain’s cabin',[x,19,z],[...sz],plank,'Period furniture within the original reconstructed stern cabin.',{interior:true,parentId:quarter,explode:[-6,59,0]});
 for(let i=0;i<3;i++)add(`Crew mess table ${i+1}`,'accommodation','Mess',[-10+i*8,10.1,0],[5,2.8,3],plank,'Shared table for crew meals and tasks.',{interior:true,parentId:deckIds[1],explode:[0,28,0]});
 add('Binnacle cabinet','navigation','Navigation',[-24,19,0],[2,3,2],wood,'Protected cabinet holds the magnetic compass near the helm.',{parentId:quarter,explode:[-8,60,0]});
 cyl('Magnetic compass bowl','navigation','Navigation',[-24,20.5,0],[1.5,.5,1.5],brass,'Magnetic direction reference, with no electronic navigation implied.',{parentId:quarter,explode:[-8,63,0]});
 for(const [name,p] of [['Sounding lead',[28,14.2,7]],['Sandglass',[-24,21,0]],['Log-line reel',[-42,23,0]],['Handheld telescope',[-25,18,3]],['Chart folio',[-39,20.5,3]]] as const)add(name,'navigation','Period navigation',[...p],[1.4,.5,.8],brass,'Illustrative period instrument supporting observation or voyage records.',{parentId:quarter,explode:[-10,63,0]});
 for(let i=0;i<2;i++){
  const z=i===0?-4:4;
  const boat=add(`Ship’s boat ${i+1}`,'safety','Ship’s boats',[9,15,z],[14,3.4,5],plank,'Open pulling boat for transfers and emergency use.',{shape:'hull',parentId:deckIds[2],explode:[0,51,i===0?-17:17]});
  for(let j=0;j<4;j++)add(`Boat ${i+1} rowing thwart ${j+1}`,'safety','Ship’s boats',[5+j*2.5,16,z],[.7,.25,4],wood,'Cross-seat supports a rower.',{parentId:boat,explode:[0,54,i===0?-17:17]});
  for(let j=0;j<4;j++)beam(`Boat ${i+1} oar ${j+1}`,'safety','Ship’s boats',[3,16.5,z-.8+j*.5],[14,16.5,z-.8+j*.5],.2,plank,'Hand-powered oar propels the ship’s boat.',{parentId:boat,explode:[0,57,i===0?-17:17]});
 }
 for(let i=0;i<10;i++)add(`Fire bucket ${i+1}`,'safety','Fire response',[-15+i*3,14.1,-W*.39],[.9,1.3,.9],plank,'Individual bucket for carrying water in a fire response.',{shape:'barrel',parentId:deckIds[2],explode:[0,46,-12]});
 add('Surgical stores chest','safety','Medical stores',[-24,5.7,5],[3,2,2],wood,'Protected storage for period medical supplies.',{interior:true,parentId:deckIds[0],explode:[0,14,10]});
 appendBlackPearlInterior(v,out,deckIds);
 return out;
}
