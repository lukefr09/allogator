// Mapping of crypto aliases to their exchange symbols
export const cryptoAliases: Record<string, { binance?: string; coinbase?: string; name: string }> = {
  // Top 100 cryptocurrencies
  'BTC': { binance: 'BINANCE:BTCUSDT', coinbase: 'COINBASE:BTC-USD', name: 'Bitcoin' },
  'ETH': { binance: 'BINANCE:ETHUSDT', coinbase: 'COINBASE:ETH-USD', name: 'Ethereum' },
  'XRP': { binance: 'BINANCE:XRPUSDT', coinbase: 'COINBASE:XRP-USD', name: 'XRP' },
  'USDT': { binance: 'BINANCE:USDTUSDT', name: 'Tether' },
  'BNB': { binance: 'BINANCE:BNBUSDT', name: 'BNB' },
  'SOL': { binance: 'BINANCE:SOLUSDT', coinbase: 'COINBASE:SOL-USD', name: 'Solana' },
  'USDC': { binance: 'BINANCE:USDCUSDT', coinbase: 'COINBASE:USDC-USD', name: 'USDC' },
  'DOGE': { binance: 'BINANCE:DOGEUSDT', coinbase: 'COINBASE:DOGE-USD', name: 'Dogecoin' },
  'TRX': { binance: 'BINANCE:TRXUSDT', name: 'TRON' },
  'ADA': { binance: 'BINANCE:ADAUSDT', coinbase: 'COINBASE:ADA-USD', name: 'Cardano' },
  'HYPE': { binance: 'BINANCE:HYPEUSDT', name: 'Hyperliquid' },
  'SUI': { binance: 'BINANCE:SUIUSDT', coinbase: 'COINBASE:SUI-USD', name: 'Sui' },
  'XLM': { binance: 'BINANCE:XLMUSDT', coinbase: 'COINBASE:XLM-USD', name: 'Stellar' },
  'LINK': { binance: 'BINANCE:LINKUSDT', coinbase: 'COINBASE:LINK-USD', name: 'Chainlink' },
  'HBAR': { binance: 'BINANCE:HBARUSDT', coinbase: 'COINBASE:HBAR-USD', name: 'Hedera' },
  'BCH': { binance: 'BINANCE:BCHUSDT', coinbase: 'COINBASE:BCH-USD', name: 'Bitcoin Cash' },
  'AVAX': { binance: 'BINANCE:AVAXUSDT', coinbase: 'COINBASE:AVAX-USD', name: 'Avalanche' },
  'LTC': { binance: 'BINANCE:LTCUSDT', coinbase: 'COINBASE:LTC-USD', name: 'Litecoin' },
  'LEO': { binance: 'BINANCE:LEOUSDT', name: 'UNUS SED LEO' },
  'TON': { binance: 'BINANCE:TONUSDT', name: 'Toncoin' },
  'SHIB': { binance: 'BINANCE:SHIBUSDT', coinbase: 'COINBASE:SHIB-USD', name: 'Shiba Inu' },
  'USDE': { binance: 'BINANCE:USDEUSDT', name: 'Ethena USDe' },
  'UNI': { binance: 'BINANCE:UNIUSDT', coinbase: 'COINBASE:UNI-USD', name: 'Uniswap' },
  'DOT': { binance: 'BINANCE:DOTUSDT', coinbase: 'COINBASE:DOT-USD', name: 'Polkadot' },
  'XMR': { binance: 'BINANCE:XMRUSDT', name: 'Monero' },
  'DAI': { binance: 'BINANCE:DAIUSDT', coinbase: 'COINBASE:DAI-USD', name: 'Dai' },
  'BGB': { binance: 'BINANCE:BGBUSDT', name: 'Bitget Token' },
  'PEPE': { binance: 'BINANCE:PEPEUSDT', name: 'Pepe' },
  'CRO': { binance: 'BINANCE:CROUSDT', name: 'Cronos' },
  'AAVE': { binance: 'BINANCE:AAVEUSDT', coinbase: 'COINBASE:AAVE-USD', name: 'Aave' },
  'ENA': { binance: 'BINANCE:ENAUSDT', name: 'Ethena' },
  'TAO': { binance: 'BINANCE:TAOUSDT', name: 'Bittensor' },
  'NEAR': { binance: 'BINANCE:NEARUSDT', coinbase: 'COINBASE:NEAR-USD', name: 'NEAR Protocol' },
  'ETC': { binance: 'BINANCE:ETCUSDT', coinbase: 'COINBASE:ETC-USD', name: 'Ethereum Classic' },
  'PI': { binance: 'BINANCE:PIUSDT', name: 'Pi' },
  'ONDO': { binance: 'BINANCE:ONDOUSDT', name: 'Ondo' },
  'ICP': { binance: 'BINANCE:ICPUSDT', coinbase: 'COINBASE:ICP-USD', name: 'Internet Computer' },
  'OKB': { binance: 'BINANCE:OKBUSDT', name: 'OKB' },
  'MNT': { binance: 'BINANCE:MNTUSDT', name: 'Mantle' },
  'APT': { binance: 'BINANCE:APTUSDT', coinbase: 'COINBASE:APT-USD', name: 'Aptos' },
  'KAS': { binance: 'BINANCE:KASUSDT', name: 'Kaspa' },
  'BONK': { binance: 'BINANCE:BONKUSDT', coinbase: 'COINBASE:BONK-USD', name: 'Bonk' },
  'PENGU': { binance: 'BINANCE:PENGUUSDT', name: 'Pudgy Penguins' },
  'POL': { binance: 'BINANCE:POLUSDT', coinbase: 'COINBASE:POL-USD', name: 'POL (prev. MATIC)' },
  'ALGO': { binance: 'BINANCE:ALGOUSDT', coinbase: 'COINBASE:ALGO-USD', name: 'Algorand' },
  'ARB': { binance: 'BINANCE:ARBUSDT', coinbase: 'COINBASE:ARB-USD', name: 'Arbitrum' },
  'USD1': { binance: 'BINANCE:USD1USDT', name: 'World Liberty Financial USD' },
  'GT': { binance: 'BINANCE:GTUSDT', name: 'GateToken' },
  'VET': { binance: 'BINANCE:VETUSDT', name: 'VeChain' },
  'RENDER': { binance: 'BINANCE:RENDERUSDT', coinbase: 'COINBASE:RENDER-USD', name: 'Render' },
  'SPX': { binance: 'BINANCE:SPXUSDT', name: 'SPX6900' },
  'WLD': { binance: 'BINANCE:WLDUSDT', coinbase: 'COINBASE:WLD-USD', name: 'Worldcoin' },
  'SEI': { binance: 'BINANCE:SEIUSDT', coinbase: 'COINBASE:SEI-USD', name: 'Sei' },
  'TRUMP': { binance: 'BINANCE:TRUMPUSDT', name: 'OFFICIAL TRUMP' },
  'SKY': { binance: 'BINANCE:SKYUSDT', name: 'Sky' },
  'ATOM': { binance: 'BINANCE:ATOMUSDT', coinbase: 'COINBASE:ATOM-USD', name: 'Cosmos' },
  'FIL': { binance: 'BINANCE:FILUSDT', coinbase: 'COINBASE:FIL-USD', name: 'Filecoin' },
  'FLR': { binance: 'BINANCE:FLRUSDT', name: 'Flare' },
  'IP': { binance: 'BINANCE:IPUSDT', name: 'Story' },
  'FET': { binance: 'BINANCE:FETUSDT', coinbase: 'COINBASE:FET-USD', name: 'Artificial Superintelligence Alliance' },
  'JUP': { binance: 'BINANCE:JUPUSDT', coinbase: 'COINBASE:JUP-USD', name: 'Jupiter' },
  'INJ': { binance: 'BINANCE:INJUSDT', coinbase: 'COINBASE:INJ-USD', name: 'Injective' },
  'QNT': { binance: 'BINANCE:QNTUSDT', coinbase: 'COINBASE:QNT-USD', name: 'Quant' },
  'XDC': { binance: 'BINANCE:XDCUSDT', name: 'XDC Network' },
  'KCS': { binance: 'BINANCE:KCSUSDT', name: 'KuCoin Token' },
  'TIA': { binance: 'BINANCE:TIAUSDT', coinbase: 'COINBASE:TIA-USD', name: 'Celestia' },
  'FDUSD': { binance: 'BINANCE:FDUSDUSDT', name: 'First Digital USD' },
  'CRV': { binance: 'BINANCE:CRVUSDT', coinbase: 'COINBASE:CRV-USD', name: 'Curve DAO Token' },
  'CFX': { binance: 'BINANCE:CFXUSDT', name: 'Conflux' },
  'OP': { binance: 'BINANCE:OPUSDT', coinbase: 'COINBASE:OP-USD', name: 'Optimism' },
  'FORM': { binance: 'BINANCE:FORMUSDT', name: 'Four' },
  'STX': { binance: 'BINANCE:STXUSDT', coinbase: 'COINBASE:STX-USD', name: 'Stacks' },
  'FARTCOIN': { binance: 'BINANCE:FARTCOINUSDT', name: 'Fartcoin' },
  'FLOKI': { binance: 'BINANCE:FLOKIUSDT', name: 'FLOKI' },
  'IMX': { binance: 'BINANCE:IMXUSDT', coinbase: 'COINBASE:IMX-USD', name: 'Immutable' },
  'ENS': { binance: 'BINANCE:ENSUSDT', coinbase: 'COINBASE:ENS-USD', name: 'Ethereum Name Service' },
  'WIF': { binance: 'BINANCE:WIFUSDT', name: 'dogwifhat' },
  'GRT': { binance: 'BINANCE:GRTUSDT', coinbase: 'COINBASE:GRT-USD', name: 'The Graph' },
  'CAKE': { binance: 'BINANCE:CAKEUSDT', name: 'PancakeSwap' },
  'KAIA': { binance: 'BINANCE:KAIAUSDT', name: 'Kaia' },
  'LDO': { binance: 'BINANCE:LDOUSDT', coinbase: 'COINBASE:LDO-USD', name: 'Lido DAO' },
  'VIRTUAL': { binance: 'BINANCE:VIRTUALUSDT', name: 'Virtuals Protocol' },
  'PAXG': { binance: 'BINANCE:PAXGUSDT', name: 'PAX Gold' },
  'PYUSD': { binance: 'BINANCE:PYUSDUSDT', name: 'PayPal USD' },
  'XTZ': { binance: 'BINANCE:XTZUSDT', coinbase: 'COINBASE:XTZ-USD', name: 'Tezos' },
  'S': { binance: 'BINANCE:SUSDT', name: 'Sonic' },
  'THETA': { binance: 'BINANCE:THETAUSDT', name: 'Theta Network' },
  'A': { binance: 'BINANCE:AUSDT', name: 'Vaulta' },
  'PUMP': { binance: 'BINANCE:PUMPUSDT', name: 'Pump.fun' },
  'RAY': { binance: 'BINANCE:RAYUSDT', coinbase: 'COINBASE:RAY-USD', name: 'Raydium' },
  'NEXO': { binance: 'BINANCE:NEXOUSDT', name: 'Nexo' },
  'JASMY': { binance: 'BINANCE:JASMYUSDT', coinbase: 'COINBASE:JASMY-USD', name: 'JasmyCoin' },
  'IOTA': { binance: 'BINANCE:IOTAUSDT', name: 'IOTA' },
  'XAUT': { binance: 'BINANCE:XAUTUSDT', name: 'Tether Gold' },
  'GALA': { binance: 'BINANCE:GALAUSDT', coinbase: 'COINBASE:GALA-USD', name: 'Gala' },
  'SAND': { binance: 'BINANCE:SANDUSDT', coinbase: 'COINBASE:SAND-USD', name: 'The Sandbox' },
  'PYTH': { binance: 'BINANCE:PYTHUSDT', coinbase: 'COINBASE:PYTH-USD', name: 'Pyth Network' },
  'PENDLE': { binance: 'BINANCE:PENDLEUSDT', name: 'Pendle' },
  'AERO': { binance: 'BINANCE:AEROUSDT', name: 'Aerodrome Finance' },
  'JTO': { binance: 'BINANCE:JTOUSDT', coinbase: 'COINBASE:JTO-USD', name: 'Jito' }
};

// Check if a symbol might be both a stock and crypto
export const ambiguousSymbols = new Set([
  'BTC', 'ETH', // Can be crypto ETFs or actual crypto
  'A', 'S', 'IP', 'GT', 'LEO', 'LINK', 'SKY', 'FORM', 'PI'
]);

export function getCryptoSymbol(alias: string, exchange: 'binance' | 'coinbase' = 'binance'): string | null {
  const upperAlias = alias.toUpperCase();
  const crypto = cryptoAliases[upperAlias];
  
  if (!crypto) return null;
  
  if (exchange === 'coinbase' && crypto.coinbase) {
    return crypto.coinbase;
  }
  
  return crypto.binance || null;
}

export function isCryptoAlias(symbol: string): boolean {
  return symbol.toUpperCase() in cryptoAliases;
}

export function isAmbiguousSymbol(symbol: string): boolean {
  return ambiguousSymbols.has(symbol.toUpperCase());
}