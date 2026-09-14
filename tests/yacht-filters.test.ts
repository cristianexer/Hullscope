import { describe, expect, it } from 'vitest';
import { fleet } from '../src/data/fleet';
import { filterFleet, emptyYachtFilters } from '../src/data/yachts/filter';
import type { VesselRecord } from '../src/data/schema';
const yacht: VesselRecord = { ...fleet[0], id: 'princess-test-2004', name: 'Princess Test', family: { ...fleet[0].family, group: 'Yachts' }, length: 16,
  yacht: { brand: 'Princess', range: 'V Class', type: 'Sports yacht', generation: '2004 generation', productionStart: 2004, productionEnd: 2008, productionStatus: 'historical', aliases: ['Test Mk I'], thumbnail: 'a.webp', manifest: 'a.json' },
};
describe('yacht fleet discovery', () => {
  it('finds historical carryovers by interval overlap and aliases', () => {
    expect(filterFleet([yacht], { group: 'Yachts', search: 'mk i', yacht: { ...emptyYachtFilters, fromYear: '2006', toYear: '2006' } }).map(v => v.id)).toEqual(['princess-test-2004']);
    expect(filterFleet([yacht], { group: 'Yachts', search: '', yacht: { ...emptyYachtFilters, fromYear: '2009' } })).toEqual([]);
  });
  it('does not apply hidden yacht filters to other fleet groups', () => {
    expect(filterFleet([fleet[0]], { group: 'All vessels', search: '', yacht: { ...emptyYachtFilters, brand: 'Princess' } })).toHaveLength(1);
  });
  it('separates brand and length and does not pretend unknown dates are matches', () => {
    expect(filterFleet([yacht], { group: 'Yachts', search: '', yacht: { ...emptyYachtFilters, brand: 'Sunseeker' } })).toHaveLength(0);
    expect(filterFleet([yacht], { group: 'Yachts', search: '', yacht: { ...emptyYachtFilters, minLength: '17' } })).toHaveLength(0);
    const unknown = { ...yacht, yacht: { ...yacht.yacht!, productionStart: null, productionEnd: null } };
    expect(filterFleet([unknown], { group: 'Yachts', search: '', yacht: { ...emptyYachtFilters, fromYear: '2006' } })).toHaveLength(0);
  });
});
