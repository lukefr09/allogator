import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  // Get API keys from environment variables
  const apiKeysString = process.env.FINNHUB_API_KEYS || process.env.VITE_FINNHUB_API_KEYS || '';
  const apiKeys = apiKeysString.split(',').map(key => key.trim()).filter(key => key);
  
  if (apiKeys.length === 0) {
    console.error('No API keys configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Try each API key until one works
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    const finnhubUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
    
    try {
      const response = await fetch(finnhubUrl);
      
      // If rate limited, try next key
      if (response.status === 429 && i < apiKeys.length - 1) {
        console.log(`API key ${i + 1} rate limited, trying next key...`);
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
      console.error(`Error with API key ${i + 1}:`, error);
      
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