import releaseData from '../data/yachts/release.json' with { type: 'json' };
import { createAssetResolver } from './resolver';
import type { VesselRecord } from '../data/schema';
import { parseYachtRelease } from '../data/yachts/releaseSchema';

const release=parseYachtRelease(releaseData,import.meta.env?.DEV===true);

export function yachtAssetResolver() {
  if (release.repository && release.revision) {
    return createAssetResolver({ provider: 'huggingface', repository: release.repository, revision: release.revision });
  }
  return createAssetResolver({ provider: 'local', baseUrl: `${import.meta.env.BASE_URL}yacht-assets/` });
}

/** Manifests bundled from the pinned release stay readable when the Hub is offline. */
export function vesselManifestUrl(vessel: VesselRecord) {
  const path = vessel.yacht?.manifest ?? `models/${vessel.id}.json`;
  if (vessel.yacht && !release.manifests.some(manifest => manifest.id === vessel.id)) {
    return yachtAssetResolver().resolve(path);
  }
  return `${import.meta.env.BASE_URL}${path}`;
}

/** Published draft snapshots retain their reconstruction disclosures. */
export const releasedYachts: VesselRecord[] = release.vessels;
export const releasedManifests = release.manifests;
export const yachtReleaseStatus = release.status;
