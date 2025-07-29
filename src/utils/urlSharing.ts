import { Asset } from '../types';

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
    const decoded = JSON.parse(atob(encoded));
    const assets = decoded.assets.map((a: any) => ({
      symbol: a.s || '',
      currentValue: a.v || 0,
      targetPercentage: a.t || 0,
      currentPrice: a.p,
      shares: a.sh
    }));
    
    return {
      assets,
      newMoney: decoded.m || 1000
    };
  } catch (error) {
    console.error('Failed to decode portfolio from URL:', error);
    return null;
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};