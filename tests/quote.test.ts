import { describe, expect, it, vi } from 'vitest';
describe('quote adapter', () => {
  it('returns a helpful configuration error without attempting a request', async () => {
    const { getQuote } = await import('../server/quote');
    const request = vi.fn();
    const r = await getQuote('NO_KEY', {}, request);
    expect(r.status).toBe(400);
    const noKey = await getQuote('NOKEY', {}, request);
    expect(noKey.status).toBe(503);
    expect(request).not.toHaveBeenCalled();
  });
  it('preserves quote time and deduplicates then caches requests', async () => {
    const { getQuote } = await import('../server/quote');
    const t = Math.floor(Date.now() / 1000) - 86400;
    const request = vi.fn(
      async () => new Response(JSON.stringify({ c: 123.45, t })),
    );
    const [a, b] = await Promise.all([
      getQuote('CACHE', { FINNHUB_API_KEYS: 'test' }, request),
      getQuote('CACHE', { FINNHUB_API_KEYS: 'test' }, request),
    ]);
    expect(a).toEqual(b);
    expect(a.status).toBe(200);
    expect(a.body).toMatchObject({
      quoteTime: new Date(t * 1000).toISOString(),
    });
    await getQuote('CACHE', { FINNHUB_API_KEYS: 'test' }, request);
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('rejects invalid prices and keeps provider details out of errors', async () => {
    const { getQuote } = await import('../server/quote');
    const bad = await getQuote(
      'BADPRICE',
      { FINNHUB_API_KEYS: 'test' },
      async () => new Response(JSON.stringify({ c: -5, t: 123 })),
    );
    expect(bad.status).toBe(422);
    const failed = await getQuote(
      'FAIL',
      { FINNHUB_API_KEYS: 'test' },
      async () => {
        throw new Error('sensitive provider detail');
      },
    );
    expect(failed.status).toBe(504);
    expect(JSON.stringify(failed)).not.toContain('sensitive');
  });
  it('tries the next configured key after rate limiting', async () => {
    const { getQuote } = await import('../server/quote');
    const request = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ c: 10, t: Math.floor(Date.now() / 1000) }),
        ),
      );
    const result = await getQuote(
      'ROTATE',
      { FINNHUB_API_KEYS: 'first,second' },
      request,
    );
    expect(result.status).toBe(200);
    expect(request).toHaveBeenCalledTimes(2);
  });
});
