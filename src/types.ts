export interface Asset {
  symbol: string;
  currentValue: number;
  targetPercentage: number;
}

export interface Portfolio {
  assets: Asset[];
  newMoney: number;
}

export interface AllocationResult {
  symbol: string;
  amountToAdd: number;
  newValue: number;
  newPercentage: number;
  targetPercentage: number;
  difference: number;
}