import type { AuthoredManifest } from '../data/schema';
import { useApp } from '../state';
import { ThemedSelect } from './Primitives';

export function InteriorNavigator({manifest}:{manifest:AuthoredManifest}) {
 const state=useApp();
 if(!manifest.rooms.length)return null;
 const room=manifest.rooms.find(r=>r.id===state.roomId);
 const rooms=manifest.rooms.filter(r=>!state.deckId||r.deckId===state.deckId);
 const navigate=(deckId:string|null,roomId:string|null)=>{
  const camera=manifest.cameras.find(c=>roomId?c.roomId===roomId:c.deckId===deckId&&!c.roomId);
  const component=roomId?manifest.rooms.find(r=>r.id===roomId)?.componentId:manifest.decks.find(d=>d.id===deckId)?.componentId;
  state.set({roomId,deckId,selected:component??null,system:null,isolated:null,hidden:[],explode:0,view:deckId||roomId?'Cutaway':'Exterior',preset:camera?`interior:${camera.id}`:'Three-quarter',cameraTick:Date.now(),drive:false});
 };
 return <section className="interior-navigator" aria-label="Explore yacht interiors">
  <label>Deck<ThemedSelect label="Interior deck" disabled={state.drive} value={state.deckId??'all'} onValueChange={value=>navigate(value==='all'?null:value,null)} options={[{value:'all',label:'Whole yacht'},...manifest.decks.map(d=>({value:d.id,label:d.name}))]}/></label>
  <label>Room<ThemedSelect label="Interior room" disabled={state.drive} value={state.roomId??'all'} onValueChange={value=>{const next=manifest.rooms.find(r=>r.id===value);navigate(next?.deckId??state.deckId??null,next?.id??null);}} options={[{value:'all',label:'Deck overview'},...rooms.map(r=>({value:r.id,label:r.name}))]}/></label>
  {room&&<p className="interior-evidence">{room.fidelity==='reconstructed'?'Reconstructed interior':'Reference-informed interior'} · {room.note}</p>}
 </section>;
}
