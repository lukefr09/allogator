export interface PriceData {
  symbol: string;
  price: number;
  timestamp: string;
}

export interface PriceServiceConfig {
  apiKey?: string;
  apiKeys?: string[];
  baseUrl?: string;
}

class PriceService {
  private cache: Map<string, { price: number; timestamp: string }> = new Map();
  private cacheTimeout = 300000; // 5 minute cache (shorter since we have better rate limits)
  private apiKeys: string[];
  private currentKeyIndex = 0;
  private baseUrl: string;
  private requestQueue: Promise<any> = Promise.resolve();
  private lastRequestTime = 0;
  private minRequestInterval = 1100; // 1.1 seconds between requests to avoid rate limits
  
  constructor(config: PriceServiceConfig) {
    if (config.apiKeys && config.apiKeys.length > 0) {
      this.apiKeys = config.apiKeys.filter(key => key && key.trim() !== '');
    } else if (config.apiKey && config.apiKey.trim() !== '') {
      this.apiKeys = [config.apiKey];
    } else {
      this.apiKeys = [];
    }
    
    this.baseUrl = config.baseUrl || 'https://finnhub.io/api/v1';
    
    if (this.apiKeys.length === 0) {
      throw new Error('At least one valid API key is required');
    }
  }
  
  private getCurrentApiKey(): string {
    return this.apiKeys[this.currentKeyIndex];
  }
  
  private rotateApiKey(): void {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
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

      const url = `${this.baseUrl}/quote?symbol=${encodeURIComponent(symbol)}&token=${this.getCurrentApiKey()}`;
      
      try {
        this.lastRequestTime = Date.now();
        const response = await fetch(url);
        
        if (response.status === 429) {
          if (this.apiKeys.length > 1) {
            console.log(`API key ${this.currentKeyIndex + 1} rate limited, rotating to next key...`);
            this.rotateApiKey();
            return this.fetchPrice(symbol);
          }
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

const apiKeys: string[] = [];

// Support multiple API keys via comma-separated values
if (import.meta.env.VITE_FINNHUB_API_KEYS) {
  apiKeys.push(...import.meta.env.VITE_FINNHUB_API_KEYS.split(',').map((key: string) => key.trim()));
}

// Also support single API key for backward compatibility
if (import.meta.env.VITE_FINNHUB_API_KEY) {
  apiKeys.push(import.meta.env.VITE_FINNHUB_API_KEY);
}

export const priceService = new PriceService({
  apiKeys: apiKeys.length > 0 ? apiKeys : undefined,
  apiKey: apiKeys.length === 0 ? '' : undefined
});