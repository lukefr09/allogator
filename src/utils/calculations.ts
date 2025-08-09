import { Asset, AllocationResult } from '../types';

export const calculateAllocations = (
  assets: Asset[], 
  newMoney: number,
  enableSelling: boolean = false
): AllocationResult[] => {
  const currentTotal = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const newTotal = currentTotal + newMoney;
  
  // If perfect rebalancing is enabled, calculate exact target values
  if (enableSelling) {
    return assets.map(asset => {
      const targetValue = newTotal * asset.targetPercentage;
      const currentValue = asset.currentValue;
      let difference = targetValue - currentValue;
      
      // If asset has noSell flag, only allow buying (no negative amounts)
      if (asset.noSell && difference < 0) {
        difference = 0;
      }
      
      return {
        symbol: asset.symbol,
        amountToAdd: parseFloat(difference.toFixed(2)), // Can be negative for selling unless noSell is true
        newValue: parseFloat((currentValue + difference).toFixed(2)),
        newPercentage: ((currentValue + difference) / newTotal) * 100,
        targetPercentage: asset.targetPercentage * 100,
        difference: ((currentValue + difference) / newTotal) * 100 - (asset.targetPercentage * 100)
      };
    });
  }
  
  // Original logic for buy-only allocation
  // Calculate initial deviations and sort by most underweight
  const assetsWithDeviation = assets.map((asset, index) => {
    const currentPercentage = currentTotal > 0 ? (asset.currentValue / currentTotal) * 100 : 0;
    const targetPercentage = asset.targetPercentage * 100;
    const deviation = currentPercentage - targetPercentage;
    return { asset, index, deviation, targetPercentage };
  }).sort((a, b) => a.deviation - b.deviation);
  
  const results: AllocationResult[] = new Array(assets.length);
  let remainingMoney = Math.round(newMoney * 100); // Work in cents
  
  // First pass: allocate to underweight positions
  assetsWithDeviation.forEach(({ asset, index, targetPercentage }) => {
    const targetValue = Math.round(newTotal * asset.targetPercentage * 100); // In cents
    const currentValueCents = Math.round(asset.currentValue * 100);
    const needed = Math.max(0, targetValue - currentValueCents);
    const toAllocate = Math.min(needed, remainingMoney);
    
    results[index] = {
      symbol: asset.symbol,
      amountToAdd: parseFloat((toAllocate / 100).toFixed(2)),
      newValue: parseFloat((asset.currentValue + (toAllocate / 100)).toFixed(2)),
      newPercentage: ((currentValueCents + toAllocate) / (newTotal * 100)) * 100,
      targetPercentage,
      difference: 0
    };
    
    remainingMoney -= toAllocate;
  });
  
  // Second pass: if money remains, allocate proportionally
  if (remainingMoney > 0) {
    let allocatedInSecondPass = 0;
    
    assetsWithDeviation.forEach(({ asset, index }) => {
      if (remainingMoney > 0) {
        const proportion = asset.targetPercentage;
        const proportionalAmount = Math.round(remainingMoney * proportion);
        const toAllocate = Math.min(proportionalAmount, remainingMoney - allocatedInSecondPass);
        
        results[index].amountToAdd = parseFloat((results[index].amountToAdd + (toAllocate / 100)).toFixed(2));
        allocatedInSecondPass += toAllocate;
      }
    });
    
    remainingMoney -= allocatedInSecondPass;
  }
  
  // Final pass: handle any remaining cents due to rounding
  if (remainingMoney > 0) {
    // Give remaining cents to the most underweight position
    const mostUnderweightIndex = assetsWithDeviation[0].index;
    results[mostUnderweightIndex].amountToAdd = parseFloat((results[mostUnderweightIndex].amountToAdd + (remainingMoney / 100)).toFixed(2));
  }
  
  // Calculate final values and differences
  results.forEach((result, index) => {
    result.newValue = parseFloat((assets[index].currentValue + result.amountToAdd).toFixed(2));
    result.newPercentage = (result.newValue / newTotal) * 100;
    result.difference = result.newPercentage - result.targetPercentage;
  });
  
  return results;
};