import type { System, SystemId, VesselRecord } from './schema';

/** Original fan interpretation. Numeric dimensions are authoring inputs, never film-canon specifications. */
export const blackPearl: VesselRecord = {
  id: 'black-pearl', name: 'Black Pearl', kind: 'pirate', fictional: true,
  family: { id: 'pirate', name: 'Fictional & legendary ships', group: 'Special', description: 'A fictional sailing ship, explored through an original period-inspired reconstruction.', subtypes: ['Fictional pirate ship'] },
  subtitle: 'Fictional pirate ship · original interpretation',
  signature: 'Wind in the sails. Trouble on the horizon.',
  purpose: 'Meet the Black Pearl from Disney’s Pirates of the Caribbean: a fictional ship with a very real talent for getting its captain into trouble. This original model explores a timber hull, working rig, gun decks and the decidedly manual business of keeping water outside.',
  length: 52, beam: 14, depth: 10, year: 2003,
  hullColor: '#272927', deckColor: '#6d5340',
  configuration: 'Original fan interpretation of the fictional Black Pearl; not a replica of a specific film set, prop or canon arrangement. The 2003 reference identifies the first film, not a ship launch date',
  dimensionStatus: 'inferred',
  facts: [
    { label: 'Authored hull length', value: 52, unit: 'm', status: 'inferred', sourceId: null, effective: null, note: 'Original modelling scale; not a published Black Pearl specification.' },
    { label: 'Authored beam', value: 14, unit: 'm', status: 'inferred', sourceId: null, effective: null, note: 'Original modelling scale; not a published Black Pearl specification.' },
    { label: 'Authored hull depth', value: 10, unit: 'm', status: 'inferred', sourceId: null, effective: null, note: 'Original modelling scale; excludes masts and rigging.' },
    { label: 'Captain in Disney’s character profile', value: 'Jack Sparrow', unit: '', status: 'verified', sourceId: 'black-pearl-disney-jack', effective: null },
    { label: 'Verified sailing speed', value: null, unit: 'kn', status: 'unknown', sourceId: null, effective: null },
  ],
  sources: [
    { id: 'black-pearl-reference', publisher: 'Disney', title: 'Pirates of the Caribbean — official site', url: 'https://pirates.disney.com/', accessed: '2026-09-08', published: null, scope: 'Fictional subject identity and the official Black Pearl gallery image as visual reference. Does not establish dimensions, internal arrangements, equipment counts or simulation parameters. No Disney image is redistributed.' },
    { id: 'black-pearl-disney-jack', publisher: 'Disney', title: 'Captain Jack Sparrow — official character profile', url: 'https://pirates.disney.com/jack-sparrow', accessed: '2026-09-08', published: null, scope: 'Identifies Jack Sparrow as captain of the Black Pearl. The humorous commentary in Hullscope is original; it is not a quotation or a statement of additional film canon.' },
  ],
  operation: 'Sails turn wind into drive; braces and sheets control the rig, and a wheel works the rudder. The crew haul, reef, pump, stow and repair by hand. The interior is an authored illustration of period sailing relationships, not a recovered plan of the fictional ship.',
  efficiency: 'The wind sends no invoice. The sailmaker, cooper and crew have noticed this loophole and would like a word. Performance here means getting canvas, hull and human effort to agree on a direction.',
  risk: 'A timber ship, open flames, heavy rigging and a captain whose contingency plan is usually another contingency. Add a purely fictional kraken and the risk register begins to need a bigger desk.',
  modelNote: 'Fictional vessel. All geometry is an original, period-inspired fan interpretation. The 52 m hull length, 14 m beam and 10 m hull depth are inferred authoring dimensions, not verified film canon. Interior spaces, equipment inventory and sailing arrangement are authored. Drive and storm handling use Hullscope’s illustrative shared physics, not measured performance. Disney reference images, film assets, logos and audio are not redistributed. No Disney affiliation or endorsement is implied.',
};

