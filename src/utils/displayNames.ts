export function getDisplayName(symbol: string): string {
  // If it's an exchange format like BINANCE:BTCUSDT or COINBASE:BTC-USD
  if (symbol.includes(':')) {
    const parts = symbol.split(':');
    if (parts.length === 2) {
      const [exchange, pair] = parts;
      
      // For Binance pairs ending in USDT
      if (exchange === 'BINANCE' && pair.endsWith('USDT')) {
        return pair.replace('USDT', '');
      }
      
      // For Coinbase pairs ending in -USD
      if (exchange === 'COINBASE' && pair.endsWith('-USD')) {
        return pair.replace('-USD', '');
      }
      
      return pair;
    }
  }

  return symbol;
}