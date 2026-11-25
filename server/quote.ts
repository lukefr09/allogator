import type { Quote } from '../src/types.ts';
const cache = new Map<string, Quote>();
const pending = new Map<string, Promise<QuoteResult>>();
const clients = new Map<string, { count: number; reset: number }>();
export type QuoteResult = { status: number; body: Quote | { error: string } };
type Environment = Record<string, string | undefined>;

export async function getQuote(
  symbol: string,
  env: Environment,
  request = fetch,
): Promise<QuoteResult> {
  if (!/^[A-Z0-9][A-Z0-9.-]{0,29}$/.test(symbol)) {
    return {
      status: 400,
      body: {
        error:
          'Automatic quotes support stock and ETF tickers. Set other prices manually.',
      },
    };
  }
  const cached = cache.get(symbol);
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < 60_000)
    return { status: 200, body: cached };
  const existing = pending.get(symbol);
  if (existing) return existing;
  const keys = (env.FINNHUB_API_KEYS ?? env.FINNHUB_API_KEY ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  if (!keys.length)
    return {
      status: 503,
      body: {
        error: 'Automatic quotes are not configured. Enter a price manually.',
      },
    };
  const run = async (): Promise<QuoteResult> => {
    const signal = AbortSignal.timeout(6000);
    try {
      for (const key of keys) {
        const url = new URL('https://finnhub.io/api/v1/quote');
        url.searchParams.set('symbol', symbol);
        url.searchParams.set('token', key);
        const response = await request(url, { signal });
        if (response.status === 429) continue;
        if (!response.ok)
          return {
            status: 502,
            body: {
              error:
                'The quote provider is unavailable. Try again or enter a price.',
            },
          };
        const data = (await response.json()) as { c?: number; t?: number };
        if (
          typeof data.c !== 'number' ||
          !Number.isFinite(data.c) ||
          data.c <= 0 ||
          data.c > 1e9 ||
          typeof data.t !== 'number' ||
          !Number.isFinite(data.t) ||
          data.t <= 0 ||
          data.t * 1000 > Date.now() + 60_000
        ) {
          return {
            status: 422,
            body: {
              error:
                'No valid USD quote for this ticker. Check the symbol or set a price manually.',
            },
          };
        }
        const quote = {
          price: data.c,
          quoteTime: new Date(data.t * 1000).toISOString(),
          fetchedAt: new Date().toISOString(),
        };
        if (cache.size >= 500) cache.delete(cache.keys().next().value!);
        cache.set(symbol, quote);
        return { status: 200, body: quote };
      }
      return {
        status: 429,
        body: {
          error:
            'Quote capacity reached. Wait a minute or enter a price manually.',
        },
      };
    } catch {
      return {
        status: 504,
        body: {
          error:
            'The quote request did not complete. Try again or enter a price.',
        },
      };
    }
  };
  const task = run();
  pending.set(symbol, task);
  try {
    return await task;
  } finally {
    pending.delete(symbol);
  }
}

// Best-effort protection per server instance; deployment-wide quotas belong at the hosting layer.
export function allowQuoteRequest(client: string): boolean {
  const now = Date.now();
  for (const [key, item] of clients) if (item.reset <= now) clients.delete(key);
  const item = clients.get(client);
  if (item) return ++item.count <= 30;
  if (clients.size >= 1000) return false;
  clients.set(client, { count: 1, reset: now + 60_000 });
  return true;
}
