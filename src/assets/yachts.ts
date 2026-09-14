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

/** Only the publisher's validated release snapshot becomes part of the fleet. */
export const releasedYachts: VesselRecord[] = release.vessels;
export const releasedManifests = release.manifests;
