import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configure CORS with specific allowed origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://allogator.vercel.app',
    'https://portfolio-rebalancer.vercel.app',
    'http://localhost:5173', // for development
    'http://localhost:4173'  // for preview
  ];

  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Allow requests with no origin (like curl/Postman)
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;

  // Enhanced symbol validation - allow colons for exchange:symbol format
  const VALID_SYMBOL_REGEX = /^[A-Z0-9\-\.:]{1,30}$/;
  const BLOCKED_PATTERNS = ['SCRIPT', 'EVAL', 'FUNCTION', 'JAVASCRIPT', 'VBSCRIPT'];

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const sanitizedSymbol = symbol.trim().toUpperCase();

  if (!VALID_SYMBOL_REGEX.test(sanitizedSymbol)) {
    return res.status(400).json({ error: 'Invalid symbol format' });
  }

  if (BLOCKED_PATTERNS.some(pattern => sanitizedSymbol.includes(pattern))) {
    return res.status(400).json({ error: 'Invalid symbol' });
  }

  // Get API keys from environment variables
  const apiKeysString = process.env.FINNHUB_API_KEYS || process.env.VITE_FINNHUB_API_KEYS || '';
  const apiKeys = apiKeysString.split(',').map(key => key.trim()).filter(key => key);
  
  if (apiKeys.length === 0) {
    // No API keys configured
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Try each API key until one works
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    const finnhubUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sanitizedSymbol)}&token=${apiKey}`;
    
    try {
      const response = await fetch(finnhubUrl);
      
      // If rate limited, try next key
      if (response.status === 429 && i < apiKeys.length - 1) {
        // Rate limited, try next key
        continue;
      }
      
      // For other errors or success, return the response
      const data = await response.json();
      
      // Add cache headers for successful responses
      if (response.ok) {
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
      }
      
      return res.status(response.status).json(data);
    } catch (error) {
      // Error with current API key
      
      // If this was the last key, return error
      if (i === apiKeys.length - 1) {
        return res.status(500).json({ 
          error: 'Failed to fetch price data',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
  
  // Should not reach here, but just in case
  return res.status(500).json({ error: 'All API keys exhausted' });
}