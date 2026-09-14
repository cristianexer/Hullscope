export type AssetLocation =
  | { provider: 'local'; baseUrl: string }
  | { provider: 'huggingface'; repository: string; revision: string };

/** Dataset-relative paths never accept origins, query strings or traversal. */
export function assertAssetPath(path: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(path) || path.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error(`Invalid dataset asset path: ${path}`);
  }
}

export function createAssetResolver(location: AssetLocation): { resolve: (path: string) => string } {
  let base: string;
  if (location.provider === 'huggingface') {
    if (!/^[\w-]+\/[\w.-]+$/.test(location.repository) || !/^[a-f0-9]{40}$/.test(location.revision)) {
      throw new Error('A dataset repository and full immutable commit SHA are required.');
    }
    base = `https://huggingface.co/datasets/${location.repository}/resolve/${location.revision}/`;
  } else {
    const url = new URL(location.baseUrl, 'http://localhost');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || location.baseUrl.startsWith('//')) {
      throw new Error('Local asset base must be a credential-free HTTP URL or absolute path.');
    }
    if (!location.baseUrl.startsWith('/') && !/^https?:\/\//.test(location.baseUrl)) throw new Error('Local asset base must be absolute.');
    base = location.baseUrl.replace(/\/$/, '') + '/';
  }
  return { resolve(path) { assertAssetPath(path); return base + path; } };
}
