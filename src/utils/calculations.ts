import { Asset, AllocationResult } from '../types';

export const calculateAllocations = (
  assets: Asset[], 
  newMoney: number,
  enableSelling: boolean = false
): AllocationResult[] => {
  const currentTotal = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const newTotal = currentTotal + newMoney;
  
  // If selling mode is enabled, handle rebalancing with locked assets
  if (enableSelling) {
    // Step 1: Calculate what we can actually sell and what we need to buy
    let availableCash = newMoney;
    const allocations: any[] = [];
    
    // First pass: identify sells and buys
    assets.forEach(asset => {
      const targetValue = newTotal * asset.targetPercentage;
      const currentValue = asset.currentValue;
      const idealDifference = targetValue - currentValue;
      
      if (asset.noSell) {
        // Locked asset - can't sell, can only buy if underweight
        allocations.push({
          asset,
          currentValue,
          targetValue,
          amountToAdd: idealDifference > 0 ? idealDifference : 0,
          canSell: false
        });
      } else {
        // Unlocked asset - can buy or sell
        allocations.push({
          asset,
          currentValue,
          targetValue,
          amountToAdd: idealDifference,
          canSell: true
        });
        
        // If selling from this asset, add to available cash
        if (idealDifference < 0) {
          availableCash += Math.abs(idealDifference);
        }
      }
    });
    
    // Step 2: Calculate total buy needs (only positive amounts)
    const totalBuyNeeded = allocations
      .filter(a => a.amountToAdd > 0)
      .reduce((sum, a) => sum + a.amountToAdd, 0);
    
    // Step 3: If we don't have enough cash for all buys, scale them down proportionally
    const scalingFactor = totalBuyNeeded > availableCash ? availableCash / totalBuyNeeded : 1;
    
    // Step 4: Apply final allocations
    return allocations.map(({ asset, currentValue, amountToAdd, canSell }) => {
      let finalAmount = 0;
      
      if (asset.noSell && amountToAdd <= 0) {
        // Locked and overweight/at target - no change
        finalAmount = 0;
      } else if (amountToAdd > 0) {
        // Needs buying - apply scaling if necessary
        finalAmount = amountToAdd * scalingFactor;
      } else if (canSell && amountToAdd < 0) {
        // Can sell and overweight
        finalAmount = amountToAdd; // negative value for selling
      }
      
      const newValue = currentValue + finalAmount;
      
      return {
        symbol: asset.symbol,
        amountToAdd: parseFloat(finalAmount.toFixed(2)),
        newValue: parseFloat(newValue.toFixed(2)),
        newPercentage: (newValue / newTotal) * 100,
        targetPercentage: asset.targetPercentage * 100,
        difference: (newValue / newTotal) * 100 - (asset.targetPercentage * 100)
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