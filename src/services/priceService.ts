import type { Quote } from '../types';
import { isBounded } from '../utils/validation';

export async function fetchQuote(
  symbol: string,
  signal: AbortSignal,
): Promise<Quote> {
  const response = await fetch(
    '/api/quote?symbol=' + encodeURIComponent(symbol),
    {
      signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    },
  );
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('Quotes are unavailable. You can enter a price manually.');
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(
      'The provider returned an invalid quote. Enter a price manually.',
    );
  }
  const result = data as Partial<Quote> & { error?: string };
  if (!response.ok)
    throw new Error(
      result.error || 'Could not load a quote. Try again or set a price.',
    );
  if (
    !isBounded(result.price) ||
    result.price <= 0 ||
    typeof result.quoteTime !== 'string' ||
    !Number.isFinite(Date.parse(result.quoteTime)) ||
    typeof result.fetchedAt !== 'string' ||
    !Number.isFinite(Date.parse(result.fetchedAt))
  ) {
    throw new Error(
      'The provider returned an invalid quote. Enter a price manually.',
    );
  }
  return result as Quote;
}
