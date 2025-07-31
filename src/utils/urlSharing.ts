import { Asset } from '../types';

// Define types for encoded data
interface EncodedAsset {
  s: string;
  v: number;
  t: number;
  p?: number;
  sh?: number;
}

interface EncodedPortfolio {
  assets: EncodedAsset[];
  m: number;
}

// Validation helper
const isValidAsset = (asset: any): asset is EncodedAsset => {
  if (!asset || typeof asset !== 'object') return false;
  
  // Validate types
  if (typeof asset.s !== 'string' || 
      typeof asset.v !== 'number' || 
      typeof asset.t !== 'number') {
    return false;
  }
  
  // Validate ranges
  if (asset.s.length > 12 || asset.s.length === 0) return false;
  if (asset.v < 0 || asset.v > 1000000000) return false; // Max $1B
  if (asset.t < 0 || asset.t > 1) return false;
  if (asset.p !== undefined && (typeof asset.p !== 'number' || asset.p < 0)) return false;
  if (asset.sh !== undefined && (typeof asset.sh !== 'number' || asset.sh < 0)) return false;
  
  // Validate symbol format
  if (!/^[A-Z0-9\-\.]{1,12}$/.test(asset.s)) return false;
  
  return true;
};

export const encodePortfolioToUrl = (assets: Asset[], newMoney: number): string => {
  const data = {
    assets: assets.map(a => ({
      s: a.symbol,
      v: a.currentValue,
      t: a.targetPercentage,
      p: a.currentPrice,
      sh: a.shares
    })),
    m: newMoney
  };
  
  const encoded = btoa(JSON.stringify(data));
  return `${window.location.origin}${window.location.pathname}?p=${encoded}`;
};

export const decodePortfolioFromUrl = (): { assets: Asset[], newMoney: number } | null => {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('p');
  
  if (!encoded) return null;
  
  try {
    const decoded = JSON.parse(atob(encoded)) as EncodedPortfolio;
    
    // Validate structure
    if (!decoded || typeof decoded !== 'object' || !Array.isArray(decoded.assets)) {
      throw new Error('Invalid portfolio structure');
    }
    
    // Validate new money
    if (typeof decoded.m !== 'number' || decoded.m < 0 || decoded.m > 1000000000) {
      throw new Error('Invalid new money amount');
    }
    
    // Validate and sanitize assets
    const assets = decoded.assets
      .filter(isValidAsset)
      .slice(0, 20) // Max 20 assets
      .map((a: EncodedAsset) => ({
        symbol: a.s.trim().toUpperCase(),
        currentValue: Math.max(0, Math.min(1000000000, a.v)),
        targetPercentage: Math.max(0, Math.min(1, a.t)),
        currentPrice: a.p ? Math.max(0, a.p) : undefined,
        shares: a.sh ? Math.max(0, a.sh) : undefined
      }));
    
    if (assets.length === 0) {
      throw new Error('No valid assets found');
    }
    
    return {
      assets,
      newMoney: Math.max(0, Math.min(1000000000, decoded.m))
    };
  } catch (error) {
    // Silent fail - don't log errors to console
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