import { allowQuoteRequest, getQuote } from '../server/quote';

interface Request {
  method?: string;
  query: { symbol?: string | string[] };
  headers: Record<string, string | string[] | undefined>;
}
interface Response {
  setHeader(name: string, value: string): void;
  status(code: number): Response;
  json(body: unknown): void;
}
export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Use GET to request a quote.' });
  }
  const client = String(
    req.headers['x-real-ip'] ?? req.headers['x-forwarded-for'] ?? 'unknown',
  ).split(',')[0];
  if (!allowQuoteRequest(client)) {
    res.setHeader('Retry-After', '60');
    return res
      .status(429)
      .json({ error: 'Too many quote requests. Try again in a minute.' });
  }
  if (typeof req.query.symbol !== 'string')
    return res.status(400).json({ error: 'Enter a stock ticker.' });
  const result = await getQuote(
    req.query.symbol.trim().toUpperCase(),
    process.env,
  );
  return res.status(result.status).json(result.body);
}
