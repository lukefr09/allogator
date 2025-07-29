import { Asset } from '../types';

export const validatePortfolio = (assets: Asset[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check minimum assets
  if (assets.length < 2) {
    errors.push('Portfolio must contain at least 2 assets');
  }

  // Check maximum assets
  if (assets.length > 20) {
    errors.push('Portfolio cannot contain more than 20 assets');
  }

  // Check for duplicate symbols
  const symbols = assets.map(a => a.symbol);
  const uniqueSymbols = new Set(symbols);
  if (symbols.length !== uniqueSymbols.size) {
    errors.push('Duplicate symbols are not allowed');
  }

  // Check for empty symbols
  if (assets.some(a => !a.symbol || a.symbol.trim() === '')) {
    errors.push('All assets must have a symbol');
  }

  // Check for negative values
  if (assets.some(a => a.currentValue < 0)) {
    errors.push('Current values cannot be negative');
  }

  // Check for negative or zero percentages
  if (assets.some(a => a.targetPercentage <= 0)) {
    errors.push('Target percentages must be greater than 0');
  }

  // Check if percentages sum to 100%
  const totalPercentage = assets.reduce((sum, asset) => sum + asset.targetPercentage, 0);
  const percentageSum = totalPercentage * 100;
  
  if (Math.abs(percentageSum - 100) > 0.1) {
    errors.push(`Target percentages must sum to 100% (currently ${percentageSum.toFixed(1)}%)`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const calculateTotalPercentage = (assets: Asset[]): number => {
  return assets.reduce((sum, asset) => sum + asset.targetPercentage, 0) * 100;
};