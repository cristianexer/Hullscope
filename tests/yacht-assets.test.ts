import { describe, expect, it } from 'vitest';
import { createAssetResolver } from '../src/assets/resolver';
import { fetchAssetBytes } from '../src/assets/request';

describe('versioned yacht asset delivery', () => {
  it('resolves local assets separately from the Pages application base', () => {
    const assets = createAssetResolver({ provider: 'local', baseUrl: 'http://localhost:5173/yacht-assets/' });
    expect(assets.resolve('models/princess-v55/exterior.lod1.glb')).toBe('http://localhost:5173/yacht-assets/models/princess-v55/exterior.lod1.glb');
  });
  it('pins public downloads to a full dataset revision without credentials', () => {
    const assets = createAssetResolver({ provider: 'huggingface', repository: 'example/hullscope-yachts', revision: '0123456789abcdef0123456789abcdef01234567' });
    expect(assets.resolve('models/sunseeker-55/exterior.lod0.glb')).toBe('https://huggingface.co/datasets/example/hullscope-yachts/resolve/0123456789abcdef0123456789abcdef01234567/models/sunseeker-55/exterior.lod0.glb');
  });
  it('rejects moving revisions and paths escaping the selected dataset', () => {
    expect(() => createAssetResolver({ provider: 'huggingface', repository: 'example/hullscope-yachts', revision: 'main' })).toThrow();
    const assets = createAssetResolver({ provider: 'local', baseUrl: '/yacht-assets/' });
    for (const path of ['../token', '/absolute', 'https://other.test/model.glb', '%2e%2e/token', 'a/../../b', 'a?token=secret', 'a\\b']) {
      expect(() => assets.resolve(path), path).toThrow();
    }
  });
});

describe('anonymous asset requests', () => {
  it('honors a rate-limit delay and returns the completed download', async () => {
    const waits: number[] = [];
    let attempts = 0;
    const result = await fetchAssetBytes('https://example.test/a.glb', {
      fetcher: async (_url, init) => {
        expect(init?.credentials).toBe('omit');
        return attempts++ === 0 ? new Response('', { status: 429, headers: { 'Retry-After': '2' } }) : new Response('glTF');
      },
      wait: async ms => { waits.push(ms); },
    });
    expect(new TextDecoder().decode(result)).toBe('glTF');
    expect(waits).toEqual([2000]);
  });
  it('does not retry missing assets or an aborted selection', async () => {
    let calls = 0;
    const fetcher = async () => { calls++; return new Response('', { status: 404 }); };
    await expect(fetchAssetBytes('https://example.test/missing', { fetcher })).rejects.toThrow('404');
    expect(calls).toBe(1);
    const controller = new AbortController();
    controller.abort();
    await expect(fetchAssetBytes('https://example.test/a', { fetcher, signal: controller.signal })).rejects.toThrow();
    expect(calls).toBe(1);
  });
  it('does not retry sooner than a long server-requested delay', async () => {
    await expect(fetchAssetBytes('https://example.test/a', {
      fetcher: async () => new Response('', { status: 429, headers: { 'Retry-After': '120' } }),
      wait: async () => { throw new Error('must not silently shorten retry delay'); },
    })).rejects.toMatchObject({ status: 429, retryAfterMs: 120000 });
  });
});
