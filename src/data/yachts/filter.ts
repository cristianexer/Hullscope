import type { VesselRecord } from '../schema';

export type YachtFilterValues = { brand: string; type: string; range: string; status: string; fromYear: string; toYear: string; minLength: string; maxLength: string };
export const emptyYachtFilters: YachtFilterValues = { brand: '', type: '', range: '', status: '', fromYear: '', toYear: '', minLength: '', maxLength: '' };
const numberOrNull = (value: string) => value.trim() && Number.isFinite(Number(value)) ? Number(value) : null;

export function filterFleet(vessels: readonly VesselRecord[], filters: { group: string; search: string; yacht: YachtFilterValues }): VesselRecord[] {
  const search = filters.search.trim().toLocaleLowerCase();
  const f = filters.yacht;
  return vessels.filter(v => {
    if (filters.group !== 'All vessels' && v.family.group !== filters.group) return false;
    const y = v.yacht;
    if (!`${v.name} ${v.family.name} ${v.purpose} ${y ? `${y.brand} ${y.range} ${y.generation} ${y.aliases.join(' ')}` : ''}`.toLocaleLowerCase().includes(search)) return false;
    if (filters.group !== 'Yachts') return true;
    if (f.brand && y?.brand !== f.brand || f.range && y?.range !== f.range || f.type && y?.type !== f.type || f.status && y?.productionStatus !== f.status) return false;
    const from = numberOrNull(f.fromYear), to = numberOrNull(f.toYear);
    if (from !== null || to !== null) {
      if (!y || y.productionStart === null) return false;
      const end = y.productionEnd ?? (y.productionStatus === 'current' ? 2026 : null);
      if (from !== null && (end === null || end < from) || to !== null && y.productionStart > to) return false;
    }
    const min = numberOrNull(f.minLength), max = numberOrNull(f.maxLength);
    return !(min !== null && v.length < min || max !== null && v.length > max);
  });
}
