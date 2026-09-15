import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowUpRight, Check, MagnifyingGlass } from '@phosphor-icons/react';
import type { VesselRecord } from '../data/schema';
import { emptyYachtFilters, filterFleet } from '../data/yachts/filter';
import { Modal } from './Primitives';
import { YachtFilters } from './YachtFilters';
import { yachtAssetResolver, yachtReleaseStatus } from '../assets/yachts';

function VesselSilhouette({kind,color}:{kind:string;color:string}){if(kind==='pirate')return <svg className="vessel-silhouette pirate" viewBox="0 0 300 110" aria-hidden="true"><g fill="#243b45" stroke="#819797" strokeWidth="1"><path d="M30 79Q145 103 267 79L251 98Q125 115 43 95Z"/><path d="M65 84V18M137 91V6M207 86V24M261 81L290 65" fill="none"/><path d="M43 30H91L84 49Q67 55 45 47ZM39 53H96L88 77Q66 80 40 71ZM111 20H167L163 47Q139 51 114 42ZM105 51H172L162 81Q136 84 109 75ZM188 36H227L224 53Q204 57 191 51ZM185 58H236L226 79Q206 82 190 75Z"/><path d="M65 18L34 85M65 18L98 88M137 6L99 91M137 6L181 90M207 24L183 89M207 24L253 85M207 24L281 70" fill="none" strokeOpacity=".45"/><path d="M38 80V71H63V83M46 83V96M69 87V100M94 89V103M119 91V105M146 91V105M173 90V104M200 88V102M226 85V99" fill="none"/></g></svg>;return <div className={`vessel-silhouette ${kind}`} style={{'--ship-color':color} as CSSProperties}><div className="silhouette-hull"/><div className="silhouette-house"/>{['container','autonomous','inland'].includes(kind)?<div className="silhouette-containers">{Array.from({length:15},(_,i)=><i key={i}/>)}</div>:['cruise','ferry','roro','livestock'].includes(kind)?<div className="silhouette-decks"><i/><i/><i/></div>:['wind','crane','general','utility','cable','research'].includes(kind)?<div className="silhouette-crane"/>:kind==='lng'?<div className="silhouette-tanks"><i/><i/><i/></div>:<div className="silhouette-mast"/>}</div>;}

function YachtThumbnail({vessel}:{vessel:VesselRecord}) {
 const [failed,setFailed]=useState(false);
 if(failed)return <div className="yacht-thumbnail-fallback" role="img" aria-label={vessel.name+' thumbnail unavailable'}><svg viewBox="0 0 320 120" aria-hidden="true"><path d="M24 68h255l-26 28H62Z" fill={vessel.hullColor}/><path d="M64 67 86 42h115l29 25Z" fill="#d6e6ee"/><path d="M106 42h76l19 25h-98Z" fill="#193c56"/><path d="M113 42V27h62v15M176 30l28 0" fill="none" stroke="#d6e6ee" strokeWidth="5"/><path d="M75 77h174" stroke="#f0fbff" strokeWidth="2" opacity=".55"/></svg></div>;
 return <img className="yacht-thumbnail" src={yachtAssetResolver().resolve(vessel.yacht!.thumbnail)} alt={vessel.name+' reference-informed 3D reconstruction'} loading="lazy" onError={()=>setFailed(true)}/>;
}

export function FleetBrowser({open,onOpenChange,vessels,selectedId,onSelect}:{open:boolean;onOpenChange:(open:boolean)=>void;vessels:readonly VesselRecord[];selectedId:string;onSelect:(id:string)=>void}) {
 const [search,setSearch]=useState('');
 const [group,setGroup]=useState('All vessels');
 const [yacht,setYacht]=useState({...emptyYachtFilters});
 const groups=[...new Set(vessels.map(v=>v.family.group))];
 const filtered=useMemo(()=>filterFleet(vessels,{group,search,yacht}),[vessels,group,search,yacht]);
 return <Modal open={open} onOpenChange={onOpenChange} title="Find your next vessel" description="Explore vessel families and yacht generations. Specifications distinguish documented facts from reconstructions." wide>
  <div className="fleet-toolbar"><label className="search-box"><MagnifyingGlass size={18}/><input aria-label="Search fleet" placeholder="Search vessel, family or purpose…" value={search} onChange={e=>setSearch(e.target.value)}/></label><span>{filtered.length} / {vessels.length} VESSELS</span></div>
  <div className="fleet-filters">{['All vessels',...groups].map(g=><button key={g} className={group===g?'active':''} aria-pressed={group===g} onClick={()=>setGroup(g)}>{g}</button>)}</div>
  {group==='Yachts'&&<YachtFilters vessels={vessels} value={yacht} onChange={setYacht}/>}
  <div className="fleet-grid">{filtered.map(v=><button className={`fleet-card ${v.id===selectedId?'selected':''}`} key={v.id} onClick={()=>{onSelect(v.id);onOpenChange(false);}}>
   <div className="fleet-card-top"><span>{String(vessels.indexOf(v)+1).padStart(2,'0')} / {v.family.group}</span>{v.id===selectedId?<Check size={16}/>:<ArrowUpRight size={16}/>}</div>
   {v.yacht?<YachtThumbnail vessel={v}/>:<VesselSilhouette kind={v.kind} color={v.hullColor}/>}
   <span className="eyebrow">{v.family.name}{v.yacht&&yachtReleaseStatus==='draft'?' · Draft reconstruction':''}</span><h3>{v.name}</h3><p>{v.yacht?`${v.yacht.generation} · ${v.yacht.productionStatus}`:v.subtitle}</p>
  </button>)}</div>
  {!filtered.length&&<div className="empty">No vessels match. Try a different family or search term.</div>}
 </Modal>;
}
