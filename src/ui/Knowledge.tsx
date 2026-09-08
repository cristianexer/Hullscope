import { ArrowUpRight, ShieldCheck, Waveform, Info } from '@phosphor-icons/react';
import type { Component, Mode, VesselRecord } from '../data/schema';
import { commonSources, systemById, systemForVessel } from '../data/systems';
import { useApp } from '../state';
const fictionDisclaimer = 'Fictional vessel · playful commentary, not maritime or insurance advice.';

function FictionalKnowledge({vessel, mode, onSources}:{vessel:VesselRecord;mode:Mode;onSources:()=>void}) {
 return <div className="knowledge-body">
  <div className="note"><Info size={18}/><p>{fictionDisclaimer}</p></div>
  {mode==='Performance'?<>
   <span className="section-number">02 / THE QUARTERMASTER’S LEDGER</span>
   <h2>Wind, wood & questionable decisions</h2>
   <p className="lead">{vessel.efficiency}</p>
   <h3><Waveform/> Propulsion: weather permitting</h3>
   <p>Fuel bill: excellent. Scheduling certainty: a discussion with the weather. There is no engine room hiding under the rum. In Drive mode, W sets more sail and S reefs it; pointing straight into the wind remains an ambitious misunderstanding of the controls.</p>
   <h3>Availability: ask the bosun</h3>
   <p>Canvas needs mending, ropes need checking and the bilge needs pumping. “It was like that when we stole it” is a poor maintenance record. Inspect the rigging and hull before adding another dramatic departure to the schedule.</p>
   <h3>Operating economics</h3>
   <p>Revenue: disputed treasure. Expenses: timber, canvas, provisions and explaining the missing provisions. Net profit: awaiting a recount by someone who can be trusted near the chest.</p>
   <p className="muted">No invented speed trials, crew productivity figures or financial returns. The jokes are ours; the following numbers are modelling choices.</p>
   <h3>Authoring particulars</h3><FactGrid vessel={vessel}/>
  </>:mode==='Risk'?<>
   <span className="section-number">03 / HERE BE ADMINISTRATIVE PROBLEMS</span>
   <h2>The risk register has tentacles</h2>
   <p className="lead">{vessel.risk}</p>
   <h3>Kraken concentration risk</h3>
   <p>Too many tentacles. One ship. A disappointing amount of diversification. Our entirely fictional mitigation: keep the escape route clear and do not list “loud confidence” as a secondary hull.</p>
   <h3>Curse due diligence</h3>
   <p>Before accepting treasure, ask whether it comes with an inventory, a receipt and an irreversible supernatural obligation. “Probably fine” belongs in the captain’s memoirs, not the checklist.</p>
   <h3>Rum inventory discrepancy</h3>
   <p>The barrel is empty. The ledger is optimistic. The lookout is singing. Keep drinking water separate, secure the stores and nominate a quartermaster who can count past “enough”.</p>
   <h3>Fire meets timber</h3>
   <p>The ordinary hazards still work: flame near dry canvas, loose heavy stores and water entering through damaged seams. Find the lanterns, securing points and hand-worked bilge equipment in the model. A curse is no substitute for a bucket.</p>
   <h3><ShieldCheck/> The underwriter has left the tavern</h3>
   <p>Hull: wooden. Voyage: complicated. Claims history: requires a sequel. The imaginary underwriter would like the captain to stop describing losses as “character development”. The renewal meeting has been moved to a tavern with two exits.</p>
  </>:<>
   <p className="lead">{vessel.purpose}</p><h3>How this interpretation works</h3><p>{vessel.operation}</p>
   <h3>Authoring particulars</h3><FactGrid vessel={vessel}/>
   <p className="muted">Hull length excludes the projecting bowsprit. All dimensions and internal arrangements are authored, not verified film specifications.</p>
  </>}
  <button className="text-link" onClick={onSources}>References & model notes <ArrowUpRight size={15}/></button>
 </div>;
}
export function FactGrid({vessel}:{vessel:VesselRecord}){return <dl className="fact-grid">{vessel.facts.map(f=><div key={f.label}><dt>{f.label}</dt><dd>{f.value===null?<span className="unknown">Not verified</span>:<>{typeof f.value==='number'?f.value.toLocaleString('en-GB'):f.value}<small> {f.unit}</small></>}<span className={`fact-status ${f.status}`}>{f.status==='verified'?'● Referenced':f.status==='unknown'?'○ Unknown':f.status}</span></dd></div>)}</dl>;}
export function Knowledge({vessel,mode,onSources}:{vessel:VesselRecord;mode:Mode;onSources:()=>void}){
 if(vessel.fictional)return <FictionalKnowledge vessel={vessel} mode={mode} onSources={onSources}/>;
 return <div className="knowledge-body">{mode==='Explore'?<><p className="lead">{vessel.purpose}</p><h3>Mission</h3><p>{vessel.operation}</p><h3>Vessel particulars</h3><FactGrid vessel={vessel}/><div className="note"><Info size={18}/><p>{vessel.configuration}. Geometry is a reference-informed reconstruction.</p></div></>:mode==='Performance'?<><span className="section-number">02 / ENERGY & AVAILABILITY</span><h2>Energy & availability</h2><p className="lead">{vessel.efficiency}</p><FactGrid vessel={vessel}/><h3><Waveform/> Reliability & maintenance</h3><p>Availability depends on connected systems. Cooling, lubrication, power and control faults can interrupt otherwise healthy machinery. Maintenance intervals and measured reliability have not been verified for this catalogue.</p><h3>Economics</h3><p>Capital cost, daily operating expense, charter income and insured value measure different things. No vessel-specific financial observation is currently verified here.</p><p className="muted">No inferred premiums, fuel curves, CII ratings or operating costs.</p></>:<><span className="section-number">03 / PHYSICAL EXPOSURE</span><h2>Failure & exposure</h2><p className="lead">{vessel.risk}</p><div className="risk-list">{['propulsion','cargo','safety','ballast'].map(id=>{const s=systemById[id as keyof typeof systemById];return <button key={id} onClick={()=>useApp.getState().set({system:s.id,isolated:s.id,view:'X-ray',mode:'Explore'})}><span style={{background:s.color}}/><div><strong>{s.name}</strong><p>{s.failure}</p></div><ArrowUpRight size={18}/></button>;})}</div><h3><ShieldCheck/> Insurance lens</h3><p><strong>Hull & machinery</strong> concerns physical vessel damage. <strong>Cargo</strong> concerns goods carried. <strong>P&I</strong> addresses covered third-party liabilities, while <strong>loss of hire</strong> concerns qualifying interruption. War and builders’ risks have distinct coverage contexts.</p><p className="muted">These are educational exposure categories, not policy interpretation or actuarial scores. Actual coverage depends on policy wording.</p><h3>Regulation</h3><p>SOLAS provides a safety framework; MARPOL addresses pollution. Applicability depends on vessel type, size, flag and operation. Naval vessels and inland craft may follow different regimes.</p></>}
 <button className="text-link" onClick={onSources}>References & model notes <ArrowUpRight size={15}/></button>
 </div>;
}
export function ComponentCard({part,vessel,onSources}:{part:Component;vessel:VesselRecord;onSources:()=>void}){const s=systemForVessel(part.systemId,vessel);return <div className="component-card"><span className="eyebrow" style={{color:s.color}}>{s.name}</span><h2>{part.name}</h2><p className="assembly-label">{part.assembly}</p>{part.decorative&&<p className="muted">Visual detail · excluded from the meaningful component total.</p>}<div className="fidelity-badge">◌ {part.fidelity==='reconstructed'?'Reconstructed geometry':'Reference-informed geometry'}</div><h3>What it does</h3><p>{part.purpose}</p><h3>How the system works</h3><p>{s.operation}</p><h3>Failure & consequence</h3><p>{s.failure}</p><h3>Depends on</h3><div className="dependency-chips">{s.dependencies.map(id=><button key={id} onClick={()=>useApp.getState().set({system:id,isolated:id,selected:null,view:'X-ray'})}>{systemForVessel(id,vessel).name}<ArrowUpRight size={12}/></button>)}</div><p className="muted">{vessel.fictional?`Authored aboard ${vessel.name}. This period-inspired arrangement is an original interpretation, not verified film canon.`:`Shown aboard ${vessel.name}. Internal arrangement and individual equipment identity have not been verified.`}</p><button className="text-link" onClick={onSources}>View evidence <ArrowUpRight size={15}/></button></div>;}
export function Sources({vessel}:{vessel:VesselRecord}){return <div className="sources-content"><div className="note"><Info size={20}/><p>{vessel.modelNote}</p></div><h3>Configuration</h3><p>{vessel.configuration}</p><h3>Vessel references</h3>{vessel.sources.map(s=><a className="source-card" href={s.url} target="_blank" rel="noreferrer" key={s.id}><span className="eyebrow">{s.publisher}</span><strong>{s.title}<ArrowUpRight size={18}/></strong><p>{s.scope}</p><small>Checked {s.accessed} · Publication date {s.published??'not supplied'}</small></a>)}{!vessel.fictional&&<><h3>Engineering context</h3>{commonSources.map(s=><a className="source-card" href={s.url} target="_blank" rel="noreferrer" key={s.id}><strong>{s.title}<ArrowUpRight size={18}/></strong><p>{s.scope}</p></a>)}</>}<h3>Reading the evidence</h3><p>{vessel.fictional?'Disney sources establish the fictional subject and captain identity only. Hullscope’s dimensions, component inventory, interior arrangement and humorous commentary are original authoring choices, not additional film canon. The geometry and handling are illustrative. No real insurance or regulatory assessment applies to these jokes.':'Referenced facts link to an external publication. Unknown values stay empty. Reconstructed geometry expresses educational relationships and is not a verified arrangement plan.'} Reference images and external models are not redistributed.</p></div>;}
