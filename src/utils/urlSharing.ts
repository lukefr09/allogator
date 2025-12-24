import { Asset } from '../types';
import { LIMITS } from '../constants';

interface EncodedAsset {
  s: string;
  v: number;
  t: number;
  p?: number;
  sh?: number;
  ns?: boolean;
}

interface EncodedPortfolio {
  assets: EncodedAsset[];
  m: number;
  es?: boolean;
}

const isValidAsset = (asset: unknown): asset is EncodedAsset => {
  if (!asset || typeof asset !== 'object') return false;

  const a = asset as Record<string, unknown>;

  if (typeof a.s !== 'string' ||
      typeof a.v !== 'number' ||
      typeof a.t !== 'number') {
    return false;
  }

  if (a.s.length > LIMITS.MAX_SYMBOL_LENGTH || a.s.length === 0) return false;
  if (a.v < 0 || a.v > LIMITS.MAX_PORTFOLIO_VALUE) return false;
  if (a.t < 0 || a.t > 1) return false;
  if (a.p !== undefined && (typeof a.p !== 'number' || a.p < 0)) return false;
  if (a.sh !== undefined && (typeof a.sh !== 'number' || a.sh < 0)) return false;
  if (a.ns !== undefined && typeof a.ns !== 'boolean') return false;

  if (!/^[A-Z0-9\-.:]{1,30}$/.test(a.s)) return false;

  return true;
};

export const encodePortfolioToUrl = (assets: Asset[], newMoney: number, enableSelling: boolean = false): string => {
  const data: EncodedPortfolio = {
    assets: assets.map(a => {
      const encoded: EncodedAsset = {
        s: a.symbol,
        v: a.currentValue,
        t: a.targetPercentage
      };
      if (a.currentPrice !== undefined) encoded.p = a.currentPrice;
      if (a.shares !== undefined) encoded.sh = a.shares;
      if (a.noSell) encoded.ns = true; // Only include if true to save space
      return encoded;
    }),
    m: newMoney
  };
  
  // Only include enableSelling if true to save space
  if (enableSelling) {
    data.es = true;
  }
  
  const encoded = btoa(JSON.stringify(data));
  return `${window.location.origin}${window.location.pathname}?p=${encoded}`;
};

export const decodePortfolioFromUrl = (): { assets: Asset[], newMoney: number, enableSelling: boolean } | null => {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('p');
  
  if (!encoded) return null;
  
  try {
    const decoded = JSON.parse(atob(encoded)) as EncodedPortfolio;
    
    // Validate structure
    if (!decoded || typeof decoded !== 'object' || !Array.isArray(decoded.assets)) {
      throw new Error('Invalid portfolio structure');
    }
    
    if (typeof decoded.m !== 'number' || decoded.m < 0 || decoded.m > LIMITS.MAX_PORTFOLIO_VALUE) {
      throw new Error('Invalid new money amount');
    }

    const enableSelling = decoded.es === true;

    const assets = decoded.assets
      .filter(isValidAsset)
      .slice(0, LIMITS.MAX_ASSETS)
      .map((a: EncodedAsset) => ({
        symbol: a.s.trim().toUpperCase(),
        currentValue: Math.max(0, Math.min(LIMITS.MAX_PORTFOLIO_VALUE, a.v)),
        targetPercentage: Math.max(0, Math.min(1, a.t)),
        currentPrice: a.p ? Math.max(0, a.p) : undefined,
        shares: a.sh ? Math.max(0, a.sh) : undefined,
        noSell: a.ns === true
      }));

    if (assets.length === 0) {
      throw new Error('No valid assets found');
    }

    return {
      assets,
      newMoney: Math.max(0, Math.min(LIMITS.MAX_PORTFOLIO_VALUE, decoded.m)),
      enableSelling
    };
  } catch (error) {
    if (error instanceof Error) {
      console.warn('[URLSharing] Failed to decode portfolio URL:', error.message);
    } else {
      console.warn('[URLSharing] Failed to decode portfolio URL:', error);
    }
    return null;
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Silent fail - clipboard access denied
    return false;
  }
};