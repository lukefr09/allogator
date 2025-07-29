import { Asset, AllocationResult } from '../types';

export const calculateAllocations = (
  assets: Asset[], 
  newMoney: number
): AllocationResult[] => {
  const currentTotal = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const newTotal = currentTotal + newMoney;
  
  const results: AllocationResult[] = [];
  let totalAllocated = 0;
  
  // First pass: allocate to underweight positions
  assets.forEach(asset => {
    const targetValue = newTotal * asset.targetPercentage;
    const needed = Math.max(0, targetValue - asset.currentValue);
    const amountToAdd = Math.min(needed, newMoney - totalAllocated);
    
    results.push({
      symbol: asset.symbol,
      amountToAdd: 0, // Will be updated
      newValue: asset.currentValue,
      newPercentage: 0,
      targetPercentage: asset.targetPercentage * 100,
      difference: 0
    });
    
    totalAllocated += amountToAdd;
  });
  
  // Reset for actual allocation
  totalAllocated = 0;
  
  // Allocate to underweight positions first
  assets.forEach((asset, index) => {
    const targetValue = newTotal * asset.targetPercentage;
    const needed = Math.max(0, targetValue - asset.currentValue);
    const amountToAdd = Math.min(needed, newMoney - totalAllocated);
    
    results[index].amountToAdd = amountToAdd;
    totalAllocated += amountToAdd;
  });
  
  // If money remains, allocate proportionally
  if (totalAllocated < newMoney) {
    const remaining = newMoney - totalAllocated;
    
    assets.forEach((asset, index) => {
      const additionalAmount = remaining * asset.targetPercentage;
      results[index].amountToAdd += additionalAmount;
    });
  }
  
  // Round to cents and calculate final values
  results.forEach((result, index) => {
    result.amountToAdd = Math.round(result.amountToAdd * 100) / 100;
    result.newValue = assets[index].currentValue + result.amountToAdd;
    result.newPercentage = (result.newValue / newTotal) * 100;
    result.difference = result.newPercentage - result.targetPercentage;
  });
  
  // Adjust for rounding errors
  const sumAllocated = results.reduce((sum, r) => sum + r.amountToAdd, 0);
  if (Math.abs(sumAllocated - newMoney) > 0.01 && results.length > 0) {
    const diff = newMoney - sumAllocated;
    results[0].amountToAdd = Math.round((results[0].amountToAdd + diff) * 100) / 100;
    results[0].newValue = assets[0].currentValue + results[0].amountToAdd;
    results[0].newPercentage = (results[0].newValue / newTotal) * 100;
    results[0].difference = results[0].newPercentage - results[0].targetPercentage;
  }
  
  return results;
};