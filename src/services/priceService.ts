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

    const url = `${this.baseUrl}/quote?symbol=${encodeURIComponent(symbol)}&token=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check for API error response
      if (data.error) {
        throw new Error(`API Error: ${data.error}`);
      }
      
      // Finnhub returns current price in 'c' field
      if (data.c === undefined || data.c === null) {
        throw new Error(`No price data found for symbol: ${symbol}`);
      }
      
      const price = parseFloat(data.c.toString());
      const timestamp = new Date().toISOString();
      
      this.cache.set(symbol, { price, timestamp });
      
      return { symbol, price, timestamp };
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
      return null;
    }
  }

  async fetchMultiplePrices(symbols: string[]): Promise<Map<string, PriceData | null>> {
    const results = new Map<string, PriceData | null>();
    
    // Finnhub allows 60 calls per minute, so we can fetch in parallel with small delays
    const promises = symbols.map(async (symbol, index) => {
      // Small staggered delay to avoid hitting rate limits
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, index * 100)); // 100ms stagger
      }
      const priceData = await this.fetchPrice(symbol);
      return { symbol, priceData };
    });
    
    const responses = await Promise.all(promises);
    responses.forEach(({ symbol, priceData }) => {
      results.set(symbol, priceData);
    });
    
    return results;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const priceService = new PriceService({
  apiKey: import.meta.env.VITE_FINNHUB_API_KEY || ''
});