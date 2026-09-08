import { Euler, Quaternion, Vector3 } from 'three';
import type { Component, SystemId, Vec3, VesselRecord } from '../data/schema';
import { systemById } from '../data/systems';
import { hullHalfWidth } from './geometry';
import { buildBlackPearl } from './blackPearl';
const roleText:Record<string,string>={
'casing':'Contains the working fluid and supports the rotating assembly.',
'impeller':'Transfers rotational energy into fluid pressure and flow.',
'shaft':'Transmits torque between the driving and driven equipment.',
'bearing':'Supports the rotating shaft while allowing controlled movement.',
'seal':'Restricts leakage where a rotating shaft passes through a stationary casing.',
'motor':'Converts electrical energy into mechanical rotation.',
'coupling':'Connects shafts while accommodating small alignment differences.',
'suction':'Routes fluid from the supply circuit into the pump.',
'discharge':'Routes pressurised fluid into the downstream circuit.',
'valve':'Controls or isolates flow through this branch.',
'strainer':'Intercepts debris before it reaches sensitive machinery.',
'pressure gauge':'Indicates local pressure for operational checks.',
'foundation':'Transfers equipment forces into the supporting structure.',
'breaker':'Interrupts current when protection detects an electrical fault.',
'busbar':'Distributes electrical current within a switchboard.',
'contactor':'Switches an electrical load under control-system command.',
'inverter':'Controls the frequency and voltage supplied to an electric motor.',
'piston':'Receives cylinder pressure and transfers force to the connecting mechanism.',
'liner':'Provides the working surface of the cylinder.',
'injector':'Meters fuel into the combustion space.',
'exhaust valve':'Controls the release of combustion gases.',
'connecting rod':'Transfers reciprocating force to the crankshaft.',
'cylinder head':'Closes the cylinder and supports its valves and injection equipment.',
'cooling jacket':'Carries cooling fluid around heat-loaded engine surfaces.',
'crankshaft':'Converts reciprocating cylinder forces into rotary torque.',
'bulkhead':'Separates compartments and contributes to structural load transfer.',
'frame':'Supports shell plating against local pressure and shape distortion.',
'girder':'Transfers longitudinal loads through the hull structure.',
'detector':'Monitors its protected space for an abnormal condition.',
'panel':'Presents controls, indications and alarm information.',
'heat exchanger':'Transfers heat between separate fluid circuits without mixing them.',
'fan':'Moves air through a ventilation or cooling circuit.',
'damper':'Controls air movement and can isolate a ventilation route.',
'filter':'Removes unwanted material from a fluid or air stream.',
};
function purpose(name:string,system:SystemId){const key=Object.keys(roleText).find(k=>name.toLowerCase().includes(k));return key?roleText[key]:systemById[system].summary;}
export function buildModel(v:VesselRecord):Component[]{
 if(v.kind==='pirate')return buildBlackPearl(v);
 const supportedDetails:{ids:string[];support:string;clearance:number;outward?:number}[]=[];
 const out:Component[]=[];const counts:Record<string,number>={};const s=v.length/100;const W=v.beam/v.length*100;const D=Math.min(22,v.depth/v.length*100);const top=D*.38;const large=v.length>=180;const electric=['tug','autonomous'].includes(v.kind);const passenger=['cruise','ferry','roro','livestock','catamaran'].includes(v.kind);const aftHouse=['container','bulk','general','tanker','chemical','lng','inland','autonomous'].includes(v.kind);
 // Proportions are authored per architecture; floor heights are in metres, not ship length.
 const houseProfiles:Record<string,[number,number,number,number]>={
  container:[-29,11,7,.77],bulk:[-36,14,7,.72],general:[-35,16,4,.76],tanker:[-35,15,7,.69],chemical:[-34,15,6,.73],lng:[-35,17,7,.8],
  cruise:[-1,76,13,.88],ferry:[-3,72,6,.9],roro:[-2,79,9,.91],livestock:[-2,75,8,.89],catamaran:[-2,76,3,.86],
  ahts:[24,33,4,.8],tug:[8,37,2,.55],rescue:[22,34,4,.77],fishing:[21,33,4,.78],
  utility:[7,40,4,.79],icebreaker:[0,38,5,.79],research:[9,45,5,.8],yacht:[-1,62,5,.72],naval:[14,21,3,.77],
  cable:[27,31,5,.85],wind:[30,20,5,.8],dredger:[-9,29,3,.64],fpso:[-37,15,6,.73],inland:[-40,12,2,.73],autonomous:[-35,15,3,.75]
 };
 const [houseX,houseL,levels,houseBeam]=houseProfiles[v.kind]??[25,20,4,.76];
 const levelH=(v.kind==='tug'?2.2:v.kind==='livestock'?2.2:v.kind==='roro'?2.6:2.85)/s;
 const houseTop=top+levels*levelH+.25;
 const bridgeX=v.kind==='tug'?houseX:passenger?Math.min(25,houseX+houseL*.33):houseX+houseL*.2;
 const railH=1.05/s;

 type Opt=Partial<Pick<Component,'shape'|'rotation'|'interior'|'decorative'|'parentId'|'purpose'|'fidelity'|'explode'|'localExplode'>>;
 function add(name:string,sys:SystemId,assembly:string,p:Vec3,size:Vec3,color=systemById[sys].color,opt:Opt={}):string{
 const key=`${sys}.${assembly.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.${name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}`;counts[key]=(counts[key]??0)+1;const id=`${v.id}.${key}.${counts[key]}`;
 const dir:Record<SystemId,Vec3>={structure:[0,-10,0],propulsion:[-8,10,0],electrical:[-4,15,-W*.9],fuel:[0,5,W],cargo:[0,18,0],navigation:[0,29,0],safety:[0,15,W],ballast:[0,-3,W*.9],utilities:[0,12,-W],accommodation:[0,23,0],mooring:[8,8,0]};
 out.push({id,vesselId:v.id,name,systemId:sys,assembly,parentId:opt.parentId??null,shape:opt.shape??'box',position:p.map(n=>n*s) as Vec3,size:size.map(n=>n*s) as Vec3,rotation:opt.rotation??[0,0,0],color,explode:(opt.explode??dir[sys]).map(n=>n*s*1.55) as Vec3,localExplode:(opt.localExplode??[0,2,0]).map(n=>n*s) as Vec3,interior:opt.interior??false,decorative:opt.decorative??false,fidelity:opt.fidelity??'reconstructed',purpose:opt.purpose??purpose(name,sys),sourceIds:opt.fidelity==='reference-informed'?[...systemById[sys].sourceIds,...v.sources.map(source=>source.id)]:systemById[sys].sourceIds});return id;
 }
 const box=(name:string,sys:SystemId,a:string,p:Vec3,sz:Vec3,c?:string,o?:Opt)=>add(name,sys,a,p,sz,c,o);
 const cyl=(name:string,sys:SystemId,a:string,p:Vec3,sz:Vec3,c?:string,o?:Opt)=>add(name,sys,a,p,sz,c,{...o,shape:'cylinder'});
 function beam(name:string,sys:SystemId,a:string,p:Vec3,q:Vec3,r:number,color:string,decorative=false){const dx=q[0]-p[0],dy=q[1]-p[1],dz=q[2]-p[2];const len=Math.hypot(dx,dy,dz);const orientation=new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),new Vector3(dx,dy,dz).normalize()));cyl(name,sys,a,[(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2],[r,len,r],color,{rotation:[orientation.x,orientation.y,orientation.z],decorative});}
 // All coordinates are authored in a 100-unit design envelope, then converted to metres.
 if(v.kind==='crane'||v.kind==='catamaran'){
 for(const side of [-1,1]) {add(`${side<0?'Port':'Starboard'} pontoon`,'structure','Twin hulls',[0,-D*.25,side*W*.34],[100,D*.7,W*.26],v.hullColor,{shape:'hull'});if(v.kind==='crane')for(let i=0;i<4;i++)box(`Support column ${side} ${i+1}`,'structure','Columns',[-35+i*23,D*.21,side*W*.32],[9,D*.34, W*.19],v.hullColor);}
 }else if(v.kind==='heavy')box('Submersible transport hull','structure','Hull',[0,-D*.2,0],[100,D,W],v.hullColor);
 else {add('Outer hull shell','structure','Hull',[0,-D*.05,0],[100,D*.85,W],v.hullColor,{shape:'hull',fidelity:'reference-informed'});add('Antifouling underwater shell','structure','Hull',[0,-D*.05,0],[100,D*.85,W],'#8e403b',{shape:'hull'});}
 add('Main strength deck','structure','Decks',[0,top,0],[v.kind==='catamaran'?91:98,.22,W*(v.kind==='catamaran'?.89:.98)],v.kind==='naval'?'#657979':v.deckColor,{shape:['heavy','crane','catamaran'].includes(v.kind)?'box':'deck'});
 const frameN=large?36:18;
 for(let i=0;i<frameN;i++){const x=-43+i*86/(frameN-1);const bw=W*(.25+.7*Math.pow(Math.sin((i+1)/(frameN+1)*Math.PI),.25));for(const side of [-1,1])box(`${side<0?'Port':'Starboard'} transverse frame ${i+1}`,'structure','Transverse framing',[x,-D*.05,side*bw*.46],[.25,D*.65,.25],'#7c9490',{interior:true});box(`Floor transverse ${i+1}`,'structure','Double bottom',[x,-D*.35,0],[.3,.3,bw*.9],'#66817e',{interior:true});}
 for(let i=0;i<(large?12:6);i++)box(`Longitudinal girder ${i+1}`,'structure','Double bottom',[0,-D*.32,(i/((large?12:6)-1)-.5)*W*.78],[82,.3,.18],'#718b82',{interior:true});
 for(let i=0;i<(large?12:6);i++)box(`Watertight bulkhead ${i+1}`,'structure','Subdivision',[-39+i*78/((large?12:6)-1),-D*.02,0],[.18,D*.65,W*.85],'#7b9d99',{interior:true});
 // Superstructure: separate floors, glazing bands and navigable deck levels.
 if(!['heavy','crane','naval'].includes(v.kind))for(let i=0;i<levels;i++){
 const passengerStep=v.kind==='roro'||v.kind==='livestock'?0:passenger?Math.max(0,i-levels+4)*3.5:v.kind==='yacht'?i*5:0;
 const len=houseL-passengerStep-(v.kind==='tug'&&i>0?houseL*.32:0);const x=houseX-(v.kind==='yacht'?i*1.5:0);const h=levelH;const y=top+.15+i*h;const width=W*houseBeam-(v.kind==='yacht'?i*W*.06:v.kind==='tug'&&i>0?W*.16:0);
 box(`Deck ${i+1} floor`,'accommodation','Superstructure',[x,y,0],[len,.14/s,width],'#d8ded6');
 box(`Deck ${i+1} enclosure`,'accommodation','Superstructure',[x,y+h*.48,0],[len-.2,h*.88,width-.3],v.kind==='tug'?'#2d9e4b':v.kind==='naval'?'#a4b1b1':v.kind==='roro'&&i<levels-2?v.hullColor:'#e1e4db');
 const windows=Math.max(4,Math.floor(len*s/2.5));
 for(const side of [-1,1])for(let j=0;j<windows&&!(v.kind==='roro'&&i<levels-2)&&!(v.kind==='ferry'&&i<2);j++)box(`Deck ${i+1} window ${side} ${j+1}`,'accommodation','Glazing',[x-len*.45+j*len*.9/(windows-1),y+h*.56,side*width*.501],[len/windows*.58,h*(v.kind==='livestock'?.64:.38),.045/s],'#244956',{decorative:true});
 }
 if(!['heavy','crane','naval'].includes(v.kind)){
 const weatherDeckLength=houseL-(v.kind==='tug'?houseL*.32:v.kind==='yacht'?(levels-1)*5:v.kind==='roro'||v.kind==='livestock'?0:passenger?10.5:0);
 const weatherDeckWidth=W*houseBeam-(v.kind==='tug'?W*.16:v.kind==='yacht'?(levels-1)*W*.06:0);
 box('Superstructure weather deck','accommodation','Superstructure',[houseX-(v.kind==='yacht'?(levels-1)*1.5:0),top+levels*levelH,0],[weatherDeckLength,.15/s,weatherDeckWidth],v.kind==='tug'?'#319e4f':'#e0e4de');
 const bridgeLength=Math.min(houseL*(v.kind==='tug'?.53:.6),6.5/s);const bridgeHeight=2.4/s;const bridgeWidth=W*(v.kind==='tug'?.42:houseBeam+.04);
 box('Wheelhouse','navigation','Bridge',[bridgeX,houseTop,0],[bridgeLength,bridgeHeight,bridgeWidth],v.kind==='tug'?'#2d9e4b':'#dfe3d9');
 for(let j=0;j<10;j++)box(`Bridge front window ${j+1}`,'navigation','Glazing',[bridgeX+bridgeLength*.501,houseTop+.1,(j-4.5)*bridgeWidth*.095],[.05/s,bridgeHeight*.58,bridgeWidth*.073],'#264e5b',{decorative:true});
 for(const side of [-1,1])box(`Bridge wing ${side}`,'navigation','Bridge',[bridgeX,houseTop-bridgeHeight*.4,side*bridgeWidth*.43],[bridgeLength,.15/s,bridgeWidth*.24],v.kind==='tug'?'#3aa653':'#d6dfd8');
 const mastHeight=(v.kind==='tug'?4:7)/s;
 cyl('Main mast','navigation','Mast',[bridgeX-bridgeLength*.3,houseTop+bridgeHeight*.5+mastHeight*.5,0],[(v.kind==='tug'?.45:.25)/s,mastHeight,(v.kind==='tug'?.45:.25)/s],v.kind==='tug'?'#247b9c':'#c6cec1');box('Radar scanner','navigation','Radar',[bridgeX-bridgeLength*.3,houseTop+bridgeHeight*.5+mastHeight,0],[2.4/s,.22/s,.4/s],'#d7dfd6');
 if(v.kind==='tug'){
 // The delivery photograph shows panoramic glazing, a stayed blue mast and green casing.
 for(const side of [-1,1]){
 for(let pane=0;pane<5;pane++)box(`Wheelhouse side pane ${side} ${pane+1}`,'navigation','Glazing',[bridgeX-bridgeLength*.42+pane*bridgeLength*.21,houseTop+.1,side*bridgeWidth*.503],[bridgeLength*.17,bridgeHeight*.76,.05/s],'#183c4b',{decorative:true});
 for(let pane=0;pane<5;pane++)box(`Wheelhouse aft pane ${side} ${pane+1}`,'navigation','Glazing',[bridgeX-bridgeLength*.503,houseTop+.1,side*(pane+.5)*bridgeWidth*.087],[.05/s,bridgeHeight*.76,bridgeWidth*.071],'#183c4b',{decorative:true});
 const mx=bridgeX-bridgeLength*.3,my=houseTop+bridgeHeight*.5;
 beam(`Mast support stay ${side}`,'navigation','Mast',[mx+3,my,side*3],[mx,my+mastHeight*.45,0],.5,'#237c9a',true);
 for(let yard=0;yard<3;yard++){
 beam(`Mast signal yard ${side} ${yard+1}`,'navigation','Mast',[mx,my+mastHeight*(.3+yard*.22),0],[mx,my+mastHeight*(.3+yard*.22),side*(4.1-yard*.5)],.25,'#237c9a',true);
 cyl(`Mast signal light ${side} ${yard+1}`,'navigation','Mast',[mx,my+mastHeight*(.3+yard*.22)+.3,side*(4.1-yard*.5)],[.55,.6,.55],'#dae3d4',{decorative:true});
 }
 cyl(`Auxiliary uptake ${side}`,'utilities','Exhaust',[houseX-8,houseTop-1,side*W*.21],[1.35,14,1.35],'#92988d',{purpose:'Visible auxiliary exhaust uptake, reconstructed from the 2022 delivery photograph; this is not evidence of a diesel main propulsion engine.'});
 box(`Deckhouse access door ${side}`,'accommodation','Superstructure',[houseX+8,top+4,side*W*houseBeam*.503],[3.1,7,.25],'#a8b4b0',{decorative:true});
 }
 box('Wheelhouse roof visor','navigation','Bridge',[bridgeX,houseTop+bridgeHeight*.52,0],[bridgeLength+1.5,.55,bridgeWidth+1.5],'#278d45',{decorative:true});
}
 for(const side of [-1,1]){add(`${side<0?'Port':'Starboard'} satellite dome`,'navigation','Communications',[bridgeX-bridgeLength*.3,houseTop+bridgeHeight*.5+.6/s,side*bridgeWidth*.3],[1.1/s,1.1/s,1.1/s],'#e6e4d7',{shape:'sphere'});}
 }
 // Mission geometry: each vessel family has its own arrangements.
 if(['container','inland','autonomous'].includes(v.kind)){
 const bays=v.kind==='container'?18:10, rows=v.kind==='container'?12:5, tiers=v.kind==='container'?6:3;const start=v.kind==='container'?-43:-38;const spacing=v.kind==='container'?4.5:6;
 const colors=['#38816e','#b99060','#af5947','#496f80','#a8ac91','#536e5b','#c4b488'];
 for(let b=0;b<bays;b++){const x=start+b*spacing;if(Math.abs(x-houseX)<houseL*.5+spacing*.6)continue;box(`Cargo hatch ${b+1}`,'cargo','Hatch covers',[x,top+.35,0],[spacing-.15,.3,W*.88],'#607f6c');for(let r=0;r<rows;r++)for(let t=0;t<tiers-(b>15?1:0);t++){const y=top+.4+1.3/s+t*2.6/s,z=(r-(rows-1)/2)*W*(v.kind==='container'?.071:.17);box(`Bay ${b+1} row ${r+1} tier ${t+1}`,'cargo','Container stacks',[x,y,z],[spacing-(v.kind==='container'?.62:.28),2.5/s,W*(v.kind==='container'?.065:.16)],colors[(b*5+r*3+t)%colors.length],{decorative:true});}}
 for(let i=0;i<14;i++)for(const side of [-1,1]){box(`Cell guide ${side} ${i+1}`,'cargo','Hold cell guides',[-20+i*4.5,-D*.02,side*W*.33],[.22,D*.6,.22],'#96b7aa',{interior:true});box(`Reefer distribution panel ${side} ${i+1}`,'cargo','Reefer supply',[-20+i*4.5,top+.7,side*W*.43],[.5,.8,.35],'#d8dbbf');}
 }
 if(['bulk','general'].includes(v.kind))for(let i=0;i<(v.kind==='bulk'?9:4);i++){const x=-20+i*(v.kind==='bulk'?7:15);box(`Hold ${i+1} tank top`,'cargo','Cargo holds',[x,-D*.15,0],[v.kind==='bulk'?6:13,.25,W*.68],'#997953',{interior:true});box(`Hatch cover ${i+1}`,'cargo','Hatches',[x,top+.65,0],[v.kind==='bulk'?6:13,.75,W*.74],v.kind==='bulk'?'#a5534f':'#a59983');}
 function crane(x:number,z:number,h:number,reach:number,a:string){
 const y=top,heavy=v.kind==='crane',base=heavy?8:4,boomStart=heavy?13:5;
 const root=cyl(`${a} pedestal`,'cargo',a,[x,y+base*.5,z],[heavy?10:2.2,base,heavy?10:2.2],heavy?'#d2d8d5':'#c9b77a');
 cyl(`${a} slew ring`,'cargo',a,[x,y+base,z],[heavy?12:3,heavy?1.2:.6,heavy?12:3],'#637984',{parentId:root});
 box(`${a} machinery house`,'cargo',a,[x-1,y+base+(heavy?3:1),z],[heavy?13:3,heavy?6:2,heavy?13:3],heavy?'#d6dfdf':'#d9c690',{parentId:root});
 beam(`${a} main boom`,'cargo',a,[x,y+boomStart,z],[x+reach,y+h,z],heavy?.8:.55,heavy?'#6b8fa1':'#d3bd78');
 beam(`${a} boom tie`,'cargo',a,[x-(heavy?7:1),y+base+(heavy?15:4),z],[x+reach,y+h,z],heavy?.25:.12,'#b8c4b9');
 beam(`${a} hoist wire`,'cargo',a,[x+reach,y+h,z],[x+reach,y+4,z],heavy?.22:.09,'#899893');
 cyl(`${a} hook block`,'cargo',a,[x+reach,y+4,z],[heavy?2.6:.65,heavy?4:1,heavy?2.6:.65],'#d5b969');
 const span=heavy?3.4:Math.max(.7,h*.022), bays=heavy?14:8;
 if(heavy){
 const run=h-boomStart,norm=Math.hypot(run,reach),nx=run/norm,ny=-reach/norm;
 const corner=(t:number,side:number,face:number):Vec3=>[x+reach*t+nx*span*.6*face,y+boomStart+run*t+ny*span*.6*face,z+side*span];
 for(const side of [-1,1])for(const face of [-1,1]){
  beam(`${a} main lattice chord ${side} ${face}`,'cargo',a,corner(0,side,face),corner(1,side,face),.42,'#809faf',true);
  for(let bay=0;bay<bays;bay++){const t=bay/bays,nt=(bay+1)/bays;beam(`${a} side lattice ${side} ${face} ${bay}`,'cargo',a,corner(t,side,face),corner(nt,side,-face),.22,'#a0b9c3',true);beam(`${a} face lattice ${side} ${face} ${bay}`,'cargo',a,corner(t,side,face),corner(nt,-side,face),.2,'#91acb8',true);}
 }
 for(const side of [-1,1])beam(`${a} backstay tower ${side}`,'cargo',a,[x-5,y+base+3,z+side*4],[x-7,y+base+15,z+side*2],.6,'#809faf');
 }else for(const side of [-1,1]){beam(`${a} lattice chord ${side}`,'cargo',a,[x,y+5,z+side*span],[x+reach,y+h,z+side*span],.18,'#cbbc92',true);for(let bay=0;bay<8;bay++){const t=bay/8,nt=(bay+1)/8;beam(`${a} lattice diagonal ${side} ${bay+1}`,'cargo',a,[x+reach*t,y+5+(h-5)*t,z+side*span],[x+reach*nt,y+5+(h-5)*nt,z-side*span],.1,'#cabd94',true);}}
 }
 if(v.kind==='general')for(let i=0;i<3;i++)crane(-17+i*18,W*.3,14,12,`Deck crane ${i+1}`);
 if(v.kind==='bulk')for(let i=0;i<4;i++){
 const x=-22+i*19,z=-W*.3,y=top+8.15;
 const wing=add(`WindWing ${i+1}`,'cargo','Wind assistance',[x,y,z],[3.8,12.5,.58],'#e5e8e3',{shape:'cylinder',fidelity:'reference-informed',purpose:'The central cambered element of one of four retrofitted wind-assistance sails. Overall published wing dimensions are 37.5 m high by 20 m wide; the foil geometry is reconstructed.'});
 for(const side of [-1,1])add(`WindWing ${i+1} ${side<0?'forward':'aft'} foil element`,'cargo','Wind assistance',[x+side*2.55,y,z+.08],[1.56,12.5,.42],'#dce3df',{shape:'cylinder',parentId:wing,fidelity:'reference-informed'});
 cyl(`Wing rotation drive ${i+1}`,'cargo','Wind assistance',[x,top+1.35,z],[1.3,2.7,1.3],'#873b35');
 box(`Wing foundation stool ${i+1}`,'cargo','Wind assistance',[x,top+.6,z],[3.5,1.2,2.2],'#9d4b40');
 beam(`Wing head tie ${i+1}`,'cargo','Wind assistance',[x-3.3,y+6.25,z],[x+3.3,y+6.25,z],.16,'#b6c6c7',true);
 for(const side of [-1,1])beam(`Wing hinge ${i+1} ${side}`,'cargo','Wind assistance',[x+side*1.88,y-6.25,z+.1],[x+side*1.88,y+6.25,z+.1],.09,'#a3b5bc',true);
 }

 if(['tanker','chemical','lng','fpso'].includes(v.kind)){
 const n=v.kind==='chemical'?12:v.kind==='lng'?4:8;
 for(let i=0;i<n;i++){const x=-20+i*(65/n);for(const side of (v.kind==='lng'?[0]:[-1,1])){const a=`Cargo tank ${i+1}${side===0?'':side<0?' port':' starboard'}`;const z=side*W*.23;
 box(a,'cargo',a,[x,-D*.05,z],[60/n,D*.65,v.kind==='lng'?W*.78:W*.42],v.kind==='lng'?'#9caeae':'#759797',{interior:true});
 if(v.kind==='lng'){box(`Insulated tank dome ${i+1}`,'cargo',a,[x,top+1.1,0],[12,2.5,W*.78],'#c4cbc0');box(`Vapour dome ${i+1}`,'cargo',a,[x,top+3,0],[2.5,1.2,3],'#d3d7c9');}
 for(let j=0;j<5;j++)cyl(`${a} ${['cargo valve','vent riser','level gauge','sampling line','pump column'][j]}`,'cargo',a,[x-1+j*.5,top+.7,z],[.22,1.2,.22],j%2?'#cab984':'#a9c4b6');}
 }
 for(let j=0;j<(v.kind==='chemical'?10:5);j++)cyl(`Cargo pipeline ${j+1}`,'cargo','Deck piping',[10,top+.45,(j-2)*.45],[.18,69,.18],j%2?'#b8ab83':'#95b5a6',{rotation:[0,0,Math.PI/2]});
 }
 if(passenger){for(let deck=0;deck<(v.kind==='cruise'?10:6);deck++)for(const side of [-1,1])for(let room=0;room<8;room++){const a=`Deck ${deck+1} ${side<0?'port':'starboard'} ${v.kind==='roro'?'vehicle zone':v.kind==='livestock'?'pen':'cabin'} ${room+1}`;box(a,'accommodation',`Deck ${deck+1} interiors`,[-27+room*7,top+deck*levelH+levelH*.4,side*W*.28],[5,.5,W*.26],'#b8b8a1',{interior:true,purpose:v.kind==='roro'?'An illustrative vehicle-stowage zone within an internal deck.':v.kind==='livestock'?'An illustrative livestock pen served by water, feed and ventilation.':'An illustrative occupied space within the accommodation decks.'});}
 if(['ferry','roro'].includes(v.kind)){box('Stern loading ramp','cargo','Vehicle access',[-48,top+1,0],[8,.5,W*.55],'#b9b8a2',{rotation:[0,0,.2]});}
 if(v.kind==='cruise'){
 const promenadeY=top+levels*levelH+.14;
 box('Upper sun deck','cargo','Public decks',[-6,promenadeY,0],[49,.14,W*.78],'#c8baa1');
 for(let i=0;i<3;i++){const px=-24+i*15;box(`Pool basin ${i+1}`,'cargo','Public decks',[px,promenadeY+.3,0],[8.6,.5,W*.29],'#f0f4ef');box(`Pool water surface ${i+1}`,'cargo','Public decks',[px,promenadeY+.57,0],[7.7,.08,W*.24],'#259fd0',{decorative:true});
 for(const side of [-1,1])for(let seat=0;seat<6;seat++)box(`Poolside lounger ${i+1} ${side} ${seat}`,'cargo','Public decks',[px-3+seat*1.15,promenadeY+.35,side*W*.24],[.72,.3,.42],'#e5e9df',{decorative:true});}
 for(const side of [-1,1]){
 const fx=-3,z=side*W*.27;
 box(`Uptake casing ${side}`,'propulsion','Cruise uptakes',[fx,promenadeY+1.8,z],[5,3.4,2.4],'#235680');
 box(`Uptake cap ${side}`,'propulsion','Cruise uptakes',[fx,promenadeY+3.6,z],[5.3,.35,2.7],'#163345');
 for(let flue=0;flue<4;flue++)cyl(`Exhaust flue ${side} ${flue}`,'propulsion','Cruise uptakes',[fx-1.6+flue,promenadeY+3.95,z],[.4,.65,.4],'#2b3f4c');
 box(`Sun deck canopy ${side}`,'cargo','Public decks',[11,promenadeY+1.3,side*W*.3],[10,.18,2.3],'#e5e9df');
 for(let post=0;post<4;post++)cyl(`Canopy post ${side} ${post}`,'cargo','Public decks',[7+post*2.7,promenadeY+.7,side*W*.3],[.12,1.2,.12],'#cad8dc',{decorative:true});
 }
 box('Waterpark access tower','cargo','Waterpark',[-27,promenadeY+2.2,W*.25],[2,4.4,2],'#e2c6a0');
 for(let slide=0;slide<3;slide++){
 const z=(-1+slide)*W*.16,color=['#e48b3d','#63afac','#b6bf48'][slide];
 add(`Waterslide turn ${slide+1}`,'cargo','Waterpark',[-29+slide*1.2,promenadeY+2.7+slide*.4,z],[5,.9,3],color,{shape:'torus'});
 beam(`Waterslide descent ${slide+1}`,'cargo','Waterpark',[-27+slide*1.2,promenadeY+2.7+slide*.4,z],[-19,promenadeY+.6,z],.45,color);
 }
 add('AquaDome envelope','cargo','AquaDome',[24,promenadeY+1.4,0],[17,7,W*.75],'#8faeb0',{shape:'sphere'});
 }
 }
 if(['ahts','tug','rescue','fishing'].includes(v.kind)){
 const deckX=v.kind==='tug'?35:-22;for(const side of [-1,1]){cyl(`${side<0?'Port':'Starboard'} mission winch drum`,'cargo','Working deck',[deckX,top+(v.kind==='tug'?3.2:1.7),side*W*(v.kind==='tug'?.12:.21)],[v.kind==='tug'?5.3:2.8,W*(v.kind==='tug'?.17:.25),v.kind==='tug'?5.3:2.8],v.kind==='tug'?'#353c3d':'#697c77',{rotation:[Math.PI/2,0,0]});box('Winch foundation','cargo','Working deck',[deckX,top+.4,side*W*.21],[5,.4,W*.32],'#a9a795');}
 cyl('Stern roller','cargo','Working deck',[-46,top+1,0],[1.6,W*.8,1.6],'#bdad83',{rotation:[Math.PI/2,0,0]});
 if(v.kind==='fishing'){for(const side of [-1,1])beam('Trawl gantry leg','cargo','Trawl gantry',[-39,top,side*W*.35],[-39,top+11,side*W*.35],.6,'#dadfd2');beam('Trawl gantry crosshead','cargo','Trawl gantry',[-39,top+11,-W*.35],[-39,top+11,W*.35],.6,'#dadfd2');}
 if(v.kind==='tug'){
 // Rubber and bulwark sections are decorative, excluded from the meaningful inventory.
 for(let i=0;i<18;i++){
 const x=-43+i*5,z=W*hullHalfWidth((x+50)/100,v.kind);
 add(`Hull fender ${i+1}`,'structure','Fendering',[x,top+.5,z],[2.8,4.3,2.5],'#172026',{shape:'sphere',decorative:true});
 add(`Port hull fender ${i+1}`,'structure','Fendering',[x,top+.5,-z],[2.8,4.3,2.5],'#172026',{shape:'sphere',decorative:true});
 }
 for(const side of [-1,1])for(let section=0;section<32;section++){
 const x=-48+section*96/32,nx=-48+(section+1)*96/32,z=side*W*hullHalfWidth((x+50)/100,v.kind),nz=side*W*hullHalfWidth((nx+50)/100,v.kind);
 beam(`Continuous rubbing belt ${side} ${section+1}`,'structure','Fendering',[x,top-.35,z],[nx,top-.35,nz],2.1,'#142027',true);
 box(`Blue bulwark section ${side} ${section+1}`,'structure','Bulwarks',[(x+nx)*.5,top+2.1,(z+nz)*.5],[Math.hypot(nx-x,nz-z)+.12,4.2,.75],v.hullColor,{rotation:[0,-Math.atan2(nz-z,nx-x),0],decorative:true});
 if(x>20)beam(`Forebody rubber cushion ${side} ${section+1}`,'structure','Fendering',[x,top+2.7,z+.55*side],[nx,top+2.7,nz+.55*side],3.8,'#182125',true);
 }
 for(const side of [-1,1]){
 cyl(`Towing winch brake plate ${side}`,'cargo','Working deck',[35,top+3.2,side*W*.225],[6.1,.6,6.1],'#247b9c',{rotation:[Math.PI/2,0,0],decorative:true});
 box(`Towing fairlead pedestal ${side}`,'cargo','Working deck',[42,top+2.8,side*W*.15],[3,5.6,2.6],'#247b9c');
 }
 beam('Towing fairlead crossbar','cargo','Working deck',[42,top+5.6,-W*.15],[42,top+5.6,W*.15],1.6,'#414d51');
 cyl('Fire monitor riser','safety','Firefighting',[houseX+houseL*.32,top+levelH+1.1,W*.2],[1.5,3,1.5],'#26954a');
 beam('Fire monitor nozzle','safety','Firefighting',[houseX+houseL*.32,top+levelH+2.7,W*.2],[houseX+houseL*.32+3,top+levelH+3.1,W*.2],1.2,'#cc4b35');
 }

 }
 if(['research','yacht','rescue'].includes(v.kind)){crane(-18,-W*.27,11,10,'Service crane');const hx=36;add('Helicopter landing deck','cargo','Aviation',[hx,top+1,0],[17,.3,W*.8],'#658779',{shape:'cylinder'});}
 if(v.kind==='utility'||v.kind==='icebreaker'){
 const utility=v.kind==='utility',cx=utility?-20:33,cz=utility?-W*.24:0;
 const a=utility?'Buoy-handling crane':'Polar cargo crane';
 const root=cyl(`${a} pedestal`,'cargo',a,[cx,top+2,cz],[3,4,3],'#e0e5e2',{fidelity:'reference-informed'});
 cyl(`${a} slew bearing`,'cargo',a,[cx,top+4.2,cz],[3.5,.65,3.5],'#82969d',{parentId:root});
 box(`${a} machinery housing`,'cargo',a,[cx,top+5.2,cz],[4.5,2.4,3.3],'#e3e8e5',{parentId:root});
 const end=utility?cx-15:22;
 beam(`${a} articulated boom`,'cargo',a,[cx,top+6.2,cz],[end,top+9,cz],1.4,'#e4e9e5');
 beam(`${a} hydraulic ram`,'cargo',a,[cx+(utility?-1:1),top+4.8,cz],[utility?cx-9:26,top+8.2,cz],.38,'#a3b3bb');
 beam(`${a} hook wire`,'cargo',a,[end,top+9,cz],[end,top+3,cz],.11,'#4d6370');
 cyl(`${a} hook block`,'cargo',a,[end,top+3,cz],[.7,1.2,.7],'#c69b4e');
 const hx=utility?36:-37,hy=utility?top+2.2:top+3.5;
 add('Helicopter landing deck','cargo','Aviation',[hx,hy,0],[utility?19:23,.35,W*.83],'#527e70',{shape:utility?'cylinder':'box',fidelity:'reference-informed'});
 add('Flight-deck landing circle','cargo','Aviation',[hx,hy+.2,0],[W*.64,.1,W*.64],'#ead88d',{shape:'torus',decorative:true});
 for(const side of [-1,1])box(`Flight-deck H leg ${side}`,'cargo','Aviation',[hx+side*1.4,hy+.23,0],[.3,.05,4],'#f0e9bf',{decorative:true});
 box('Flight-deck H crossbar','cargo','Aviation',[hx,hy+.24,0],[2.8,.05,.3],'#f0e9bf',{decorative:true});
 if(utility){
 add('Forecastle platform','structure','Decks',[29,top+.8,0],[32,1.6,W*.83],'#d6dedb',{shape:'hull'});
 for(let buoy=0;buoy<3;buoy++){const x=-36+buoy*7,z=W*.16;const color=buoy===1?'#b5483b':'#ccaa46';cyl(`Recovered navigation buoy ${buoy+1}`,'cargo','Buoy deck',[x,top+1,z],[2.6,2,2.6],color);add(`Buoy topmark support ${buoy+1}`,'cargo','Buoy deck',[x,top+3,z],[1.6,2.2,1.6],color,{shape:'cone'});}
 for(let i=0;i<2;i++)add(`Workboat ${i+1}`,'cargo','Workboats',[-8+i*13,top+1.3,W*.41],[7,1.4,2.4],'#bd593a',{shape:'hull'});
 }else{
 for(const x of [-45,-29])for(const side of [-1,1])box(`Aft flight-deck support ${x} ${side}`,'structure','Aviation supports',[x,top+1.7,side*W*.31],[.45,3.4,.45],'#c2cdca');
 box('Helicopter hangar','cargo','Aviation',[-20,top+6,0],[15,5,W*.72],'#dfe5df',{fidelity:'reference-informed'});
 box('Hangar aft door','cargo','Aviation',[-27.6,top+5.7,0],[.12,4.1,W*.53],'#8d9d9e');
 for(let rack=0;rack<6;rack++)box(`Aft laboratory container berth ${rack+1}`,'cargo','Scientific deck',[-39+(rack%3)*6.5,top+.3,(rack<3?-1:1)*W*.26],[5.9,.15,2.6],'#667f76');
 }
 }
 if(v.kind==='cable'){cyl('Cable carousel','cargo','Cable storage',[-16,top+2,0],[W*.76,4,W*.76],'#b98351');for(let i=0;i<6;i++)add(`Cable winding ${i+1}`,'cargo','Cable storage',[-16,top+4.1,0],[W*(.25+i*.065),.4,W*(.25+i*.065)],'#c2a980',{shape:'torus',decorative:true});box('Cable tensioner','cargo','Lay line',[-37,top+1.4,0],[9,2,3],'#dbad5e');crane(0,W*.3,14,13,'Cable handling crane');}
 if(v.kind==='wind'){for(const x of [-32,32])for(const side of [-1,1]){const z=side*W*.37;cyl(`Jack-up leg ${x} ${side}`,'cargo','Jacking',[x,top+22,z],[2.2,76,2.2],'#b8b5a1');box(`Spudcan ${x} ${side}`,'cargo','Jacking',[x,top-16,z],[8,1.8,8],'#687f79');for(let i=0;i<12;i++)box(`Jacking rack ${x} ${side} ${i+1}`,'cargo','Jacking',[x+.9,top-12+i*5,z],[.3,3,.3],'#6e827b',{decorative:true});}crane(-26,W*.24,75,28,'Installation crane');}
 if(v.kind==='crane'){crane(-31,-W*.29,55,22,'Port heavy crane');crane(-31,W*.29,55,22,'Starboard heavy crane');box('Accommodation block','accommodation','Superstructure',[30,top+8,0],[25,15,W*.65],'#d3d9d2');}
 if(v.kind==='heavy'){for(const x of [-38,37])for(const side of [-1,1])box(`Buoyancy tower ${x} ${side}`,'ballast','Buoyancy towers',[x,top+7,side*W*.45],[9,14,W*.09],side>0?'#d8d9c9':v.hullColor);box('Offset deckhouse','accommodation','Superstructure',[30,top+12,W*.42],[13,14,W*.11],'#e3e2d3');}
 if(v.kind==='fpso'){
 for(let i=0;i<10;i++){
 const x=-28+i*6.5,a=`Process module ${i+1}`;box(a,'cargo','Topside processing',[x,top+.6,0],[5.8,.6,W*.73],'#adad96');
 for(const side of [-1,1]){
 const z=side*W*.29;
 for(const end of [-1,1])box(`Process support ${i+1} ${side} ${end}`,'cargo','Topside steelwork',[x+end*2.4,top+3.4,z],[.23,5.6,.23],'#a9bbbc');
 box(`Process service deck ${i+1} ${side}`,'cargo','Topside steelwork',[x,top+5.9,z],[5.7,.2,W*.24],'#b9b6a1');
 beam(`Process diagonal ${i+1} ${side}`,'cargo','Topside steelwork',[x-2.4,top+.7,z],[x+2.4,top+5.8,z],.17,'#d4c7a4',true);
 cyl(`Separator ${i+1} ${side}`,'cargo','Separation',[x,top+2.4,z],[1.6,4.6,1.6],'#bacbd0',{rotation:[0,0,Math.PI/2]});
 cyl(`Upper pressure vessel ${i+1} ${side}`,'cargo','Gas treatment',[x,top+6.8,z],[1.25,4.4,1.25],'#d0d9d3',{rotation:[0,0,Math.PI/2]});
 }
 box(`Process crossbeam ${i+1}`,'cargo','Topside steelwork',[x,top+5.8,0],[.3,.4,W*.7],'#a9bbbc');
 for(let pipe=0;pipe<4;pipe++)cyl(`Process pipe ${i+1} ${pipe}`,'cargo','Pipe rack',[x,top+3.7+pipe*.34,0],[.19,6.5,.19],pipe%2?'#b1b8ae':'#d0b774',{rotation:[0,0,Math.PI/2]});
 if(i%3===0){cyl(`Gas-treatment tower ${i+1}`,'cargo','Gas treatment',[x,top+8.2,-W*.09],[1.55,9,1.55],'#bccbce');add(`Tower platform ${i+1}`,'cargo','Gas treatment',[x,top+11,-W*.09],[2.1,.3,2.1],'#a5b6b9',{shape:'torus'});}
 }
 for(const side of [-1,1])beam(`Flare lattice chord ${side}`,'cargo','Flare',[40,top+2,side*1.2],[63,top+27,side*.7],.27,'#c5b993');
 beam('Flare boom','cargo','Flare',[40,top+2,0],[63,top+27,0],.6,'#b3a580');
 for(let bay=0;bay<10;bay++){const t=bay/10,nt=(bay+1)/10;for(const side of [-1,1])beam(`Flare lattice diagonal ${side} ${bay}`,'cargo','Flare',[40+23*t,top+2+25*t,side*(1.2-.5*t)],[40+23*nt,top+2+25*nt,-side*(1.2-.5*nt)],.12,'#c5b993',true);}
 cyl('Flare tip','cargo','Flare',[63,top+28,0],[.7,2,.7],'#8d9a9c');
 }
 if(v.kind==='dredger'){beam('Cutter ladder','cargo','Cutter ladder',[-40,top,0],[-65,-D*2,0],2.8,'#c8b98a');add('Cutter head','cargo','Cutter ladder',[-65,-D*2,0],[5,4,5],'#ae784b',{shape:'sphere'});for(const side of [-1,1])cyl(`Spud ${side}`,'cargo','Spuds',[38,top+7,side*W*.27],[1.1,30,1.1],'#b6b293');}
 if(v.kind==='naval'){
 // Reference-informed 2013 Type45 exterior. Internal locations remain reconstructed.
 const grey='#a6b2bb',shadow='#738792',deck='#607681';
 box('Enclosed amidships weather structure','accommodation','Naval superstructure',[-3,top+1.7,0],[53,3.4,W*.72],grey,{fidelity:'reference-informed'});
 box('Forward superstructure','accommodation','Naval superstructure',[13,top+3.5,0],[22,6.3,W*.71],grey,{shape:'chamferedBox',fidelity:'reference-informed'});
 box('Bridge deck','navigation','Bridge',[18,top+6.8,0],[9,2.1,W*.82],grey,{shape:'chamferedBox',fidelity:'reference-informed'});
 box('Wheelhouse','navigation','Bridge',[19.1,top+7,0],[6.5,1.9,W*.85],grey,{shape:'chamferedBox',fidelity:'reference-informed'});
 for(let window=0;window<10;window++)box(`Bridge front window ${window+1}`,'navigation','Glazing',[22.27,top+7.2,(window-4.5)*W*.054],[.1,.92,W*.045],'#183545',{decorative:true});
 for(const side of [-1,1]){
 box(`Bridge wing ${side}`,'navigation','Bridge',[18.6,top+6.2,side*W*.4],[9,.4,W*.2],grey);
 box(`Bridge side glazing ${side}`,'navigation','Glazing',[18.6,top+7.2,side*W*.414],[3.8,.92,.08],'#183545',{decorative:true});
 for(let pane=0;pane<3;pane++)box(`Angled bridge pane ${side} ${pane+1}`,'navigation','Glazing',[21.35+pane*.25,top+7.2,side*(W*.396-pane*.36)],[.6,.92,.08],'#183545',{rotation:[0,side*.75,0],decorative:true});
 box(`Concealed boat-bay screen ${side}`,'safety','Survival craft',[-6,top+2.6,side*W*.435],[13,3.1,.18],grey);
 box(`Boat-bay recessed opening ${side}`,'safety','Survival craft',[-6,top+2.6,side*W*.443],[9,1.3,.08],shadow,{decorative:true});
 add(`Enclosed boat-bay rescue craft ${side}`,'safety','Survival craft',[-6,top+2.2,side*W*.3],[4.5,.9,1.4],'#788d95',{shape:'hull',interior:true});
 add(`Bridge communications dome ${side}`,'navigation','Communications',[14,top+9.1,side*W*.24],[1.2,1.2,1.2],'#d1dddf',{shape:'sphere'});
 }
 add('Integrated forward mast','navigation','Sensors',[9,top+16.05,0],[5.6,19.5,5.2],grey,{shape:'cone',fidelity:'reference-informed'});
 box('Main mast equipment collar','navigation','Sensors',[9,top+11.2,0],[6.2,.65,5.7],shadow);
 add('SAMPSON radar radome','navigation','Sensors',[9,top+27.5,0],[3.4,3.4,3.4],'#c0ced4',{shape:'sphere',fidelity:'reference-informed'});
 for(const side of [-1,1]){
 beam(`Main mast yardarm ${side}`,'navigation','Mast',[9,top+12,side*2],[9,top+12,side*6],.14,grey);
 cyl(`Yardarm aerial ${side}`,'navigation','Mast',[9,top+13,side*5.5],[.06,2,.06],'#526b7d');
 box(`Mast navigation array ${side}`,'navigation','Sensors',[10.9,top+20,side*.9],[.22,.85,.5],'#d1dade');
 }
 // Two enclosed uptake housings; no exposed civilian service crane or merchant funnel.
 for(let funnel=0;funnel<2;funnel++){
 const x=-3-funnel*8;
 add(`Uptake housing ${funnel+1}`,'propulsion','Naval uptakes',[x,top+6.8,0],[6.3,6.8,5.3],grey,{shape:'cone',fidelity:'reference-informed'});
 box(`Uptake dark outlet ${funnel+1}`,'propulsion','Naval uptakes',[x,top+10.25,0],[2.6,.25,2.2],'#263a48');
 for(let pipe=0;pipe<3;pipe++)cyl(`Uptake exhaust ${funnel+1} ${pipe+1}`,'propulsion','Naval uptakes',[x,top+10.6,(pipe-1)*.55],[.35,.55,.35],'#314654');
 }
 box('Helicopter hangar','cargo','Aviation',[-23,top+3.6,0],[18,7.2,W*.77],grey,{fidelity:'reference-informed'});
 box('Hangar roof','cargo','Aviation',[-23,top+7.3,0],[18.3,.3,W*.8],deck);
 box('Hangar door','cargo','Aviation',[-32.05,top+3,0],[.1,5.6,W*.54],'#566c7b',{fidelity:'reference-informed'});
 for(let seam=0;seam<6;seam++)box(`Hangar door segment ${seam+1}`,'cargo','Aviation',[-32.12,top+3,(seam-2.5)*W*.085],[.07,5.4,.03],'#8fa0ac',{decorative:true});
 box('Helicopter landing deck','cargo','Aviation',[-40,top+.25,0],[18.5,.25,W*.81],deck,{fidelity:'reference-informed'});
 add('Flight-deck landing circle','cargo','Aviation',[-40,top+.41,0],[W*.65,.09,W*.65],'#d7dfd9',{shape:'torus',decorative:true});
 for(const side of [-1,1])box(`Flight-deck centre marking ${side}`,'cargo','Aviation',[-40+side*1.1,top+.43,0],[.14,.04,3],'#e0e6de',{decorative:true});
 box('Flight-deck centre crossbar','cargo','Aviation',[-40,top+.44,0],[2.2,.04,.14],'#e0e6de',{decorative:true});
 add('Aft radar mast','navigation','Sensors',[-22,top+10.5,0],[4.6,6.4,3.8],grey,{shape:'cone',fidelity:'reference-informed'});
 box('S1850M long-range radar face','navigation','Sensors',[-22,top+14.2,0],[.7,2.5,6.3],'#263c4a',{rotation:[0,0,.12],fidelity:'reference-informed'});
 cyl('Communications aerial mast','navigation','Mast',[-15,top+13.5,W*.21],[.12,13,.12],'#526a79');
 for(let cross=0;cross<4;cross++)beam(`Communications mast yard ${cross+1}`,'navigation','Mast',[-15,top+10+cross*1.8,W*.21-1],[-15,top+10+cross*1.8,W*.21+1],.09,'#526a79');
 box('Forward mission-deck coaming','cargo','Mission equipment',[28.4,top+.52,0],[9.8,.8,W*.49],shadow,{fidelity:'reference-informed'});
 for(let bank=0;bank<4;bank++)for(let cell=0;cell<6;cell++)box(`Illustrative launcher-deck panel ${bank+1} ${cell+1}`,'cargo','Mission equipment',[25.2+bank*2.1,top+.96,(cell-2.5)*W*.065],[1.8,.13,W*.055],'#acb9c0',{decorative:true,purpose:'A schematic external launcher-deck panel. Counts and dimensions are illustrative; this is not a weapon-system model.'});
 add('Forward gun housing','cargo','Mission equipment',[37,top+1.65,0],[4.6,3.3,4.2],grey,{shape:'cone',fidelity:'reference-informed'});
 beam('Gun barrel exterior','cargo','Mission equipment',[38.4,top+2.5,0],[43,top+3.1,0],.23,'#607581');
 cyl('Foredeck jackstaff','navigation','Deck fittings',[46.5,top+2.3,0],[.08,4.6,.08],'#a9b8be');
 }
 // Reconstructed machinery assemblies. Real physical roles; none claim exact OEM layouts.
 function pump(a:string,sys:SystemId,x:number,y:number,z:number,k=1){
 const root=box(`${a} foundation`,sys,a,[x,y-.55*k,z],[3.7*k,.25*k,1.8*k],'#5f7670',{interior:true});
 const names=['motor','coupling','shaft','drive bearing','casing','impeller','mechanical seal','suction valve','discharge valve','suction strainer','pressure gauge','non-return valve'];
 names.forEach((n,i)=>{const xx=x+(i<7?(i-3)*.4:((i-7)%3-1)*.8)*k;const yy=y+(i>=7?.9:0)*k;const zz=z+(i>=7?.7:0)*k;cyl(`${a} ${n}`,sys,a,[xx,yy,zz],[n==='casing'?1.35*k:.55*k,n==='motor'?1.4*k:.6*k,n==='casing'?1.35*k:.55*k],systemById[sys].color,{rotation:[0,0,Math.PI/2],interior:true,parentId:root,localExplode:[(i-5)*.55,i%3,0]});});
 }
 const engineN=electric?0:['cruise','ferry','lng','ahts','naval','icebreaker','research','rescue','catamaran'].includes(v.kind)?2:1;const cylinders=large? (v.kind==='container'?11:8):6;
 for(let e=0;e<engineN;e++){
 const a=`Main machinery ${e+1}`,x=-33,z=(e-(engineN-1)/2)*W*.3,y=-D*.08;const root=box('Engine bedplate','propulsion',a,[x,y-.7,z],[11,1.3,3],'#6b9d89',{interior:true});box('Crankcase','propulsion',a,[x,y+.4,z],[10,1.7,2.7],'#8bae95',{interior:true,parentId:root});cyl('Crankshaft','propulsion',a,[x,y,z],[.6,10,.6],'#a7a08b',{rotation:[0,0,Math.PI/2],interior:true,parentId:root});
 for(let c=0;c<cylinders;c++)for(const [j,n] of ['piston crown','piston rod','connecting rod','cylinder liner','cooling jacket','cylinder head','fuel injector','exhaust valve','main bearing','crosshead guide'].entries())cyl(`Cylinder ${c+1} ${n}`,'propulsion',a,[x-4+c*8/(cylinders-1),y+.5+j*.18,z+(j>5?.6:0)],[j<5?.65:.35,j<5?.6:.25,j<5?.65:.35],j%2?'#a7b6a3':'#718c80',{interior:true,parentId:root,localExplode:[0,1+j*.65,(j%2?1:-1)*1.2]});
 pump(`Lubricating oil pump ${e+1}`,'propulsion',x+7,y,z, .7);
 }
 if(electric){for(let bank=0;bank<4;bank++){const a=`Battery bank ${bank+1}`;const x=-20+bank*11;const root=box(a,'fuel',a,[x,-D*.05,0],[8,D*.5,W*.6],'#6b9699',{interior:true});for(let m=0;m<12;m++)box(`Module ${m+1}`,'fuel',a,[x-3+(m%4)*2,-D*.1+Math.floor(m/4)*.45,-W*.12],[1.7,.35,W*.2],'#97b5a7',{interior:true,parentId:root});['isolation contactor','battery management controller','cooling manifold','current sensor'].forEach((n,i)=>box(n,'electrical',a,[x-3+i*2,1,0],[1,.5,1],'#d2b971',{interior:true,parentId:root}));}}
 if(electric)for(let drive=0;drive<2;drive++){
 const a=`Electric propulsion drive ${drive+1}`,x=-32,z=(drive===0?-1:1)*W*.22;
 const root=box(`${a} enclosure`,'electrical',a,[x,-D*.05,z],[7,4,3],'#92a6ab',{interior:true});
 ['DC isolator','DC link capacitor','Precharge resistor','Inverter power stage','Motor controller','Earth fault monitor','Cooling plate','Current transducer','Voltage transducer','Gate driver','Motor winding','Rotor shaft','Drive bearing','Motor temperature sensor'].forEach((n,i)=>box(n,'electrical',a,[x+(i%4-1.5)*1.3,-D*.04+Math.floor(i/4)*.4,z],[.9,.3,.5],'#7da5b4',{interior:true,parentId:root}));
 }
 const units=large?3:2;
 const circuits:[SystemId,string][]=[['ballast','Ballast transfer'],['ballast','Bilge extraction'],['utilities','Seawater cooling'],['utilities','Freshwater circulation'],['utilities','Fire-main supply'],[electric?'utilities':'fuel',electric?'Battery coolant circulation':'Fuel transfer'],[electric?'utilities':'fuel',electric?'Power-electronics cooling':'Fuel conditioning'],['cargo','Mission hydraulic'],['utilities','Wastewater transfer']];
 circuits.forEach(([sys,label],i)=>{for(let p=0;p<units;p++)pump(`${label} ${p+1}`,sys,-22+(i%5)*12,-D*.1,(i<5?-1:1)*W*.25+p*.65,large?.75:.9);});
 for(let t=0;t<(large?16:8);t++){const a=`Ballast tank ${t+1}`;const x=-35+(t%(large?8:4))*((large?70/7:70/3));const z=(t<(large?8:4)?-1:1)*W*.39;const root=box(a,'ballast',a,[x,-D*.17,z],[large?7:15,D*.45,W*.12],'#588e99',{interior:true});['level transmitter','air vent','sounding pipe','isolation valve'].forEach((n,i)=>cyl(n,'ballast',a,[x-1+i*.6,D*.05,z],[.24,.75,.24],'#a2b8a8',{interior:true,parentId:root}));}
 for(let i=0;i<(large?12:8);i++){const a=`Distribution panel ${i+1}`,x=-25+(i%6)*3,y=-D*.02,z=(i<6?-1:1)*W*.2;const root=box(a,'electrical','Power distribution',[x,y,z],[2,2,.6],'#bdbba1',{interior:true});['incoming breaker','busbar','outgoing breaker','protection relay','contactor','meter'].forEach((n,j)=>box(n,'electrical',a,[x+(j%2-.5)*.7,y+(Math.floor(j/2)-1)*.5,z+.4],[.45,.3,.2],j%2?'#d2b981':'#6d9993',{interior:true,parentId:root}));}
 for(let i=0;i<(large?12:6);i++){const x=-25+i*(60/(large?12:6)),a=`Ventilation zone ${i+1}`;['supply fan','fire damper','filter','exhaust fan','temperature sensor'].forEach((n,j)=>box(n,'utilities',a,[x,-D*.02+(j%2)*.7, (j-2)*.6],[1.1,.6,.65],'#91a8a0',{interior:true}));}
 const bridgeItems=['Radar display','Chart display','Heading repeater','Position receiver','Autopilot panel','Steering control','Engine telegraph','VHF radio','GMDSS console','AIS transponder','Depth sounder','Speed log','Wind instrument','Alarm panel','Voyage recorder','Public address panel','Emergency stop panel','Navigation light panel','Compass binnacle','Searchlight control'];
 bridgeItems.forEach((n,i)=>box(n,'navigation','Bridge instruments',[bridgeX+(i%5)*.65/s-1.3/s,houseTop-.5, (Math.floor(i/5)-1.5)*.65],[.9,.6,.5],'#709392',{interior:true}));
 for(let i=0;i<(large?12:6);i++){const x=-35+i*70/(large?11:5);for(const [j,n] of ['Smoke detector','Fire call point','Extinguisher','Emergency light','Fire hose station'].entries())box(`${n} zone ${i+1}`,'safety',`Safety zone ${i+1}`,[x,top+.5, (j-2)*W*.16],[.3,.45,.3],j===2?'#c97652':'#ceba91',{interior:true});}
 for(const side of [-1,1]){
 const z=side*W*(v.kind==='tug'?.38:.46);const n=v.kind==='naval'?0:v.kind==='cruise'?9:large?2:1;for(let i=0;i<n;i++){const x=v.kind==='tug'?-23:v.kind==='cruise'?-27+i*6:houseX-houseL*.2+i*Math.min(7,houseL*.35);add(`${v.kind==='tug'?'Inflatable rescue boat':'Lifeboat'} ${side<0?'port':'starboard'} ${i+1}`,'safety','Survival craft',[x,top+(passenger?levelH*3:1.4/s),z],[Math.min(houseL*.45,(v.kind==='tug'?3.4:7)/s),(v.kind==='tug'?.7:1.3)/s,(v.kind==='tug'?1.5:2.2)/s],v.kind==='tug'?'#43545a':'#d8894e',{shape:'hull'});box(`Davit ${side} ${i+1}`,'safety','Survival craft',[x,top+(passenger?levelH*3:1.2/s),z*.93],[.18/s,2.4/s,.18/s],'#c2c9b7');}
 for(let i=0;i<32;i++){const x=-47+i*94/31;const edge=(xx:number)=>['heavy','crane','catamaran'].includes(v.kind)?W*.48:W*hullHalfWidth((xx/98)+.5,v.kind)*.97;const ez=side*edge(x);box(`Rail stanchion ${side} ${i+1}`,'structure','Deck fittings',[x,top+railH*.5,ez],[.065/s,railH,.065/s],'#bacbc0',{decorative:true});if(i<31){const nx=-47+(i+1)*94/31;beam(`Deck safety rail ${side} ${i+1}`,'structure','Deck fittings',[x,top+railH,ez],[nx,top+railH,side*edge(nx)],.065/s,'#bdc9b6',true);}}
 const a=`${side<0?'Port':'Starboard'} anchor windlass`;cyl(a,'mooring',a,[40,top+1,side*W*.2],[1.7,2,1.7],'#a9ac8a');['drive motor','gearbox','chain wheel','brake','clutch','chain stopper','hawse pipe','anchor shank','anchor fluke'].forEach((n,i)=>box(n,'mooring',a,[38+(i%3)*1.4,top+.5+Math.floor(i/3)*.4,side*W*.2],[.7,.6,.6],'#969a7a'));
 }
 const props=v.kind==='lng'?3:electric||['cruise','catamaran','ahts','naval','rescue','icebreaker','research','ferry','utility'].includes(v.kind)?2:1;
 const azimuth=electric||['lng','cruise','ahts','cable','crane','wind','utility'].includes(v.kind);
 for(let i=0;i<props;i++){
 const z=(i-(props-1)/2)*W*.37;const a=`Propulsor ${i+1}`;const py=-D*.38;const diameter=Math.min(D*.48,(electric?3:6)/s);
 if(v.kind==='catamaran'){
  const jz=(i===0?-1:1)*W*.34;
  cyl('Waterjet discharge nozzle','propulsion',a,[-48,py,jz],[diameter,3,diameter],'#788f99',{rotation:[0,0,Math.PI/2]});
  box('Waterjet reversing bucket','propulsion',a,[-49.4,py,jz],[1,diameter*1.1,diameter*1.15],'#405c70');
  box('Waterjet intake duct','propulsion',a,[-39,py-.5,jz],[9,diameter*.7,diameter],'#728791',{interior:true});
  pump(`Waterjet hydraulic steering ${i+1}`,'propulsion',-35,py,jz,.6);
  continue;
 }
 if(azimuth){
  cyl('Azimuth steering column','propulsion',a,[-43,py+diameter*.35,z],[diameter*.3,diameter*1.2,diameter*.3],'#7e9392');
  cyl('Electric propulsion motor','propulsion',a,[-42,py+diameter,z],[diameter*.65,diameter*.8,diameter*.65],'#7294a7',{interior:true});
  cyl('Azimuth pod housing','propulsion',a,[-44,py,z],[diameter*.48,diameter*1.25,diameter*.48],'#647f89',{rotation:[0,0,Math.PI/2]});
  if(v.kind==='tug')add('Propeller nozzle ring','propulsion',a,[-45,py,z],[diameter*1.12,diameter*.4,diameter*1.12],'#526c73',{shape:'torus',rotation:[0,0,Math.PI/2]});
 }else cyl('Shaft line','propulsion',a,[-41,py,z],[.35,13,.35],'#aca78b',{rotation:[0,0,Math.PI/2],interior:true});
 const px=azimuth?-45:-47;
 cyl('Propeller hub','propulsion',a,[px,py,z],[diameter*.2,diameter*.4,diameter*.2],'#b79559',{rotation:[0,0,Math.PI/2]});
 for(let j=0;j<5;j++){const ang=j*Math.PI*2/5;add(`Propeller blade ${j+1}`,'propulsion',a,[px,py+Math.cos(ang)*diameter*.23,z+Math.sin(ang)*diameter*.23],[diameter*.1,diameter*.52,diameter*.19],'#c3a069',{rotation:[ang,.3,0],shape:'sphere'});}
 if(!azimuth)box('Steering surface','propulsion',a,[-49,py,z],[2.8,diameter*.9,.35],'#6b8a80');
 }
 if(!electric&&!['naval','cruise','crane','fpso','heavy','wind'].includes(v.kind)){const fx=passenger?-20:aftHouse?-40:12;box('Exhaust casing','propulsion','Exhaust',[fx,houseTop-.5,0],[4,4,W*.3],v.kind==='container'?'#d9d8bd':'#6b8483');for(let i=0;i<3;i++)cyl(`Exhaust outlet ${i+1}`,'propulsion','Exhaust',[fx,houseTop+2,(i-1)*.8],[.55,1.1,.55],'#2d3d3e');}
 // Real shipboard support systems, represented schematically without OEM layout claims.
 for(let gen=0;gen<(large?3:electric?0:2);gen++){
 const a=`Service generator ${gen+1}`,x=-18+gen*7,z=W*.12;
 const root=box(`${a} skid`,'electrical',a,[x,-D*.18,z],[6,.3,2.4],'#627d88',{interior:true});
 ['Prime mover crankcase','Alternator stator','Alternator rotor','Excitation regulator','Terminal enclosure','Cooling heat exchanger','Oil filter','Speed governor','Starter motor','Fuel isolation valve','Exhaust silencer','Flexible coupling','Output breaker','Mounting isolator'].forEach((n,i)=>box(n,'electrical',a,[x+(i%5-2)*1,-D*.09+(Math.floor(i/5))*.4,z],[.8,.3,.65],'#8faaaa',{interior:true,parentId:root}));
 }
 for(const side of [-1,1]){
 const a=`${side<0?'Port':'Starboard'} aft mooring winch`;const x=-41,z=side*W*.23;
 const root=cyl(a,'mooring','Aft mooring',[x,top+.7,z],[1.5,2,1.5],'#9aa9a6',{rotation:[Math.PI/2,0,0]});
 ['Drive motor','Reduction gear','Drum brake','Warping head','Fairlead roller','Deck bollard','Mooring line guide'].forEach((n,i)=>box(n,'mooring',a,[x+(i%3-1)*1.3,top+.3,z+(Math.floor(i/3)-1)*.65],[.6,.5,.6],'#93a7a4',{parentId:root}));
 }
 // Functional deck equipment: every counted part has a physical maintenance role.
 // Counts/locations are reconstructed; small grille bars and stanchions stay decorative.
 function weatherVent(label:string,x:number,y:number,z:number,d:number,support:string,assembly='Weather ventilation'){
 const start=out.length;
 const base=cyl(`${label} coaming`,'utilities',assembly,[x,y+d*.25,z],[d,d*.5,d],'#bdcecb',{purpose:'Raises the ventilation opening above its supporting deck to reduce direct water entry.'});
 cyl(`${label} fan casing`,'utilities',assembly,[x,y+d*.86,z],[d*.88,d*.8,d*.88],'#d0dcd7',{parentId:base,purpose:'Encloses and supports the axial ventilation fan.'});
 cyl(`${label} motor`,'utilities',assembly,[x+d*.57,y+d*.85,z],[d*.35,d*.65,d*.35],'#759199',{parentId:base,rotation:[0,0,Math.PI/2]});
 box(`${label} isolation damper`,'utilities',assembly,[x,y+d*.5,z],[d*.75,d*.12,d*.75],'#6c8e95',{parentId:base,localExplode:[d,1,0]});
 add(`${label} weather hood`,'utilities',assembly,[x,y+d*1.39,z],[d*1.35,d*.42,d*1.35],'#e0e7e2',{shape:'sphere',parentId:base,purpose:'Deflects precipitation while allowing ventilation air to pass beneath its rim.',localExplode:[0,3,0]});
 box(`${label} local isolator`,'electrical',assembly,[x-d*.62,y+d*.6,z],[d*.25,d*.45,d*.3],'#8eaca6',{parentId:base,purpose:'Provides local electrical isolation for safe servicing of the ventilation fan.'});
 for(let rib=0;rib<6;rib++)box(`${label} hood grille ${rib+1}`,'utilities',assembly,[x,y+d*1.2,z+(rib-2.5)*d*.14],[d*.88,d*.08,d*.045],'#57747d',{decorative:true,parentId:base});
 supportedDetails.push({ids:out.slice(start).map(c=>c.id),support,clearance:3});
 }
 const detailSize=Math.min(1.6,Math.max(.65,v.beam*.045))/s;
 for(const side of [-1,1]){
 const a=side<0?'Port':'Starboard';
 let vx=houseX-houseL*.32,vy=top+levels*levelH+.085/s,vz=side*W*houseBeam*.28,support='Superstructure weather deck';
 if(v.kind==='tug'){vx=-19;vy=top+.11+.01/s;vz=side*W*.24;support='Main strength deck';}
 if(v.kind==='naval'){vx=-28;vy=top+7.45+.01/s;vz=side*W*.23;support='Hangar roof';}
 if(v.kind==='heavy'){vx=30;vy=top+19+.01/s;vz=W*(.42+side*.025);support='Offset deckhouse';}
 if(v.kind==='crane'){vx=28;vy=top+15.5+.01/s;vz=side*W*.2;support='Accommodation block';}
 if(v.kind==='cruise'){vx=15;vy=top+levels*levelH+.085/s;vz=side*W*.3;}
 weatherVent(`${a} weather-deck ventilator`,vx,vy,vz,detailSize,support);
 // A physical searchlight complements the interior control already in the catalogue.
 const searchStart=out.length,lx=v.kind==='heavy'?30:v.kind==='crane'?36:v.kind==='naval'?19:bridgeX,ly=v.kind==='heavy'?top+19.8:v.kind==='crane'?top+16.1:v.kind==='naval'?top+8.2:houseTop+1.2/s,lz=v.kind==='heavy'?W*(.42+side*.025):side*W*(v.kind==='crane'?.25:v.kind==='tug'?.23:.38);
 const lamp=cyl(`${a} searchlight pedestal`,'navigation','Searchlights',[lx,ly,lz],[.22/s,.5/s,.22/s],'#92a6ac',{purpose:'Carries the manually or remotely directed searchlight above nearby deck obstructions.'});
 cyl(`${a} searchlight housing`,'navigation','Searchlights',[lx+.15/s,ly+.4/s,lz],[.62/s,.65/s,.62/s],'#d3dfdc',{rotation:[0,0,Math.PI/2],parentId:lamp,purpose:'Encloses the lamp, reflector and focusing optics used for close-range illumination.'});
 cyl(`${a} searchlight lens`,'navigation','Searchlights',[lx+.49/s,ly+.4/s,lz],[.53/s,.06/s,.53/s],'#c3e9ed',{rotation:[0,0,Math.PI/2],parentId:lamp,purpose:'Protects the reflector and lamp while transmitting the searchlight beam.'});
 supportedDetails.push({ids:out.slice(searchStart).map(c=>c.id),support:v.kind==='naval'?'Bridge deck':v.kind==='heavy'?'Offset deckhouse':v.kind==='crane'?'Accommodation block':'Superstructure weather deck',clearance:4});
 }
 // Better mechanical forms for the existing winch catalogue, without adding pseudo-parts.
 for(const c of out){
 if(c.assembly.endsWith('aft mooring winch')){
 if(['Drive motor','Reduction gear','Drum brake','Warping head','Fairlead roller'].includes(c.name)){c.shape='cylinder';c.rotation=[Math.PI/2,0,0];}
 if(c.name==='Drum brake'){c.size=[.88*s,.15*s,.88*s];c.color='#526973';}
 if(c.name==='Warping head'){c.size=[.75*s,.8*s,.75*s];c.color='#bac9c5';}
 }
 }
 if(v.kind==='livestock'){
 // Dated 2022 photos show ventilation openings, not passenger-cabin glazing.
 for(const c of out)if(c.assembly==='Glazing'&&c.name.startsWith('Deck ')){
 c.name=c.name.replace('window','ventilation opening');c.color='#344c52';c.purpose='A reconstructed livestock-deck ventilation opening; this is not passenger-cabin glazing.';
 }
 const roofY=top+levels*levelH+.075/s;
 for(let bank=0;bank<6;bank++)for(const side of [-1,1])weatherVent(`Livestock ventilation bank ${bank+1} ${side<0?'port':'starboard'}`,-31+bank*9,roofY,side*W*.29,1.4,'Superstructure weather deck','Livestock ventilation');
 const craneStart=out.length,cx=4,cy=roofY,cz=0,ca='Livestock stores crane';
 const craneRoot=cyl(`${ca} pedestal`,'cargo',ca,[cx,cy+1.8,cz],[1.5,3.6,1.5],'#d9e2de',{purpose:'Supports the roof-level stores crane visible in the dated2022 photograph; dimensions and operating position are reconstructed.'});
 cyl(`${ca} slew bearing`,'cargo',ca,[cx,cy+3.7,cz],[1.8,.45,1.8],'#91a6ad',{parentId:craneRoot});
 beam(`${ca} articulated boom`,'cargo',ca,[cx,cy+4,cz],[cx-6,cy+10,cz],.7,'#e0e7e2');
 beam(`${ca} hydraulic ram`,'cargo',ca,[cx,cy+3,cz],[cx-3,cy+7,cz],.28,'#9cafb5');
 beam(`${ca} hoist wire`,'cargo',ca,[cx-6,cy+10,cz],[cx-6,cy+5,cz],.08,'#667e8c');
 cyl(`${ca} hook block`,'cargo',ca,[cx-6,cy+4.7,cz],[.6,.7,.6],'#ccbc8b');
 supportedDetails.push({ids:out.slice(craneStart).map(c=>c.id),support:'Superstructure weather deck',clearance:4});
 const forward=box('Forward accommodation crown','accommodation','Livestock bridge',[26,roofY+1.2,0],[19,2.4,W*.78],'#dce2df',{purpose:'Raised forward accommodation and bridge support, following the visible stepped profile in the dated reference photograph.'});
 supportedDetails.push({ids:[forward],support:'Superstructure weather deck',clearance:3});
 // Raise the existing bridge and attached navigation fittings together over the crown.
 for(const c of out)if(c.systemId==='navigation'){c.position[1]+=(2.15+1.295/s)*s;if(!c.parentId)c.parentId=forward;}
 supportedDetails.push({ids:out.filter(c=>c.systemId==='navigation').map(c=>c.id),support:'Forward accommodation crown',clearance:2});
 for(let deck=0;deck<6;deck++){
 const start=out.length,a=`Livestock deck ${deck+1} husbandry`,x=-18,y=top+deck*levelH+1,z=W*.25;
 const riser=cyl(`Drinking-water riser deck ${deck+1}`,'utilities',a,[x,y,z],[.22,levelH*.8,.22],'#82aab4',{interior:true,purpose:'Supplies drinking-water branches serving the illustrative livestock deck.'});
 cyl(`Water pressure regulator deck ${deck+1}`,'utilities',a,[x+.5,y,z],[.5,.5,.5],'#9ab9bc',{interior:true,parentId:riser,purpose:'Reduces and stabilises pressure supplied to drinking-water outlets.'});
 box(`Feed distribution auger deck ${deck+1}`,'cargo',a,[0,y,-z],[45,.4,.4],'#bcb594',{interior:true,purpose:'Enclosed mechanical distribution route for feed; exact routing and feed quantities are not verified.'});
 box(`Manure collection gutter deck ${deck+1}`,'utilities',a,[0,y-levelH*.25,z],[48,.16,.6],'#72868a',{interior:true,purpose:'Collects wash-down and waste along a livestock-deck service route.'});
 supportedDetails.push({ids:out.slice(start).map(c=>c.id),support:`Deck ${deck+1} floor`,clearance:0});
 }
 }
 if(v.kind==='lng'){
 // Pitched tank-cover sides and elevated pipe racks follow ABB's 2020 deck photograph.
 for(let tank=0;tank<4;tank++){
 const x=-20+tank*65/4,a=`Cargo tank ${tank+1}`,cover=out.find(c=>c.name===`Insulated tank dome ${tank+1}`);
 if(cover){cover.position[1]=(top+2.4)*s;cover.size=[12*s,.22*s,W*.45*s];cover.purpose='The upper insulated cover over a membrane tank, with separate reconstructed sloping side skins.';}
 for(const side of [-1,1]){
 const run=W*.165,rise=2.2;
 box(`Tank ${tank+1} sloping insulation skin ${side}`,'cargo',a,[x,top+1.3,side*W*.3075],[12,.15,Math.hypot(run,rise)],'#bdc9c5',{rotation:[side*Math.atan2(rise,run),0,0],decorative:true,parentId:cover?.id});
 }
 const start=out.length,vent=cyl(`Tank ${tank+1} relief vent mast`,'cargo',a,[x,top+5.6,0],[.4,6.1,.4],'#bacbd1',{purpose:'Carries controlled vapour relief to an elevated discharge location; exact arrangement is reconstructed.'});
 cyl(`Tank ${tank+1} vent outlet head`,'cargo',a,[x,top+8.75,0],[1.05,.32,1.05],'#d6dfdf',{parentId:vent});
 box(`Tank ${tank+1} vapour pressure transmitter`,'cargo',a,[x+.75,top+3.1,0],[.4,.6,.4],'#83a4b0',{parentId:vent,purpose:'Measures pressure in the cargo vapour space for monitoring and control.'});
 box(`Tank ${tank+1} gas detector head`,'safety',a,[x-.75,top+3.1,0],[.35,.45,.35],'#d5bd82',{parentId:vent,purpose:'Monitors the vicinity of the tank connection for gas leakage.'});
 supportedDetails.push({ids:out.slice(start).map(c=>c.id),support:cover?.name??'Main strength deck',clearance:5});
 }
 for(const side of [-1,1]){
 const a=`${side<0?'Port':'Starboard'} LNG manifold`,x=5,z=side*W*.37;
 const frame=box(`${a} support`,'cargo',a,[x,top+3,z],[8,.3,2.2],'#8babb6');
 for(let branch=0;branch<4;branch++){
 const bx=x-3+branch*2;
 cyl(`${a} liquid connection ${branch+1}`,'cargo',a,[bx,top+3.55,z],[.52,2.6,.52],'#b9cdcd',{rotation:[Math.PI/2,0,0],parentId:frame,purpose:'An illustrative cryogenic transfer connection between ship piping and a terminal loading arm.'});
 cyl(`${a} ESD valve ${branch+1}`,'cargo',a,[bx,top+3.55,z-side*.8],[.82,.6,.82],'#618a96',{rotation:[Math.PI/2,0,0],parentId:frame,purpose:'Shuts the transfer branch during emergency shutdown; dimensions and terminal configuration are illustrative.'});
 box(`${a} actuator ${branch+1}`,'cargo',a,[bx,top+4.1,z-side*.8],[.6,.65,.6],'#8da66f',{parentId:frame,purpose:'Operates the emergency shutdown valve under the cargo control system.'});
 }
 }
 for(const c of out)if(c.assembly==='Deck piping'){c.position[1]=(top+3)*s;c.size[0]=.28*s;c.size[2]=.28*s;}
 for(let support=0;support<12;support++)for(const side of [-1,1])beam(`Deck pipe rack upright ${support+1} ${side}`,'cargo','Deck piping',[-22+support*6,top,side*1.25],[-22+support*6,top+2.9,side*1.25],.13,'#7996a0',true);
 }
 if(v.kind==='container'){
 // Lashing-bridge platforms are functional assemblies; repeated bars remain decorative.
 for(let bay=0;bay<7;bay++){
 const x=-43+([5,7,9,11,13,15,16][bay]+.5)*4.5,a=`Lashing access bridge ${bay+1}`,span=Math.min(W*.85,W*hullHalfWidth((x+50)/100,v.kind)*1.8);
 const platform=box(a,'cargo','Lashing access',[x,top+3.4,0],[.5,.22,span],'#b5c4ad',{purpose:'Provides elevated access to container securing equipment between cargo bays; the bridge spacing is reconstructed.'});
 for(const side of [-1,1]){
 box(`${a} access ladder ${side}`,'cargo','Lashing access',[x,top+1.75,side*span*.48],[.45,3.5,.15],'#a2b7ad',{parentId:platform,purpose:'Provides crew access to the lashing-bridge working platform.'});
 box(`${a} securing locker ${side}`,'cargo','Lashing access',[x,top+.55,side*span*.45],[.5,.9,.65],'#6f8f83',{parentId:platform,purpose:'Stores loose securing equipment near the work area.'});
 beam(`${a} outer support ${side}`,'cargo','Lashing access',[x,top,side*span*.47],[x,top+3.4,side*span*.47],.18,'#91aca4',true);
 }
 }
 }
 if(v.kind==='cruise'){
 const py=top+levels*levelH+.9;
 for(let pool=0;pool<3;pool++){
 const a=`Pool ${pool+1} treatment`,x=-24+pool*15,z=W*.15,start=out.length;
 const skid=box(`${a} service skid`,'utilities',a,[x,py,z],[2,.18,1.4],'#8dacae',{purpose:'Supports a compact illustrative water-treatment assembly beside the pool service route.'});
 cyl(`${a} filter vessel`,'utilities',a,[x,py+.65,z],[.9,1.1,.9],'#ccd8d3',{parentId:skid});
 cyl(`${a} circulation motor`,'utilities',a,[x+.7,py+.35,z],[.5,.7,.5],'#5594a7',{parentId:skid,rotation:[0,0,Math.PI/2]});
 box(`${a} dosing cabinet`,'utilities',a,[x-.7,py+.6,z],[.55,1,.65],'#d6e0dc',{parentId:skid,purpose:'Houses monitored water-treatment dosing equipment; exact installation is reconstructed.'});
 box(`${a} water-quality sensor`,'utilities',a,[x,py+.35,z+.6],[.35,.4,.3],'#a5bb78',{parentId:skid,purpose:'Samples the pool treatment circuit for water-quality monitoring.'});
 for(const c of out.slice(start)){c.interior=true;c.position=[x*s+(c.position[0]-x*s)*.45,(top+(levels-1)*levelH)*s+.15+(c.position[1]-py*s)*.45,z*s+(c.position[2]-z*s)*.45];c.size=c.size.map(n=>n*.45) as Vec3;}
 supportedDetails.push({ids:out.slice(start).map(c=>c.id),support:`Deck ${levels} floor`,clearance:0});
 }
 const court=box('Sports court surface','cargo','Public decks',[-16,py-.55,W*.34],[9,.12,W*.16],'#557faa',{purpose:'A reconstructed multi-use sports court, identified in the operator’s activity catalogue.'});
 for(const side of [-1,1]){
 box(`Sports court basketball support ${side}`,'cargo','Public decks',[-16+side*4.3,py+.35,W*.34],[.15,1.8,.15],'#b5c4cc',{parentId:court});
 box(`Sports court backboard ${side}`,'cargo','Public decks',[-16+side*4.2,py+1.3,W*.34],[.12,.8,1.2],'#d9e5e4',{parentId:court});
 }
 box('FlowRider ride bed','cargo','Public decks',[-34,py-.25,-W*.31],[6,.5,3],'#539fc1',{purpose:'Illustrative inclined bed of the operator-listed surf simulator; this does not reproduce the manufacturer’s working geometry.'});
 box('FlowRider recirculation intake','utilities','Public decks',[-37,py-.15,-W*.31],[.5,.4,3],'#527581',{purpose:'Collects recirculating water at the edge of the illustrative surf simulator.'});
 }
 if(v.kind==='naval'){
 for(const side of [-1,1]){
 const a=`${side<0?'Port':'Starboard'} close-in defence mount`,x=-15,z=side*W*.39,start=out.length;
 box(`${a} service platform`,'cargo',a,[x,top+3.45,z],[2.8,.15,2.3],'#8095a0',{purpose:'Supports local access around the illustrative close-in mount, spanning from the weather structure.'});
 const mount=cyl(`${a} pedestal`,'cargo',a,[x,top+4.1,z],[1.4,1.4,1.4],'#a2b3bd',{purpose:'A schematic exterior close-in defence mount. The Royal Navy documents Phalanx on the Type45 class; this model provides no weapon operating details.'});
 box(`${a} equipment enclosure`,'cargo',a,[x,top+5,z],[1.5,1.3,1.5],'#adbcc3',{parentId:mount});
 cyl(`${a} sensor radome`,'navigation',a,[x,top+6.3,z],[1.2,1.3,1.2],'#e0e7e6',{parentId:mount,purpose:'Protects the mount’s local tracking sensor; external shape is illustrative.'});
 cyl(`${a} barrel shroud`,'cargo',a,[x+.95,top+5.4,z],[.35,1.4,.35],'#526d7b',{rotation:[0,0,Math.PI/2],parentId:mount,purpose:'Simplified exterior barrel shroud, without internal mechanisms or operational specifications.'});
 supportedDetails.push({ids:out.slice(start).map(c=>c.id),support:'Enclosed amidships weather structure',clearance:6});
 const boatStart=out.length;
 const boat=add(`${side<0?'Port':'Starboard'} rigid inflatable boat`,'safety','Boat handling',[-6,top+2,side*W*.43],[5.5,1.25,1.9],'#455b63',{shape:'hull',purpose:'Illustrative ship’s boat for boarding, transfer and rescue tasks; exact stowage fit is not verified.'});
 box(`RHIB console ${side}`,'safety','Boat handling',[-5.5,top+2.8,side*W*.43],[1.1,.9,.8],'#b2c1c6',{parentId:boat});
 beam(`Boat davit arm ${side}`,'safety','Boat handling',[-8,top+3,side*W*.31],[-5,top+4.2,side*W*.43],.2,'#9fafb9');
 supportedDetails.push({ids:out.slice(boatStart).map(c=>c.id),support:'Enclosed amidships weather structure',clearance:3,outward:side*W*.4});
 }
 }
 if(v.kind==='tug'){
 const a='Shore charging connection',x=-11,z=-W*.34;
 const cabinet=box('Shore charging cabinet','electrical',a,[x,top+2,z],[3.2,4,2.2],'#2c9c4c',{purpose:'A reconstructed shore-connection cabinet supporting Sparky’s documented battery charging operation.'});
 box('Charging cable coupler','electrical',a,[x+.6,top+2,z-1.2],[1.3,1.4,.7],'#405a64',{parentId:cabinet,purpose:'Connects the shore charging cable to the vessel-side power connection.'});
 box('Charging interlock enclosure','electrical',a,[x-1,top+2,z-1.2],[.6,.7,.5],'#9dbba9',{parentId:cabinet,purpose:'Houses connection interlocks that prevent energisation before the charging connection is secure.'});
 cyl('Towing winch hydraulic motor','cargo','Working deck',[35,top+2.7,W*.28],[2.2,2,2.2],'#688e9b',{rotation:[Math.PI/2,0,0]});
 box('Towing winch brake actuator','cargo','Working deck',[33,top+3.3,-W*.23],[1.5,1.4,1.4],'#7f9c91',{purpose:'Applies or releases the towing-drum brake; shape and placement are reconstructed.'});
 }

 // Visible working equipment: physical assemblies are counted, their screws, stripes,
 // louvers and guards are not. Dimensions below use metres even on the smallest craft.
 const m=1/s;
 function attachNew(start:number,support:string,clearance=0,outward=0){supportedDetails.push({ids:out.slice(start).map(c=>c.id),support,clearance,outward});}
 function cabinet(label:string,sys:SystemId,a:string,x:number,y:number,z:number,width=1.2,height=1.5){
  const root=box(label,sys,a,[x,y+height*m*.5,z],[width*m,height*m,.48*m],'#a3b3b9',{shape:'chamferedBox',purpose:'Protects local controls and connections from weather; precise installation and cabinet internals are reconstructed.'});
  box(`${label} door seam`,sys,a,[x,y+height*m*.5,z+.247*m],[width*m*.86,height*m*.85,.018*m],'#6d8791',{decorative:true,parentId:root});
  cyl(`${label} door latch`,sys,a,[x+width*m*.28,y+height*m*.45,z+.27*m],[.07*m,.22*m,.07*m],'#d0d8d6',{decorative:true,parentId:root});
  return root;
 }
 // Replace the old oversized anchor cubes with a recognisable mechanical layout.
 for(const side of [-1,1]){
  const a=`${side<0?'Port':'Starboard'} anchor windlass`,z=side*W*.2,k=(large?1.2:1)*m;
  const anchorParts=out.filter(c=>c.assembly===a),root=anchorParts.find(c=>c.name===a);
  if(root){root.shape='chamferedBox';root.position=[40*s,(top+.4*k)*s,z*s];root.size=[3.2*k*s,.8*k*s,2*k*s];root.color='#6f8b94';}
  const layouts:Record<string,[Vec3,Vec3,Component['shape'],Vec3]>={
   'drive motor':[[40-.9*k,top+1.1*k,z-.5*k],[.65*k,1.1*k,.65*k],'cylinder',[Math.PI/2,0,0]],
   'gearbox':[[40+.35*k,top+1.1*k,z],[.9*k,.95*k,1.2*k],'chamferedBox',[0,0,0]],
   'chain wheel':[[40,top+1.3*k,z+side*.95*k],[1.35*k,.42*k,1.35*k],'cylinder',[Math.PI/2,0,0]],
   'brake':[[40,top+1.3*k,z+side*.68*k],[1.5*k,.14*k,1.5*k],'torus',[Math.PI/2,0,0]],
   'clutch':[[40,top+1.3*k,z],[.8*k,.4*k,.8*k],'cylinder',[Math.PI/2,0,0]],
   'chain stopper':[[40+2*k,top+.35*k,z+side*.95*k],[.6*k,.65*k,.6*k],'chamferedBox',[0,0,0]],
   'hawse pipe':[[43,top-.2*k,side*W*hullHalfWidth(.93,v.kind)*.97],[.7*k,.22*k,.7*k],'torus',[Math.PI/2,0,0]],
   'anchor shank':[[43.3,top-.9*k,side*W*hullHalfWidth(.933,v.kind)*.99],[.2*k,1.6*k,.25*k],'box',[0,0,-.32]],
   'anchor fluke':[[43.65,top-1.55*k,side*W*hullHalfWidth(.9365,v.kind)],[1.35*k,.28*k,.8*k],'chamferedBox',[0,0,-.2]],
  };
  for(const c of anchorParts){const spec=layouts[c.name];if(!spec)continue;c.position=spec[0].map(n=>n*s) as Vec3;c.size=spec[1].map(n=>n*s) as Vec3;c.shape=spec[2];c.rotation=spec[3];c.color=c.name.includes('anchor')?'#65757a':'#93aab2';if(root)c.parentId=root.id;}
  const start=out.length;
  cabinet(`${side<0?'Port':'Starboard'} windlass local control`,'mooring',a,40-2.2*k,top+.11,z-1.3*k,.5,.85);
  add(`${side<0?'Port':'Starboard'} windlass brake handwheel`,'mooring',a,[40+.85*k,top+1.5*k,z+side*.65*k],[.45*k,.08*k,.45*k],'#526976',{shape:'torus',rotation:[Math.PI/2,0,0],purpose:'Allows local application of the anchor-windlass brake; exact mechanical design is reconstructed.'});
  for(let link=0;link<9;link++)add(`Anchor chain link ${side} ${link}`,'mooring',a,[40+.6*k+link*.2*k,top+.52*k,z+side*.95*k],[.32*k,.1*k,.22*k],'#576a74',{shape:'torus',rotation:[link%2?Math.PI/2:0,0,0],decorative:true});
  attachNew(start,root?.name??'Main strength deck');
 }
 const workingStations:Record<string,[string,number,number,string]>={
  container:['Lashing service',36,.43,'Powers local hatch and cargo-securing service equipment.'],
  bulk:['Hatch-cover hydraulic',30,.43,'Supplies hydraulic power to the weather-hatch operating machinery.'],
  general:['Project cargo securing',-24,.4,'Supports local hydraulic cargo-securing and handling tools.'],
  heavy:['Seafastening service',10,.4,'Supports local heavy-cargo securing and handling services.'],
  tanker:['Cargo deck fire-main',29,.445,'Supplies a local fire-main branch on the exposed cargo deck.'],
  chemical:['Cargo deck washdown',29,.445,'Supports controlled washdown services on the exposed cargo deck.'],
  lng:['Manifold water-curtain',29,.445,'Provides a reconstructed protective water-supply branch at the cargo transfer area.'],
  ahts:['Anchor-handling hydraulic',-31,.32,'Supplies the aft-deck anchor-handling machinery.'],
  tug:['Tow-winch hydraulic',-36,.29,'Supports local towing winch and deck-machinery services.'],
  rescue:['Salvage deck hydraulic',-31,.32,'Supplies hydraulic salvage and towing equipment on the working deck.'],
  fishing:['Trawl handling hydraulic',-31,.31,'Supports net and trawl handling machinery on the fishing deck.'],
  utility:['Buoy handling hydraulic',-31,.3,'Supplies the buoy handling crane and local working-deck tools.'],
  research:['Scientific winch hydraulic',-33,.28,'Supplies the scientific deployment winches on the working deck.'],
  icebreaker:['Polar cargo hydraulic',32,.28,'Supports the forward cargo-handling equipment.'],
  cable:['Cable handling hydraulic',-30,.36,'Supplies local cable handling and deployment machinery.'],
  wind:['Installation hydraulic',-26,.32,'Supplies local installation and deck-handling equipment.'],
  dredger:['Dredging service hydraulic',22,.29,'Supports the dredging mission equipment and local actuators.'],
  fpso:['Process deck service',23,.43,'Supports local process-deck utility equipment.'],
  inland:['Container hatch service',24,.43,'Supplies local cargo-access and hatch services.'],
  autonomous:['Remote deck service',23,.43,'Supports deck service functions with local and remote isolation.'],
  crane:['Heavy crane service',20,.32,'Supports the crane deck with local hydraulic services.'],
  yacht:['Tender handling hydraulic',-36,.32,'Supports tender handling and boarding equipment.'],
 };
 const ws=workingStations[v.kind];
 if(ws)for(const side of [-1,1]){
  const [label,x,zRatio,why]=ws,a=`${side<0?'Port':'Starboard'} ${label} station`,z=side*W*zRatio,y=top+.13,start=out.length;
  const fluid=['tanker','chemical','lng','fpso'].includes(v.kind),color=fluid?'#b65c4f':'#708f9a';
  const base=box(`${a} skid`,'cargo',a,[x,y+.12*m,z],[2.9*m,.24*m,1.6*m],'#637f89',{purpose:`Transfers the equipment weight and working loads into the deck. ${why}`});
  const reservoir=box(`${a} ${fluid?'header casing':'reservoir'}`,'cargo',a,[x-.65*m,y+.7*m,z],[1.25*m,1.15*m,1.25*m],color,{shape:'chamferedBox',parentId:base,purpose:fluid?'Contains the local service-water distribution header.':'Stores the working hydraulic fluid for this local service assembly.'});
  cyl(`${a} ${fluid?'strainer body':'return filter'}`,'cargo',a,[x-.7*m,y+1.6*m,z],[.3*m,.65*m,.3*m],'#c4d1d0',{parentId:reservoir});
  cyl(`${a} pump casing`,'cargo',a,[x+.65*m,y+.65*m,z],[.65*m,.55*m,.65*m],color,{rotation:[Math.PI/2,0,0],parentId:base});
  const motor=cyl(`${a} drive motor`,'electrical',a,[x+.65*m,y+.65*m,z+.65*m],[.58*m,.8*m,.58*m],'#8fabb7',{rotation:[Math.PI/2,0,0],parentId:base});
  for(let fin=0;fin<6;fin++)add(`Motor cooling fin ${a} ${fin}`,'electrical',a,[x+.65*m,y+.65*m,z+(.35+fin*.12)*m],[.65*m,.04*m,.65*m],'#6d909f',{shape:'torus',rotation:[Math.PI/2,0,0],parentId:motor,decorative:true});
  cyl(`${a} ${fluid?'isolation valve':'pressure accumulator'}`,'cargo',a,[x-.1*m,y+1.6*m,z-.5*m],[.36*m,1.05*m,.36*m],fluid?'#a9564b':'#617c87',{parentId:base});
  box(`${a} valve block`,'cargo',a,[x+.55*m,y+1.3*m,z-.5*m],[.85*m,.42*m,.44*m],'#a5b6bb',{parentId:base,purpose:'Distributes and isolates the local fluid branches; circuits are reconstructed.'});
  add(`${a} pressure indicator`,'cargo',a,[x+.55*m,y+1.75*m,z-.5*m],[.2*m,.08*m,.2*m],'#e1e6df',{shape:'cylinder',rotation:[Math.PI/2,0,0],parentId:base,purpose:'Provides a local pressure indication for maintenance and operation.'});
  cabinet(`${a} control cabinet`,'electrical',a,x+2*m,y,z,.75,1.3);
  box(`${a} emergency stop`,'safety',a,[x+2*m,y+1*m,z+.3*m],[.16*m,.16*m,.1*m],'#bd5f4f',{parentId:base,purpose:'Provides local emergency stopping of the illustrated service machinery.'});
  beam(`${a} supply hose`,'cargo',a,[x+.8*m,y+.65*m,z-.45*m],[x+1.2*m,y+.25*m,z-1*m],.09*m,'#334f5e');
  beam(`${a} return hose`,'cargo',a,[x-.6*m,y+.35*m,z-.55*m],[x+1.2*m,y+.18*m,z-1.2*m],.09*m,'#405a64');
  attachNew(start,'Main strength deck',18);
 }
 if(['cruise','ferry','roro','catamaran','livestock'].includes(v.kind))for(const side of [-1,1]){
  const support=out.find(c=>c.name==='Deck 1 enclosure');if(!support)continue;
  const x=(support.position[0]+support.size[0]*.32)/s,y=top+.25,z=side*(support.size[2]/s*.5+.14*m),a=`${side<0?'Port':'Starboard'} shore service station`,start=out.length;
  cabinet(`${a} power inlet`,'electrical',a,x,y,z,1.1,1.5);
  box(`${a} connection interlock`,'electrical',a,[x,y+1.1*m,z+side*.32*m],[.25*m,.25*m,.1*m],'#718f9f',{purpose:'Monitors safe connection state before the illustrated shore-service inlet can be energised.'});
  for(const [i,label] of ['Potable-water connection','Service-water connection','Wastewater connection'].entries()){
   const px=x-(i+2)*1.05*m,sys=i===2?'utilities':'utilities';
   const inlet=cyl(`${a} ${label}` as string,sys,a,[px,y+.65*m,z],[.32*m,.35*m,.32*m],['#73b2bc','#7698a3','#8f9778'][i],{rotation:[Math.PI/2,0,0],purpose:'Provides a segregated shore-service hose connection; exact fittings and locations are reconstructed.'});
   add(`${a} ${label} cap`,'utilities',a,[px,y+.65*m,z+side*.22*m],[.38*m,.07*m,.38*m],'#c3d1cd',{shape:'cylinder',rotation:[Math.PI/2,0,0],parentId:inlet,purpose:'Closes and protects the disconnected service inlet.'});
   box(`${a} ${label} valve housing`,'utilities',a,[px,y+.65*m,z-side*.15*m],[.5*m,.55*m,.3*m],'#8ba5ae',{parentId:inlet,purpose:'Protects the local isolating valve for the shore-service branch.'});
  }
  attachNew(start,support.name);
 }
 // Weather doors, ventilation louvers and escape lighting give each occupied deck a
 // readable scale. They sit on enclosure faces and inherit that exact deck's movement.
 for(const enclosure of out.filter(c=>/^Deck \d+ enclosure$/.test(c.name))){
  const index=Number(enclosure.name.split(' ')[1]),[cx,cy]=enclosure.position.map(n=>n/s),[length,height,width]=enclosure.size.map(n=>n/s);
  for(const side of [-1,1]){
   const start=out.length,a=`Deck ${index} weather access`,z=side*(width*.5+.04*m),x=cx-length*.34,base=cy-height*.5;
   const dh=Math.min(1.9*m,height*.86),door=box(`${side<0?'Port':'Starboard'} deck ${index} weathertight door`,'accommodation',a,[x,base+dh*.51,z],[.85*m,dh,.09*m],v.kind==='tug'?'#227539':'#afbdc3',{purpose:'Closes an external accommodation access opening against weather; exact door positions are reconstructed.'});
   box(`Door glazing ${index} ${side}`,'accommodation',a,[x,base+dh*.73,z+side*.05*m],[.39*m,dh*.25,.025*m],'#244658',{decorative:true,parentId:door});
   box(`Door frame ${index} ${side}`,'accommodation',a,[x,base+dh*.51,z-side*.055*m],[.99*m,dh+.1*m,.06*m],'#7e959e',{decorative:true,parentId:door});
   cyl(`Door operating handle ${index} ${side}`,'accommodation',a,[x+.27*m,base+dh*.46,z+side*.08*m],[.06*m,.2*m,.06*m],'#d4ddd9',{decorative:true,parentId:door});
   const vent=box(`${side<0?'Port':'Starboard'} deck ${index} ventilation louver`,'utilities',a,[cx+length*.25,cy,z],[1.6*m,height*.44,.15*m],'#587681',{purpose:'Admits or exhausts ventilation air through a weather-resistant louver; duct routes are reconstructed.'});
   for(let fin=0;fin<6;fin++)box(`Ventilation louver slat ${index} ${side} ${fin}`,'utilities',a,[cx+length*.25,cy+(fin-2.5)*height*.06,z+side*.09*m],[1.5*m,.045*m,.045*m],'#aec0c6',{decorative:true,parentId:vent});
   add(`${side<0?'Port':'Starboard'} deck ${index} escape light`,'electrical',a,[x+1.1*m,base+dh*.92,z+side*.08*m],[.27*m,.19*m,.13*m],'#c5ddcd',{purpose:'Illuminates the route to an external escape door on the emergency supply.'});
   attachNew(start,enclosure.name);
  }
 }
 if(v.kind==='naval'){
  const grey='#a6b6c0',dark='#4e697b';
  // The prior mast stopped 1.75m above its supporting house. Its extended lower
  // trunk now penetrates the support slightly, while a shoulder fairing joins them.
  let start=out.length;
  box('Forward mast shoulder fairing','navigation','Mast access',[9,top+6.65,0],[6.8,.85,6.2],grey,{shape:'chamferedBox',purpose:'Joins the integrated mast trunk to its supporting deckhouse, with no unsupported gap.'});
  attachNew(start,'Forward superstructure');
  start=out.length;
  for(const side of [-1,1]){
   for(let station=0;station<4;station++){
    const y=top+12+station*3.2,z=side*2.6*(1-((y-top-6.3)/19.5)*.62);
    const panel=box(`${side<0?'Port':'Starboard'} mast service panel ${station+1}`,'navigation','Integrated mast fittings',[9,y,z+side*.025],[.75,1.1,.08],'#879da9',{purpose:'External access cover for reconstructed mast services; no sensor internals are modelled.'});
    box(`Mast service panel inset ${side} ${station}`,'navigation','Integrated mast fittings',[9,y,z+side*.073],[.6,.9,.025],'#718a99',{decorative:true,parentId:panel});
    box(`${side<0?'Port':'Starboard'} mast antenna enclosure ${station+1}`,'navigation','Integrated mast fittings',[9.8,y+.35,z+side*.12],[.38,.75,.3],'#d4dfe0',{purpose:'A simplified exterior antenna enclosure based on visible mast equipment; operational details and exact fit are omitted.'});
   }
   for(let yard=0;yard<2;yard++){
    const y=top+12+yard*2.8,span=yard?5.2:7;
    beam(`Signal yard ${side} ${yard}`,'navigation','Integrated mast fittings',[9,y,side*2],[9,y,side*span],.21,grey);
    beam(`Signal yard stay ${side} ${yard}`,'navigation','Integrated mast fittings',[9,y+1.7,side*1.7],[9,y,side*span],.08,grey,true);
    cyl(`Signal yard lamp ${side} ${yard}`,'navigation','Integrated mast fittings',[9,y+.3,side*span],[.28,.6,.28],'#d8e2db',{purpose:'Carries an external signal/navigation light on the mast yard.'});
   }
   box(`${side<0?'Port':'Starboard'} mast observation camera`,'navigation','Integrated mast fittings',[10.3,top+12.2,side*2.4],[.48,.42,.7],'#d5e0de',{purpose:'Illustrative external observation camera housing; exact sensor fit is not verified.'});
  }
  cyl('SAMPSON radome support neck','navigation','Integrated mast fittings',[9,top+25.95,0],[1.4,.6,1.4],dark,{purpose:'Supports the external radar radome above the mast head.'});
  add('SAMPSON radome equatorial seam','navigation','Integrated mast fittings',[9,top+27.5,0],[3.5,.05,3.5],dark,{shape:'torus',decorative:true});
  attachNew(start,'Integrated forward mast');
  start=out.length;
  box('Bridge roof visor','navigation','Bridge detailing',[19.1,top+8.05,0],[7.1,.19,W*.9],'#b9c8cd',{shape:'chamferedBox',purpose:'Shades the wheelhouse windows and sheds rain clear of the glazing.'});
  for(const side of [-1,1]){
   box(`Bridge wing solid bulwark ${side}`,'navigation','Bridge detailing',[18.7,top+6.55,side*W*.47],[8.5,.65,.18],grey,{purpose:'Protects the exposed bridge wing and provides a safe working edge.'});
   for(let pane=0;pane<6;pane++)box(`Bridge window mullion ${side} ${pane}`,'navigation','Bridge detailing',[16.9+pane*.66,top+7.2,side*W*.421],[.06,.98,.1],grey,{decorative:true});
   box(`Bridge wing repeater ${side}`,'navigation','Bridge detailing',[20,top+7.15,side*W*.43],[.65,.9,.45],dark,{purpose:'Repeats navigation information at the external conning position.'});
   cyl(`Bridge wing bearing compass ${side}`,'navigation','Bridge detailing',[17,top+7.05,side*W*.43],[.45,.85,.45],'#a9bfc6',{purpose:'Provides an external bearing reference for visual navigation.'});
  }
  attachNew(start,'Bridge deck');
  // Separate opening frame and recessed inner face make the boat bay readable.
  for(const side of [-1,1]){
   const screen=out.find(c=>c.name===`Concealed boat-bay screen ${side}`),opening=out.find(c=>c.name===`Boat-bay recessed opening ${side}`),cradle=out.find(c=>c.name===`Enclosed boat-bay rescue craft ${side}`);
   if(screen){screen.position[1]=(top+1.05)*s;screen.size[1]=.35*s;screen.name=`Boat-bay lower coaming ${side}`;}
   if(opening){opening.position[2]=side*W*.368*s;opening.position[1]=(top+2.4)*s;opening.size[1]=2.7*s;}
   if(cradle){cradle.name=`Boat-bay rescue craft cradle ${side}`;cradle.shape='box';cradle.position=[-6*s,(top+1.33)*s,side*W*.43*s];cradle.size=[5.5*s,.26*s,1.9*s];cradle.interior=false;cradle.purpose='Supports the rescue boat in its stowed bay; exact stowage geometry is reconstructed.';}
   start=out.length;
   for(const edge of [-1,1])box(`Boat-bay opening jamb ${side} ${edge}`,'safety','Boat bay framing',[-6+edge*6.3,top+2.4,side*W*.435],[.4,2.9,.24],grey,{decorative:true});
   box(`Boat-bay overhead coaming ${side}`,'safety','Boat bay framing',[-6,top+3.83,side*W*.435],[13,.3,.4],grey,{purpose:'Carries the overhead edge of the recessed boat handling bay.'});
   cabinet(`Boat recovery control ${side}`,'safety','Boat bay framing',-.5,top+1.25,side*W*.42,.7,1.2);
   attachNew(start,'Enclosed amidships weather structure');
   start=out.length;
   for(let raft=0;raft<4;raft++){
    const x=-20-raft*2.8,z=side*W*.437,a=`${side<0?'Port':'Starboard'} evacuation station ${raft+1}`;
    const root=cyl(`${a} liferaft canister`,'safety',a,[x,top+4.8,z],[1.15,1.8,1.15],'#dce4e2',{rotation:[0,0,Math.PI/2],purpose:'Protects an inflatable liferaft until launch; quantity and exact station positions are reconstructed.'});
    box(`${a} launch cradle`,'safety',a,[x,top+4.1,z],[2.1,.3,1.35],dark,{parentId:root,purpose:'Retains the canister at the evacuation station while permitting release.'});
    box(`${a} hydrostatic release`,'safety',a,[x+.8,top+4.55,z+side*.6],[.2,.3,.2],'#d9a26c',{parentId:root,purpose:'Allows a properly installed liferaft securing arrangement to release during sinking; this is a schematic installation.'});
    for(const band of [-1,1])add(`Canister securing band ${side} ${raft} ${band}`,'safety',a,[x+band*.55,top+4.8,z],[1.21,.06,1.21],dark,{shape:'torus',rotation:[0,0,Math.PI/2],decorative:true,parentId:root});
   }
   attachNew(start,'Helicopter hangar',0,side*W*.1);
   start=out.length;
   for(let section=0;section<4;section++){
    const x=-28+section*3.8,z=side*W*.388;
    const grille=box(`${side<0?'Port':'Starboard'} hangar ventilation grille ${section+1}`,'utilities','Hangar weather fittings',[x,top+5.5,z],[2.1,1.4,.12],dark,{purpose:'Ventilates the aviation support space through a protected exterior opening.'});
    for(let slat=0;slat<6;slat++)box(`Hangar grille slat ${side} ${section} ${slat}`,'utilities','Hangar weather fittings',[x,top+4.95+slat*.22,z+side*.08],[2,.055,.05],'#9aafb9',{decorative:true,parentId:grille});
   }
   cabinet(`Flight-deck firefighting cabinet ${side}`,'safety','Hangar weather fittings',-31.2,top+.15,side*W*.37,.85,1.6);
   box(`Hangar side access door ${side}`,'accommodation','Hangar weather fittings',[-25,top+1.5,side*W*.389],[.9,2.3,.1],'#829aa8',{purpose:'Provides a weather-tight access route into the aviation support space.'});
   attachNew(start,'Helicopter hangar');
  }
  start=out.length;
  const radar=out.find(c=>c.name==='S1850M long-range radar face');
  if(radar){
   for(let rib=0;rib<8;rib++)box(`Long-range radar back stiffener ${rib+1}`,'navigation','Aft radar detailing',[-22.45,top+14.2,(rib-3.5)*.78],[.17,2.4,.08],'#849aa6',{decorative:true});
   cyl('Long-range radar rotation pedestal','navigation','Aft radar detailing',[-22,top+13.35,0],[1.3,.7,1.3],dark,{purpose:'Supports the rotating exterior radar face; drive internals are omitted.'});
   cabinet('Aft radar service cabinet','navigation','Aft radar detailing',-23,top+7.5,1.1,.8,1.2);
  }
  attachNew(start,'Aft radar mast');
 }

 // Authored disassembly paths are tied to physical support layers, not just system colour.
 // Keep stable IDs/assemblies while parentId records which deck or casing carries a fitting.
 const deckGap=Math.max(2.6,levelH*1.9);
 const deckLift=(index:number)=>16+index*deckGap;
 const byName=new Map(out.map(c=>[c.name,c]));
 const layerFloors=new Map<number,Component>();
 for(const c of out){const match=/^Deck (\d+) floor$/.exec(c.name);if(match)layerFloors.set(Number(match[1])-1,c);}
 const setMotion=(c:Component,lift:number,local:Vec3=[0,0,0],parent?:Component)=>{
  c.explode=[0,lift*s,0];c.localExplode=local.map(n=>n*s) as Vec3;if(parent)c.parentId=parent.id;
 };
 for(const [index,floor] of layerFloors){
  setMotion(floor,deckLift(index),[0,index*.55,0]);
  const enclosure=byName.get(`Deck ${index+1} enclosure`);
  if(enclosure)setMotion(enclosure,deckLift(index),[0,index*.55+.45,W*.4],floor);
  for(const c of out){
   if(c===floor||c===enclosure)continue;
   const match=/^Deck (\d+) /.exec(c.name);
   if(!match||Number(match[1])-1!==index)continue;
   const skin=c.assembly==='Glazing';
   setMotion(c,deckLift(index),skin?[0,index*.55+.45,W*.4]:[0,index*.55,0],skin?enclosure??floor:floor);
  }
 }
 const roof=byName.get('Superstructure weather deck');
 if(roof){
  const roofLift=deckLift(levels);
  setMotion(roof,roofLift,[0,levels*.55+.3,0]);
  const wheelhouse=byName.get('Wheelhouse');
  const roofAssemblies=new Set(['Public decks','Waterpark','AquaDome','Cruise uptakes','Exhaust']);
  for(const c of out){
   const bridgeFitting=c.systemId==='navigation';
   if(!bridgeFitting&&!roofAssemblies.has(c.assembly))continue;
   const lift=roofLift+deckGap;
   const authoredParent=c.parentId?out.find(part=>part.id===c.parentId):undefined;
   setMotion(c,lift,[0,levels*.55+.8,0],authoredParent??(c.assembly==='Bridge instruments'&&wheelhouse?wheelhouse:roof));
  }
  // Survival craft remain beside their supporting deck; their davits follow identically.
  for(const c of out.filter(c=>c.assembly==='Survival craft')){
   const index=Math.max(0,Math.min(levels-1,Math.round((c.position[1]/s-top)/levelH)));
   const floor=layerFloors.get(index);
   if(floor)setMotion(c,deckLift(index),[0,index*.55,Math.sign(c.position[2])*.45/s],floor);
  }
 }
 if(v.kind==='naval'){
  const support=byName.get('Enclosed amidships weather structure');
  const forward=byName.get('Forward superstructure');
  const bridge=byName.get('Bridge deck');
  const mast=byName.get('Integrated forward mast');
  const hangar=byName.get('Helicopter hangar');
  const hangarRoof=byName.get('Hangar roof');
  const aftMast=byName.get('Aft radar mast');
  if(support)setMotion(support,16);
  if(forward)setMotion(forward,25,[0,1,0],support);
  if(bridge)setMotion(bridge,34,[0,2,0],forward);
  if(mast)setMotion(mast,43,[0,3,0],forward);
  if(hangar)setMotion(hangar,20,[0,1,0],support);
  if(hangarRoof)setMotion(hangarRoof,27,[0,2,0],hangar);
  if(aftMast)setMotion(aftMast,35,[0,3,0],hangarRoof);
  for(const c of out){
   if(c.assembly==='Bridge'||c.assembly==='Bridge instruments'||c.assembly==='Glazing'){
    if(c!==bridge)setMotion(c,34,[0,2,0],bridge);
   }else if(c.assembly==='Naval uptakes')setMotion(c,30,[0,2,0],support);
   else if(c.name==='SAMPSON radar radome'||c.name==='Main mast equipment collar'||c.name.startsWith('Main mast yardarm')||c.name.startsWith('Yardarm aerial')||c.name.startsWith('Mast navigation array'))setMotion(c,43,[0,3,0],mast);
   else if(c.name==='S1850M long-range radar face')setMotion(c,38,[0,4,0],aftMast);
   else if(c.name==='Hangar door'||c.name.startsWith('Hangar door segment'))setMotion(c,20,[-3,1,0],hangar);
   else if(c.assembly==='Survival craft')setMotion(c,16,[0,0,Math.sign(c.position[2])],support);
  }
 }
 // Detailed equipment follows its physical supporting deck, including cross-system children.
 for(const detail of supportedDetails){
  const support=out.find(c=>c.name===detail.support);if(!support)continue;
  for(const id of detail.ids){const c=out.find(part=>part.id===id);if(!c)continue;
   c.explode=[support.explode[0],support.explode[1]+detail.clearance*s,support.explode[2]+(detail.outward??0)*s];
   c.localExplode=[support.localExplode[0],support.localExplode[1]+(detail.clearance?(.5+(c.name.endsWith('weather hood')?1:0))*s:0),support.localExplode[2]+(detail.outward??0)*s*.25];
   if(!c.parentId)c.parentId=support.id;
  }
 }
 // These are explicitly reconstructed internals. Keep their boxes inside the shell so
 // X-ray/cutaway never reveals machinery accidentally protruding through the topsides.
 for(const c of out){
  if(!c.interior||c.position[1]>=top*s)continue;
  const x=c.position[0]/s;
  const ends=[x-c.size[0]/s*.5,x+c.size[0]/s*.5];
  const beamAt=Math.min(...ends.map(xx=>W*hullHalfWidth(Math.min(.96,Math.max(.04,xx/100+.5)),v.kind)))*.72*s;
  c.size[2]=Math.min(c.size[2],Math.max(.05,beamAt*1.8));
  c.position[2]=Math.sign(c.position[2])*Math.min(Math.abs(c.position[2]),Math.max(0,beamAt-c.size[2]*.5));
  const bottom=-D*.40*s,ceiling=top*s-.18*s;
  c.size[1]=Math.min(c.size[1],ceiling-bottom);
  c.position[1]=Math.max(bottom+c.size[1]*.5,Math.min(ceiling-c.size[1]*.5,c.position[1]));
 }
 return out;
}
