export interface PriceData {
  symbol: string;
  price: number;
  timestamp: string;
}

export interface PriceServiceConfig {
  apiKey: string;
  baseUrl?: string;
}

class PriceService {
  private cache: Map<string, { price: number; timestamp: string }> = new Map();
  private cacheTimeout = 300000; // 5 minute cache (shorter since we have better rate limits)
  private apiKey: string;
  private baseUrl: string;
  private requestQueue: Promise<any> = Promise.resolve();
  private lastRequestTime = 0;
  private minRequestInterval = 1100; // 1.1 seconds between requests to avoid rate limits
  
  constructor(config: PriceServiceConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://finnhub.io/api/v1';
    
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('A valid API key is required');
    }
  }
  
  
  async fetchPrice(symbol: string): Promise<PriceData | null> {
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.cacheTimeout) {
      return { symbol, price: cached.price, timestamp: cached.timestamp };
    }

    // Queue the request to avoid rate limits
    return this.requestQueue = this.requestQueue.then(async () => {
      // Check cache again in case another request already fetched it
      const cachedAgain = this.cache.get(symbol);
      if (cachedAgain && Date.now() - new Date(cachedAgain.timestamp).getTime() < this.cacheTimeout) {
        return { symbol, price: cachedAgain.price, timestamp: cachedAgain.timestamp };
      }

      // Enforce minimum time between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
      }

      const url = `${this.baseUrl}/quote?symbol=${encodeURIComponent(symbol)}&token=${this.apiKey}`;
      
      try {
        this.lastRequestTime = Date.now();
        const response = await fetch(url);
        
        if (response.status === 429) {
          throw new Error('Price API temporarily at capacity. Please enter prices manually or try again in a few minutes.');
        }
        
        if (response.status >= 500) {
          throw new Error('Price API temporarily unavailable. Please enter prices manually or try again in a few minutes.');
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for API error response
        if (data.error) {
          throw new Error(`API Error: ${data.error}`);
        }
        
        // Finnhub returns current price in 'c' field
        if (data.c === undefined || data.c === null || data.c === 0) {
          throw new Error(`No valid price data found for symbol: ${symbol}`);
        }
        
        const price = parseFloat(data.c.toString());
        const timestamp = new Date().toISOString();
        
        this.cache.set(symbol, { price, timestamp });
        
        return { symbol, price, timestamp };
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
        return null;
      }
    });
  }

  async fetchMultiplePrices(symbols: string[]): Promise<Map<string, PriceData | null>> {
    const results = new Map<string, PriceData | null>();
    
    // Fetch prices sequentially through the queue to avoid rate limits
    for (const symbol of symbols) {
      const priceData = await this.fetchPrice(symbol);
      results.set(symbol, priceData);
    }
    
    return results;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const priceService = new PriceService({
  apiKey: import.meta.env.VITE_FINNHUB_API_KEY || ''
});