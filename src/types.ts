export type AssetKind = 'stock' | 'crypto' | 'other';
export type HoldingBasis = 'value' | 'shares';

export interface Asset {
  id: string;
  symbol: string;
  kind: AssetKind;
  basis: HoldingBasis;
  currentValue: number;
  shares: number;
  targetPercentage: number;
  currentPrice?: number;
  priceSource?: 'api' | 'manual' | 'snapshot';
  quoteTime?: string;
  fetchedAt?: string;
  noSell: boolean;
  requestId?: string;
  quoteStatus?: 'loading' | 'error' | 'ready';
  quoteError?: string;
}

export interface Portfolio {
  assets: Asset[];
  newMoney: number;
  enableSelling: boolean;
}

export interface AllocationResult {
  id: string;
  symbol: string;
  amountToAdd: number;
  newValue: number;
  newPercentage: number;
  targetPercentage: number;
  difference: number;
}

export interface Quote {
  price: number;
  quoteTime: string;
  fetchedAt: string;
}
