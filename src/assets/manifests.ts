import { useEffect, useState } from 'react';
import { manifestSchema } from '../data/schema';
import type { ModelManifest } from '../data/schema';
import { getVessel } from '../data/fleet';
import { fetchAssetBytes } from './request';
import { releasedManifests, yachtAssetResolver } from './yachts';

const cache = new Map<string, ModelManifest>();
export function useManifest(id: string, enabled = true) {
  const [data, setData] = useState<ModelManifest | null>(cache.get(id) ?? null);
  const [error, setError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setError(false);
    setData(cache.get(id) ?? null);
    if (!cache.has(id)) {
      const vessel = getVessel(id);
      const path = vessel.yacht?.manifest ?? `models/${id}.json`;
      fetchAssetBytes(yachtAssetResolver().resolve(path), { signal: controller.signal })
        .then(async bytes => {
          const expected=releasedManifests.find(manifest=>manifest.id===id);
          if(expected){
            const digest=await crypto.subtle.digest('SHA-256',bytes);
            const actual=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
            if(actual!==expected.sha256)throw new Error('Bundled manifest differs from its pinned release.');
          }
          const manifest = manifestSchema.parse(JSON.parse(new TextDecoder().decode(bytes)));
          if (manifest.vesselId !== id) throw new Error('Manifest belongs to a different vessel.');
          if (!controller.signal.aborted) { cache.set(id, manifest); setData(manifest); }
        }).catch(() => { if (!controller.signal.aborted) setError(true); });
    }
    return () => controller.abort();
  }, [id, enabled, retryTick]);
  return { data: enabled && data?.vesselId === id ? data : null, error: enabled && error, retry: () => setRetryTick(t => t + 1) };
}
