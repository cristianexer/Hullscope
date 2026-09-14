export class AssetRequestError extends Error {
  constructor(message: string, readonly status?: number, readonly retryAfterMs?: number) { super(message); }
}

type Options = {
  signal?: AbortSignal;
  fetcher?: typeof fetch;
  wait?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  timeoutMs?: number;
};

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const aborted = () => { clearTimeout(timer); reject(signal?.reason); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', aborted); resolve(); }, milliseconds);
    signal?.addEventListener('abort', aborted, { once: true });
  });
}

/** Anonymous requests; at most three attempts. Cancellation also covers body reads. */
export async function fetchAssetBytes(url: string, options: Options = {}): Promise<ArrayBuffer> {
  const { signal, fetcher = fetch, wait = delay, timeoutMs = 30000 } = options;
  for (let attempt = 0; attempt < 3; attempt++) {
    signal?.throwIfAborted();
    const controller = new AbortController();
    const cancel = () => controller.abort(signal?.reason);
    signal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(() => controller.abort(new DOMException('Asset request timed out', 'TimeoutError')), timeoutMs);
    let retryDelay = 500 * 2 ** attempt;
    try {
      const response = await fetcher(url, { signal: controller.signal, credentials: 'omit', mode: 'cors' });
      if (response.ok) return await response.arrayBuffer();
      const retry = response.headers.get('Retry-After');
      if (retry) {
        const seconds = Number(retry);
        const parsed = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retry) - Date.now();
        if (Number.isFinite(parsed)) retryDelay = Math.max(retryDelay, parsed);
      }
      await response.body?.cancel();
      const error = new AssetRequestError(`Asset unavailable: HTTP ${response.status}`, response.status, retryDelay);
      if (![429, 502, 503, 504].includes(response.status) || attempt === 2 || retryDelay > 30000) throw error;
    } catch (error) {
      signal?.throwIfAborted();
      if (error instanceof AssetRequestError || attempt === 2) throw error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
    }
    await wait(retryDelay, signal);
  }
  throw new AssetRequestError('Asset request failed.');
}
