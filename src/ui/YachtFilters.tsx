import type { VesselRecord } from '../data/schema';
import { emptyYachtFilters } from '../data/yachts/filter';
import type { YachtFilterValues } from '../data/yachts/filter';
import { ThemedSelect } from './Primitives';

export function YachtFilters({ vessels, value, onChange }: { vessels: readonly VesselRecord[]; value: YachtFilterValues; onChange: (next: YachtFilterValues) => void }) {
  const yachts = vessels.flatMap(v => v.yacht ? [v.yacht] : []);
  const choices = (key: 'brand' | 'range' | 'type' | 'productionStatus') => [...new Set(yachts.filter(y => !value.brand || key === 'brand' || y.brand === value.brand).map(y => y[key]))].sort();
  const select = (label: string, key: 'brand' | 'range' | 'type' | 'status', values: string[]) => <label>{label}<ThemedSelect label={`Yacht ${label.toLowerCase()}`} value={value[key] || 'all'} onValueChange={next => onChange({ ...value, [key]: next === 'all' ? '' : next, ...(key === 'brand' ? { range: '', type: '' } : {}) })} options={[{ value: 'all', label: `All ${label.toLowerCase()}` }, ...values.map(item => ({ value: item, label: item }))]}/></label>;
  return <div className="yacht-filters" aria-label="Yacht filters">
    {select('Brands', 'brand', choices('brand'))}{select('Ranges', 'range', choices('range'))}{select('Types', 'type', choices('type'))}{select('Statuses', 'status', choices('productionStatus'))}
    {([['fromYear', 'Produced from', 1900, 2026], ['toYear', 'Produced through', 1900, 2026], ['minLength', 'Minimum length (m)', 0, 300], ['maxLength', 'Maximum length (m)', 0, 300]] as const).map(([key, label, min, max]) => <label key={key}>{label}<input type="number" aria-label={label} min={min} max={max} value={value[key]} onChange={event => onChange({ ...value, [key]: event.target.value })}/></label>)}
    <button className="isolate-link" onClick={() => onChange({ ...emptyYachtFilters })}>Clear yacht filters</button>
  </div>;
}
