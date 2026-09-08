import { Euler, Quaternion, Vector3 } from 'three';
import type { Component, SystemId, Vec3, VesselRecord } from '../data/schema';
import { hullHalfWidth } from './geometry';

type Options = Partial<Pick<Component, 'shape' | 'rotation' | 'interior' | 'decorative' | 'parentId' | 'explode' | 'localExplode'>>;

/** Additive, original period-inspired interior; no film arrangement or inventory is asserted. */
export function appendBlackPearlInterior(v: VesselRecord, out: Component[], deckIds: string[]): void {
  if (deckIds.length !== 3 || deckIds.some(id => !out.some(part => part.id === id))) {
    throw new Error('Black Pearl interior requires its three existing deck parents.');
  }
  const scale = v.length / 100;
  const width = v.beam / scale;
  const timber = '#594332', oak = '#433025', iron = '#34332e', rope = '#807057';
  const counts = new Map<string, number>();
  const scaled = (p: Vec3): Vec3 => [p[0] * scale, p[1] * scale, p[2] * scale];
  const add = (name: string, systemId: SystemId, assembly: string, position: Vec3, size: Vec3, color: string, purpose: string, options: Options = {}): string => {
    const key = `${systemId}.${assembly}.${name}`.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    const count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    const id = `${v.id}.interior-detail.${key}.${count}`;
    out.push({
      id, vesselId: v.id, name, systemId, assembly, parentId: options.parentId ?? null,
      position: scaled(position), size: scaled(size), shape: options.shape ?? 'box', rotation: options.rotation ?? [0, 0, 0],
      color, interior: options.interior ?? true, decorative: options.decorative ?? false, fidelity: 'reconstructed',
      explode: scaled(options.explode ?? [0, 20, 0]), localExplode: scaled(options.localExplode ?? [0, 2, 0]),
      purpose: `${purpose} Original period-inspired arrangement; not verified film canon.`, sourceIds: [],
    });
    return id;
  };
  const beam = (name: string, system: SystemId, assembly: string, from: Vec3, to: Vec3, thickness: number, color: string, purpose: string, options: Options = {}): string => {
    const direction = new Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
    const rotation = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize()));
    return add(name, system, assembly, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2], [thickness, direction.length(), thickness], color, purpose, { ...options, rotation: [rotation.x, rotation.y, rotation.z] });
  };
  const halfDeckWidth = (x: number) => hullHalfWidth(x / 96 + .5, 'pirate') * width * .865;
  const decks = [{ name: 'Lower gun deck', y: 4.1, lift: 8 }, { name: 'Upper gun deck', y: 8.6, lift: 23 }, { name: 'Main strength deck', y: 13.1, lift: 41 }];

  // Each existing transverse beam receives both a vertical hanging knee and an
  // in-plane lodging knee at each end. They resist different load directions.
  for (const [deckIndex, deck] of decks.entries()) {
    const parentId = deckIds[deckIndex];
    const assembly = `${deck.name} knee connections`;
    for (let station = 0; station < 14; station++) {
      const x = -39 + station * 6;
      for (const side of [-1, 1]) {
        const sideName = side < 0 ? 'Port' : 'Starboard';
        const z = side * (halfDeckWidth(x) - .25);
        const options: Options = { parentId, explode: [0, deck.lift, side * 3] };
        beam(`${sideName} hanging knee at beam ${station + 1}`, 'structure', assembly,
          [x, deck.y - .65, z - side * 1.7], [x, deck.y - 2.35, z], .48, oak,
          'Diagonal timber knee transfers the beam-end vertical load into the side framing and restrains the beam from lifting away.', options);
        const direction = station === 13 ? -1 : 1;
        beam(`${sideName} lodging knee at beam ${station + 1}`, 'structure', assembly,
          [x, deck.y - .65, z - side * 1.55], [x + direction * 1.65, deck.y - .65, side * (halfDeckWidth(x + direction * 1.65) - .3)], .4, timber,
          'Horizontal lodging knee braces this beam against fore-and-aft racking at the hull connection.', options);
      }
    }
    // Short longitudinal ledges bridge the clear span between successive main
    // beams. Three longitudinal rows support the deck without filling gun aisles.
    for (let bay = 0; bay < 13; bay++) {
      const fromX = -39 + bay * 6 + .35;
      const toX = fromX + 5.3;
      const outboard = Math.min(halfDeckWidth(fromX), halfDeckWidth(toX)) * .52;
      for (const row of [-1, 0, 1]) {
        const label = row < 0 ? 'Port' : row > 0 ? 'Starboard' : 'Centre';
        beam(`${label} longitudinal ledge in bay ${bay + 1}`, 'structure', `${deck.name} ledges`,
          [fromX, deck.y - .44, row * outboard], [toX, deck.y - .44, row * outboard], .32, timber,
          'This ledge carries local deck-planking load across the gap between its two neighbouring transverse beams.', { parentId, explode: [0, deck.lift, 0] });
      }
    }
    for (const side of [-1, 1]) {
      for (let length = 0; length < 6; length++) {
        const fromX = -39 + length * 13, toX = fromX + 13;
        beam(`${side < 0 ? 'Port' : 'Starboard'} beam-shelf timber length ${length + 1}`, 'structure', `${deck.name} beam shelves`,
          [fromX, deck.y - 1.05, side * (halfDeckWidth(fromX) - .1)], [toX, deck.y - 1.05, side * (halfDeckWidth(toX) - .1)], .56, oak,
          'Longitudinal load-bearing shelf supports multiple deck-beam ends and spreads their reactions across adjacent frames. Individual timber lengths meet at authored scarf stations.',
          { parentId, explode: [0, deck.lift, side * 3] });
      }
    }
  }

  // Covered hatches: solid deck meshes stay closed, rather than implying a
  // visible opening which the parent geometry does not contain.
  for (const [index, deck] of decks.entries()) {
    const x = index === 2 ? -8 : 32;
    const assembly = `${deck.name} covered access hatch`;
    const parentId = deckIds[index];
    const options: Options = { parentId, interior: index !== 2, explode: [0, deck.lift + 2, 0] };
    const coaming = add('Forward hatch coaming', 'structure', assembly, [x + 2.1, deck.y + .45, 0], [.35, .6, 3.5], timber,
      'Raised forward boundary strengthens the covered hatch perimeter and helps keep deck water out.', options);
    for (const [name, p, size] of [
      ['After hatch coaming', [x - 2.1, deck.y + .45, 0], [.35, .6, 3.5]],
      ['Port hatch coaming', [x, deck.y + .45, -1.65], [4, .6, .35]],
      ['Starboard hatch coaming', [x, deck.y + .45, 1.65], [4, .6, .35]],
    ] as const) add(name, 'structure', assembly, [...p], [...size], timber, 'Load-bearing side of this covered access-hatch perimeter.', { ...options, parentId: coaming });
    for (const side of [-1, 1]) {
      add(`${side < 0 ? 'Port' : 'Starboard'} removable hatch cover`, 'structure', assembly,
        [x, deck.y + .8, side * .77], [3.75, .24, 1.5], oak,
        'Separate removable cover leaf closes the hatch. The assembled model represents it secured shut.', { ...options, parentId: coaming, localExplode: [0, 3, side * 2] });
      beam(`${side < 0 ? 'Port' : 'Starboard'} ladder stringer`, 'accommodation', assembly,
        [x - 1.4, deck.y - .15, side * 1.1], [x + 1.4, deck.y - 4.15, side * 1.1], .3, timber,
        'Longitudinal side member carries the companion ladder’s treads between adjacent deck levels.', { ...options, interior: true, parentId: coaming });
      beam(`${side < 0 ? 'Port' : 'Starboard'} ladder hand rope`, 'safety', assembly,
        [x - 1.7, deck.y + .35, side * 1.3], [x + 1.1, deck.y - 3.65, side * 1.3], .12, rope,
        'Continuous hand rope provides a separate handhold beside the companion ladder.', { ...options, interior: true, parentId: coaming });
    }
    for (let tread = 0; tread < 8; tread++) {
      const t = tread / 7;
      add(`Companion ladder tread ${tread + 1}`, 'accommodation', assembly,
        [x - 1.4 + t * 2.8, deck.y - .15 - t * 4, 0], [.48, .16, 2.3], timber,
        'Individual step of the access ladder; repeated tread detail is excluded from the meaningful component quota.', { ...options, interior: true, parentId: coaming, decorative: true });
    }
  }

  const quarterdeck = out.find(part => part.name === 'Quarterdeck')?.id ?? deckIds[2];
  const cabin = 'Captain’s cabin joinery';
  const cabinOptions: Options = { parentId: quarterdeck, explode: [-6, 59, 0] };
  const enclosureOptions: Options = { ...cabinOptions, interior: false };
  const screen = add('Forward cabin screen, port panel', 'accommodation', cabin, [-32.5, 19.65, -5.9], [.24, 4.1, 7.9], timber,
    'Partition separates the captain’s cabin from the exposed quarterdeck while leaving a central doorway.', enclosureOptions);
  add('Forward cabin screen, starboard panel', 'accommodation', cabin, [-32.5, 19.65, 5.9], [.24, 4.1, 7.9], timber,
    'Opposite partition panel completes the sheltered front of the cabin.', enclosureOptions);
  for (const side of [-1, 1]) add(`${side < 0 ? 'Port' : 'Starboard'} cabin door jamb`, 'accommodation', cabin,
    [-32.45, 19.65, side * 1.8], [.45, 4.1, .35], oak, 'Structural jamb carries the cabin doorway edge and its joinery.', { ...enclosureOptions, parentId: screen });
  add('Cabin door lintel', 'accommodation', cabin, [-32.45, 21.6, 0], [.45, .35, 3.8], oak,
    'Head timber bridges the cabin doorway.', { ...enclosureOptions, parentId: screen });
  add('Cabin door threshold', 'accommodation', cabin, [-32.45, 17.75, 0], [.55, .22, 3.5], oak,
    'Raised threshold closes the bottom of the door surround.', { ...enclosureOptions, parentId: screen });
  add('Cabin door leaf', 'accommodation', cabin, [-32.35, 19.65, 0], [.18, 3.65, 3.35], timber,
    'Single closed timber door provides privacy and shelter.', { ...enclosureOptions, parentId: screen });
  for (const [name, p, size, purpose] of [
    ['Berth outboard retaining rail', [-42, 20.0, -7.0], [7, .65, .18], 'Raised berth side restrains bedding during ordinary ship motion.'],
    ['Berth inboard retaining rail', [-42, 20.0, -3.0], [7, .65, .18], 'Inboard berth side keeps the sleeping berth enclosed.'],
    ['Berth headboard', [-45.4, 20, -5], [.2, 1.2, 4], 'End board supports the head of the berth and its bedding.'],
    ['Berth footboard', [-38.6, 20, -5], [.2, .9, 4], 'Opposite berth end contains bedding without closing the cabin aisle.'],
    ['Chart-table port retaining fiddle', [-39, 20.52, 1.55], [5, .18, .13], 'Raised table edge reduces the chance of loose chart tools sliding off.'],
    ['Chart-table starboard retaining fiddle', [-39, 20.52, 4.45], [5, .18, .13], 'Opposite table edge restrains objects as the ship rolls.'],
    ['Chart-table after retaining fiddle', [-41.45, 20.52, 3], [.13, .18, 2.8], 'After table rim completes the retained working surface.'],
    ['Chart-table forward retaining fiddle', [-36.55, 20.52, 3], [.13, .18, 2.8], 'Forward table rim completes the retained working surface.'],
    ['Cabin chart-roll rack', [-46.7, 20.4, 2], [.6, .6, 3.5], 'Separate wall rack keeps rolled charts clear of the walking space.'],
    ['Cabin washstand shelf', [-34.5, 19.2, 7.8], [2.6, .25, 1.2], 'Wall-mounted shelf supports a wash basin and daily-use items.'],
    ['Cabin washstand basin', [-34.5, 19.6, 7.8], [1.5, .55, .85], 'Separate shallow basin serves washing without any implied piped supply.'],
    ['Cabin washstand drain pail', [-34.5, 18.35, 7.8], [1.2, 1.1, .8], 'Portable pail holds used wash water for manual removal.'],
    ['Cabin medicine shelf', [-46.7, 20.4, -1], [.6, .3, 2.1], 'Shelf separates small protected stores from the cabin floor.'],
    ['Cabin writing-desk pigeonhole rack', [-35.5, 21, -4], [2.4, .7, .6], 'Raised compartment rack organises writing materials above the existing desk.'],
    ['Cabin clothing locker', [-45.7, 19.3, 7.7], [2.2, 3.4, 1.6], 'Enclosed upright locker keeps clothing and personal stores together.'],
  ] as const) add(name, 'accommodation', cabin, [...p], [...size], timber, purpose, { ...cabinOptions, decorative: name.includes('retaining fiddle') });

  // Service access and discharge are distinct from the existing pump barrels,
  // pistons, valves and suction tubes in the parent model.
  for (let pumpIndex = 0; pumpIndex < 4; pumpIndex++) {
    const x = -10 + pumpIndex * 5, z = pumpIndex % 2 ? 5 : -5;
    const parentId = out.find(part => part.name === `Hand bilge pump ${pumpIndex + 1} barrel`)?.id ?? deckIds[2];
    const assembly = `Hand pump ${pumpIndex + 1} service fittings`;
    const options: Options = { parentId, interior: false, explode: [0, 47, z < 0 ? -12 : 12] };
    add('Pump-barrel retaining collar', 'ballast', assembly, [x, 13.8, z], [1.4, .38, 1.4], oak,
      'Deck-level timber collar supports the pump barrel against side loads from manual operation.', options);
    add('Discharge spout', 'ballast', assembly, [x + .8, 14.7, z], [1.3, .32, .48], timber,
      'Outlet carries discharged bilge water away from the pump barrel into a portable receiving trough.', options);
    add('Discharge receiving trough', 'ballast', assembly, [x + 1.8, 13.7, z], [1.9, .36, .85], timber,
      'Short receiving trough collects the manual pump outlet; onward discharge is crew-managed and schematic.', options);
    add('Lever fulcrum bearing', 'ballast', assembly, [x + .5, 15.92, z], [.55, .65, .75], iron,
      'Separate bearing carries the pump handle pivot and transfers the crew’s lever reaction into the barrel support.', options);
  }
}
