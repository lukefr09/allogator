export interface Asset {
  symbol: string;
  currentValue: number;
  targetPercentage: number;
}

export interface Portfolio {
  assets: Asset[];
  newMoney: number;
}

export interface SavedPortfolio {
  id: string;
  name: string;
  assets: Asset[];
  newMoney: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioStorage {
  portfolios: SavedPortfolio[];
  activePortfolioId: string | null;
}

export interface AllocationResult {
  symbol: string;
  amountToAdd: number;
  newValue: number;
  newPercentage: number;
  targetPercentage: number;
  difference: number;
}