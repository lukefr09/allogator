export interface PriceData {
  symbol: string;
  price: number;
  timestamp: string;
}

export interface PriceServiceConfig {
  apiKeys: string[];
  baseUrl?: string;
}

class PriceService {
  private cache: Map<string, { price: number; timestamp: string }> = new Map();
  private cacheTimeout = 60000; // 1 minute cache
  private apiKeys: string[];
  private currentKeyIndex = 0;
  private failedKeys: Set<number> = new Set();
  private baseUrl: string;
  
  constructor(config: PriceServiceConfig) {
    this.apiKeys = config.apiKeys.filter(key => key && key.trim() !== '');
    this.baseUrl = config.baseUrl || 'https://www.alphavantage.co/query';
    
    if (this.apiKeys.length === 0) {
      throw new Error('At least one valid API key is required');
    }
  }
  
  private getCurrentApiKey(): string {
    // Find next working key, skipping failed ones
    let attempts = 0;
    while (attempts < this.apiKeys.length) {
      if (!this.failedKeys.has(this.currentKeyIndex)) {
        return this.apiKeys[this.currentKeyIndex];
      }
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      attempts++;
    }
    
    // If all keys failed, reset failed keys and try again
    console.warn('All API keys failed, resetting and retrying...');
    this.failedKeys.clear();
    return this.apiKeys[this.currentKeyIndex];
  }
  
  private rotateToNextKey(): void {
    this.failedKeys.add(this.currentKeyIndex);
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    console.log(`Rotating to API key ${this.currentKeyIndex + 1}/${this.apiKeys.length}`);
  }
  
  async fetchPrice(symbol: string): Promise<PriceData | null> {
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.cacheTimeout) {
      return { symbol, price: cached.price, timestamp: cached.timestamp };
    }

    let lastError: Error | null = null;
    let attempts = 0;
    const maxAttempts = this.apiKeys.length;

    while (attempts < maxAttempts) {
      const currentKey = this.getCurrentApiKey();
      
      try {
        // Using Alpha Vantage API
        const response = await fetch(
          `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${currentKey}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for API error response
        if (data['Error Message']) {
          throw new Error(`API Error: ${data['Error Message']}`);
        }
        
        if (data['Note']) {
          // Rate limit hit, try next key
          this.rotateToNextKey();
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay before retry
          continue;
        }
        
        const quote = data['Global Quote'];
        if (!quote || !quote['05. price']) {
          throw new Error(`No price data found for symbol: ${symbol}`);
        }
        
        const price = parseFloat(quote['05. price']);
        const timestamp = new Date().toISOString();
        
        this.cache.set(symbol, { price, timestamp });
        
        return { symbol, price, timestamp };
      } catch (error) {
        lastError = error as Error;
        console.error(`Failed to fetch price for ${symbol} with key ${this.currentKeyIndex + 1}:`, error);
        
        // If it's a rate limit or API error, try next key
        if (error instanceof Error && (
          error.message.includes('Rate Limit') || 
          error.message.includes('API Error') ||
          error.message.includes('HTTP error')
        )) {
          this.rotateToNextKey();
          attempts++;
          continue;
        }
        
        // For other errors (network, parsing), don't rotate key
        break;
      }
    }

    console.error(`All API keys exhausted for symbol ${symbol}:`, lastError);
    return null;
  }

  async fetchMultiplePrices(symbols: string[]): Promise<Map<string, PriceData | null>> {
    const results = new Map<string, PriceData | null>();
    
    // Alpha Vantage free tier has rate limits, so we fetch sequentially with delays
    for (const symbol of symbols) {
      const priceData = await this.fetchPrice(symbol);
      results.set(symbol, priceData);
      
      // Add small delay to respect rate limits (5 API requests per minute for free tier)
      if (symbols.indexOf(symbol) < symbols.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 12000)); // 12 second delay
      }
    }
    
    return results;
  }

  clearCache() {
    this.cache.clear();
  }
}

// Load API keys from environment variables
const getApiKeys = (): string[] => {
  const keys = [];
  for (let i = 1; i <= 5; i++) {
    const key = import.meta.env[`VITE_ALPHA_VANTAGE_API_KEY_${i}`];
    if (key && key.trim() !== '') {
      keys.push(key.trim());
    }
  }
  return keys;
};

export const priceService = new PriceService({
  apiKeys: getApiKeys()
});