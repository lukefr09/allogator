import type { Asset, Portfolio, Quote } from '../types';
import { getValueCents, hasHolding, MAX_ASSETS, MAX_VALUE } from './validation';

export function createAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: crypto.randomUUID(),
    symbol: '',
    kind: 'stock',
    basis: 'value',
    currentValue: 0,
    shares: 0,
    targetPercentage: 0,
    noSell: false,
    ...overrides,
  };
}
export function examplePortfolio(): Portfolio {
  return {
    newMoney: 1000,
    enableSelling: false,
    assets: [
      createAsset({ symbol: 'VOO', currentValue: 600, targetPercentage: 0.5 }),
      createAsset({ symbol: 'QQQ', currentValue: 300, targetPercentage: 0.3 }),
      createAsset({ symbol: 'NVDA', currentValue: 100, targetPercentage: 0.2 }),
    ],
  };
}

export type Action =
  | { type: 'replace'; portfolio: Portfolio }
  | { type: 'contribution'; value: number }
  | { type: 'selling'; value: boolean }
  | { type: 'add'; asset: Asset; index?: number }
  | { type: 'remove'; id: string }
  | {
      type: 'edit';
      id: string;
      patch: Partial<
        Pick<
          Asset,
          | 'symbol'
          | 'kind'
          | 'currentValue'
          | 'shares'
          | 'targetPercentage'
          | 'noSell'
        >
      >;
    }
  | { type: 'basis'; id: string; basis: Asset['basis'] }
  | { type: 'price'; id: string; price?: number }
  | { type: 'quote-start'; id: string; symbol: string; requestId: string }
  | {
      type: 'quote-result';
      id: string;
      symbol: string;
      requestId: string;
      quote?: Quote;
      error?: string;
    };

export function portfolioReducer(state: Portfolio, action: Action): Portfolio {
  if (action.type === 'replace') return action.portfolio;
  if (action.type === 'contribution')
    return { ...state, newMoney: action.value };
  if (action.type === 'selling')
    return { ...state, enableSelling: action.value };
  if (action.type === 'add') {
    if (
      state.assets.length >= MAX_ASSETS ||
      hasHolding(state.assets, action.asset)
    )
      return state;
    const assets = [...state.assets];
    assets.splice(action.index ?? assets.length, 0, action.asset);
    return { ...state, assets };
  }
  if (action.type === 'remove')
    return { ...state, assets: state.assets.filter((a) => a.id !== action.id) };
  return {
    ...state,
    assets: state.assets.map((asset) => {
      if (asset.id !== action.id) return asset;
      if (action.type === 'edit') {
        const identityChanged =
          (action.patch.symbol !== undefined &&
            action.patch.symbol !== asset.symbol) ||
          (action.patch.kind !== undefined && action.patch.kind !== asset.kind);
        return {
          ...asset,
          ...action.patch,
          ...(identityChanged
            ? {
                currentPrice: undefined,
                priceSource: undefined,
                quoteTime: undefined,
                fetchedAt: undefined,
                requestId: undefined,
                quoteStatus: undefined,
                quoteError: undefined,
              }
            : {}),
        };
      }
      if (action.type === 'basis')
        return convertHolding(asset, action.basis).asset;
      if (action.type === 'price')
        return {
          ...asset,
          currentPrice: action.price,
          priceSource: action.price === undefined ? undefined : 'manual',
          quoteTime: undefined,
          fetchedAt: undefined,
          requestId: undefined,
          quoteStatus: undefined,
          quoteError: undefined,
        };
      if (asset.symbol !== action.symbol || asset.kind !== 'stock')
        return asset;
      if (action.type === 'quote-start') {
        return {
          ...asset,
          requestId: action.requestId,
          quoteStatus: 'loading',
          quoteError: undefined,
        };
      }
      if (asset.requestId !== action.requestId) return asset;
      if (!action.quote)
        return {
          ...asset,
          requestId: undefined,
          quoteStatus: 'error',
          quoteError: action.error,
        };
      return {
        ...asset,
        currentPrice: action.quote.price,
        quoteTime: action.quote.quoteTime,
        fetchedAt: action.quote.fetchedAt,
        priceSource: 'api',
        requestId: undefined,
        quoteStatus: 'ready',
        quoteError: undefined,
      };
    }),
  };
}

export function convertHolding(
  asset: Asset,
  basis: Asset['basis'],
): { asset: Asset; error?: string } {
  if (asset.basis === basis) return { asset };
  const amount = asset.basis === 'value' ? asset.currentValue : asset.shares;
  if (amount > 0 && !asset.currentPrice)
    return { asset, error: 'Set a price before converting this holding.' };
  if (basis === 'value' && getValueCents(asset) > MAX_VALUE * 100)
    return {
      asset,
      error: 'Enter a holding value of $1 billion or less before converting.',
    };
  const converted =
    basis === 'value'
      ? { ...asset, basis, currentValue: getValueCents(asset) / 100 }
      : {
          ...asset,
          basis,
          shares: asset.currentPrice
            ? Number((asset.currentValue / asset.currentPrice).toFixed(8))
            : 0,
        };
  if (
    converted.shares > 1e12 ||
    getValueCents(converted) !== getValueCents(asset)
  ) {
    return {
      asset,
      error:
        'This dollar value cannot be converted exactly at eight quantity decimals. Keep dollars, or clear the value and enter your actual quantity.',
    };
  }
  return { asset: converted };
}
