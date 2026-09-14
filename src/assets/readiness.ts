export type AssetStatus = 'loading' | 'ready' | 'error';

/** A scene is usable only when its entire current required set has loaded. */
export function createReadinessTracker(ids: readonly string[]) {
 const statuses = new Map(ids.map(id => [id, 'loading' as AssetStatus]));
 if (!ids.length || statuses.size !== ids.length) throw new Error('Required asset IDs must be nonempty and unique.');
 return {
  report(id: string, status: AssetStatus): AssetStatus {
   if (!statuses.has(id)) throw new Error(`Unexpected scene asset: ${id}`);
   statuses.set(id, status);
   const values = [...statuses.values()];
   return values.includes('error') ? 'error' : values.every(value => value === 'ready') ? 'ready' : 'loading';
  },
 };
}
