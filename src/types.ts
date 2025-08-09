export interface Asset {
  symbol: string;
  currentValue: number;
  targetPercentage: number;
  currentPrice?: number;
  lastUpdated?: string;
  priceSource?: 'api' | 'manual';
  shares?: number;
  noSell?: boolean;
}

export type ViewMode = 'money' | 'shares';

export interface AllocationResult {
  symbol: string;
  amountToAdd: number;
  newValue: number;
  newPercentage: number;
  targetPercentage: number;
  difference: number;
}