/** Period-specific educational copy; modern catalogue system IDs remain stable for selection. */
const periodSystems: Record<SystemId, { name: string; operation: string; failure: string; dependencies: SystemId[] }> = {
  structure: { name: 'Timber hull & framing', operation: 'Planking, frames, knees and deck beams form an illustrated timber load path. Caulked seams help keep the sea outside.', failure: 'Opened seams, damaged timber or loose fastenings can admit water and weaken the structure.', dependencies: ['ballast'] },
  propulsion: { name: 'Sails, rigging & steering', operation: 'Sails load the spars and rigging; sheets and braces adjust their setting. The wheel and steering ropes operate the rudder. This model has no engine.', failure: 'Torn canvas, parted rigging or jammed steering reduce control. Shouting at the wind remains an unverified remedy.', dependencies: ['structure', 'navigation'] },
  electrical: { name: 'Lanterns & period lighting', operation: 'Lanterns provide local light. This catalogue category contains period lighting equipment; it does not imply an electrical installation.', failure: 'A broken lantern can release flame near timber, canvas and rope. Darkness is inconvenient; a burning ship is more so.', dependencies: ['fuel', 'safety'] },
  fuel: { name: 'Lamp oil & galley fuel', operation: 'Stowed oil and solid fuel serve illustrated lamps and the galley, separate from sail propulsion.', failure: 'Spilled oil or loose embers can turn ordinary stores into a fire source.', dependencies: ['safety', 'structure'] },
  cargo: { name: 'Gun decks & ship’s stores', operation: 'Carriages, tackles, storage racks and secured barrels organise the mission spaces. This is a schematic arrangement, not a documented armament inventory.', failure: 'Unsecured heavy stores can shift as the ship rolls; blocked passages obstruct the crew.', dependencies: ['structure', 'ballast', 'safety'] },
  navigation: { name: 'Helm, charts & lookout', operation: 'A lookout, chart table and compass represent period navigation. No radar, satellite positioning or magical destination guarantee is modelled.', failure: 'Poor visibility, mistaken position or misunderstood helm orders can bring land considerably closer than intended.', dependencies: ['propulsion', 'electrical'] },
  safety: { name: 'Fire buckets & damage control', operation: 'Buckets, portable equipment, accessible passageways and crew effort represent a manual response to trouble.', failure: 'Fire, inaccessible equipment and blocked escape routes can overwhelm the available response.', dependencies: ['utilities', 'structure'] },
  ballast: { name: 'Ballast & hand-worked bilge', operation: 'Low stowed ballast supports the illustrated trim arrangement. Hand-worked bilge pumps remove unwanted water; there are no automatic ballast controls.', failure: 'Shifting weight, leaks or exhausted pump crews can compromise the vessel. Bilge water is not additional cargo capacity.', dependencies: ['structure', 'utilities'] },
  utilities: { name: 'Fresh water & manual services', operation: 'Casks, drains, ventilation openings and manually operated services support life aboard.', failure: 'Leaking casks, contaminated stores or blocked drains can make a long voyage longer in every way that matters.', dependencies: ['structure', 'safety'] },
  accommodation: { name: 'Cabins, hammocks & galley', operation: 'Cabins, hammocks, mess spaces and a galley illustrate the human side of a sailing ship.', failure: 'Smoke, crowded passages and inadequate stores threaten habitability. The captain’s larger cabin does not fix any of these.', dependencies: ['utilities', 'safety', 'electrical'] },
  mooring: { name: 'Anchors, cables & capstan', operation: 'Crew turn a capstan and manage cables through fairleads, transferring mooring and anchor loads into the timber hull.', failure: 'A parted cable, uncontrolled load or damaged attachment can endanger crew and release the ship.', dependencies: ['structure'] },
};

const periodColors: Record<SystemId, string> = { structure: '#92aaa5', propulsion: '#cf9977', electrical: '#dbc17e', fuel: '#c4998e', cargo: '#73c8be', navigation: '#8bb5d2', safety: '#e8996e', ballast: '#77aabb', utilities: '#7fb4a1', accommodation: '#cec9af', mooring: '#b49b76' };

export const blackPearlSystems = Object.fromEntries(Object.entries(periodSystems).map(([id, copy]): [string, System] => [id, {
  id: id as SystemId, color: periodColors[id as SystemId], ...copy, summary: copy.operation, sourceIds: [],
}])) as Record<SystemId, System>;
