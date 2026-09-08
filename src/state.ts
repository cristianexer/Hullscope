import { create } from 'zustand';
import { fleet } from './data/fleet';
import { modes, views } from './data/schema';
import type { Mode, View, SystemId } from './data/schema';
export type Route = {vesselId:string;mode:Mode;view:View;selected:string|null;explode:number};
export function parseRoute(hash:string):Route {
 const [path,query='']=hash.replace(/^#\/?/,'').split('?');const id=path.replace(/^vessel\//,'');const p=new URLSearchParams(query);const e=Number(p.get('explode')??0);const requestedMode=p.get('mode');const mode=requestedMode==='Anatomy'||requestedMode==='Operations'?'Explore':requestedMode;
 return {vesselId:fleet.some(v=>v.id===id)?id:'ever-ace',mode:modes.includes(mode as Mode)?mode as Mode:'Explore',view:views.includes(p.get('view') as View)?p.get('view') as View:'Exterior',selected:p.get('part'),explode:Number.isFinite(e)?Math.min(100,Math.max(0,e)):0};
}
export function serializeRoute(r:Route){const p=new URLSearchParams();if(r.mode!=='Explore')p.set('mode',r.mode);if(r.view!=='Exterior')p.set('view',r.view);if(r.selected)p.set('part',r.selected);if(r.explode)p.set('explode',String(Math.round(r.explode)));return `#/vessel/${r.vesselId}${p.size?'?'+p:''}`;}
let saved:{labels?:boolean;water?:boolean;version?:number}={};try{saved=JSON.parse(localStorage.getItem('hullscope.preferences')??'{}');}catch{/* Storage may be unavailable. */}
export type SeaState = 'calm'|'waves'|'storm';
interface AppState extends Route {stormSound:boolean;seaState:SeaState;assemblyTarget:string|null;drive:boolean;toggleDrive:(enabled:boolean)=>void;system:SystemId|null;isolated:SystemId|null;hidden:SystemId[];labels:boolean;water:boolean;flow:boolean;scope:'vessel'|'system'|'assembly';preset:string;cameraTick:number;focusTick:number;autoRotate:boolean;tour:number|null;set:(patch:Partial<AppState>)=>void;navigate:(id:string)=>void;reset:()=>void;}
const initial=typeof location==='undefined'?parseRoute(''):parseRoute(location.hash);
export const useApp=create<AppState>((set)=>({...initial,stormSound:true,seaState:'calm',assemblyTarget:initial.selected,system:null,isolated:null,hidden:[],labels:saved.version===2?(saved.labels??false):false,water:saved.water??true,flow:false,scope:'vessel',preset:'Three-quarter',cameraTick:0,focusTick:0,autoRotate:false,tour:null,
drive:false,toggleDrive:(enabled)=>set({drive:enabled,selected:null,system:null,isolated:null,hidden:[],explode:0,scope:'vessel',view:'Exterior',flow:false,autoRotate:false,tour:null,water:true,cameraTick:Date.now()}),
set:(p)=>set({...p,...(p.selected?{assemblyTarget:p.selected}:{})}),navigate:(id)=>{set({drive:false,vesselId:id,assemblyTarget:null,selected:null,system:null,isolated:null,hidden:[],explode:0,view:'Exterior',tour:null,scope:'vessel',preset:'Three-quarter',cameraTick:Date.now()});if(typeof history!=='undefined')history.pushState(null,'',serializeRoute(useApp.getState()));},
reset:()=>set({drive:false,assemblyTarget:null,selected:null,system:null,isolated:null,hidden:[],explode:0,scope:'vessel',view:'Exterior',flow:false,autoRotate:false,tour:null,preset:'Three-quarter',cameraTick:Date.now()})}));
if(typeof window!=='undefined'){
 let timer:ReturnType<typeof setTimeout>;
 const onHashChange=()=>{clearTimeout(timer);useApp.setState({...parseRoute(location.hash),assemblyTarget:null,drive:false,system:null,isolated:null,hidden:[],scope:'vessel',cameraTick:Date.now()});};
 window.addEventListener('hashchange',onHashChange);
 const unsubscribe=useApp.subscribe((s,prev)=>{
  clearTimeout(timer);
  const hashAtSchedule=location.hash;
  timer=setTimeout(()=>{if(location.hash===hashAtSchedule)history.replaceState(null,'',serializeRoute(s));},100);
  if(s.labels!==prev.labels||s.water!==prev.water)try{localStorage.setItem('hullscope.preferences',JSON.stringify({version:2,labels:s.labels,water:s.water}));}catch{/* Private mode. */}
 });
 // Development edits must not leave an old store rewriting the active route.
 import.meta.hot?.dispose(()=>{clearTimeout(timer);unsubscribe();window.removeEventListener('hashchange',onHashChange);});
 // Canvas uses a separate React root; reload both roots together when the store changes.
 import.meta.hot?.accept(()=>location.reload());
}
