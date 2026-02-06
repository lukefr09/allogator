import { Asset } from '../types';
import { PriceData } from '../services/priceService';
import { PRECISION } from '../constants';

export function calculateSharesFromValue(value: number, price: number): number {
  if (price <= 0) return 0;
  return Math.round((value / price) * PRECISION.SHARE_MULTIPLIER) / PRECISION.SHARE_MULTIPLIER;
}

export function calculateValueFromShares(shares: number, price: number): number {
  if (price <= 0) return 0;
  return Math.round(shares * price * PRECISION.MONEY_MULTIPLIER) / PRECISION.MONEY_MULTIPLIER;
}

export function applyPriceToAsset(asset: Asset, priceData: PriceData): Asset {
  const updated: Asset = {
    ...asset,
    currentPrice: priceData.price,
    lastUpdated: priceData.timestamp,
    priceSource: 'api',
  };

  if (updated.shares && updated.shares > 0 && priceData.price > 0) {
    updated.currentValue = calculateValueFromShares(updated.shares, priceData.price);
  } else if (updated.currentValue > 0 && priceData.price > 0) {
    updated.shares = calculateSharesFromValue(updated.currentValue, priceData.price);
  }

  return updated;
}

export function clearAssetPriceFields(asset: Asset): Asset {
  return {
    ...asset,
    currentPrice: undefined,
    lastUpdated: undefined,
    priceSource: undefined,
    shares: undefined,
  };
}

export function createAssetWithDefaults(
  partial: Omit<Asset, 'currentValue'>,
  symbol: string
): Asset {
  return {
    ...partial,
    symbol,
    currentValue: 0,
  };
}
