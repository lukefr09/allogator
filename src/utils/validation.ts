import { Asset } from '../types';
import { LIMITS, THRESHOLDS } from '../constants';

export const validatePortfolio = (assets: Asset[], enableSelling: boolean = false): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (assets.length < LIMITS.MIN_ASSETS) {
    errors.push(`Portfolio must contain at least ${LIMITS.MIN_ASSETS} assets`);
  }

  if (assets.length > LIMITS.MAX_ASSETS) {
    errors.push(`Portfolio cannot contain more than ${LIMITS.MAX_ASSETS} assets`);
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
  if (enableSelling) {
    // When selling is enabled, allow 0% but not negative
    if (assets.some(a => a.targetPercentage < 0)) {
      errors.push('Target percentages cannot be negative');
    }
  } else {
    // When selling is disabled, percentages must be greater than 0
    if (assets.some(a => a.targetPercentage <= 0)) {
      const hasZeroPercentage = assets.some(a => a.targetPercentage === 0);
      if (hasZeroPercentage) {
        errors.push('Enable selling mode to set 0% allocations');
      } else {
        errors.push('Target percentages must be greater than 0');
      }
    }
  }

  const totalPercentage = assets.reduce((sum, asset) => sum + asset.targetPercentage, 0);
  const percentageSum = totalPercentage * 100;

  if (Math.abs(percentageSum - 100) > THRESHOLDS.PERCENTAGE_TOLERANCE) {
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