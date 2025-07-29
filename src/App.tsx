import React, { useState, useEffect } from 'react';
import { Asset, AllocationResult } from './types';
import AddAsset from './components/AddAsset';
import AssetList from './components/AssetList';
import { validatePortfolio, calculateTotalPercentage } from './utils/validation';
import { calculateAllocations } from './utils/calculations';

const PortfolioRebalancer = () => {
  const [assets, setAssets] = useState<Asset[]>([
    { symbol: 'QQQ', currentValue: 1708.80, targetPercentage: 0.50 },
    { symbol: 'NVDA', currentValue: 533.22, targetPercentage: 0.20 },
    { symbol: 'SMH', currentValue: 585.20, targetPercentage: 0.10 },
    { symbol: 'VEU', currentValue: 0, targetPercentage: 0.10 },
    { symbol: 'BTC', currentValue: 197.00, targetPercentage: 0.10 }
  ]);
  
  const [newMoney, setNewMoney] = useState(1000);
  const [allocations, setAllocations] = useState<AllocationResult[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const totalPercentage = calculateTotalPercentage(assets);
  
  useEffect(() => {
    const validation = validatePortfolio(assets);
    setValidationErrors(validation.errors);
    
    if (validation.isValid && newMoney > 0) {
      const results = calculateAllocations(assets, newMoney);
      setAllocations(results);
    } else {
      setAllocations([]);
    }
  }, [assets, newMoney]);
  
  const handleAddAsset = (newAsset: Omit<Asset, 'currentValue'>) => {
    if (assets.length >= 20) return;
    
    setAssets([...assets, { ...newAsset, currentValue: 0 }]);
  };
  
  const handleUpdateAsset = (index: number, field: keyof Asset, value: number | string) => {
    const updated = [...assets];
    if (field === 'symbol') {
      updated[index].symbol = value as string;
    } else if (field === 'currentValue') {
      updated[index].currentValue = value as number;
    } else if (field === 'targetPercentage') {
      updated[index].targetPercentage = value as number;
    }
    setAssets(updated);
  };
  
  const handleRemoveAsset = (index: number) => {
    if (assets.length <= 2) return;
    setAssets(assets.filter((_, i) => i !== index));
  };
  
  const currentTotal = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const newTotal = currentTotal + newMoney;
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Portfolio Rebalancing Calculator</h1>
      
      <AssetList
        assets={assets}
        onUpdateAsset={handleUpdateAsset}
        onRemoveAsset={handleRemoveAsset}
        totalPercentage={totalPercentage}
      />
      
      <AddAsset
        onAddAsset={handleAddAsset}
        currentAssetsCount={assets.length}
      />
      
      <div className="mb-8 bg-gray-800 p-4 rounded">
        <label className="block text-lg font-medium mb-2">New Money to Invest</label>
        <input
          type="number"
          value={newMoney}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            if (value >= 0.01 && value <= 1000000) {
              setNewMoney(value);
            } else if (value < 0.01) {
              setNewMoney(0.01);
            } else if (value > 1000000) {
              setNewMoney(1000000);
            }
          }}
          className="w-full px-3 py-2 bg-gray-700 rounded text-white text-lg"
          step="0.01"
          min="0.01"
          max="1000000"
        />
        <div className="text-xs text-gray-400 mt-1">
          Enter amount between $0.01 and $1,000,000
        </div>
      </div>
      
      {validationErrors.length > 0 && (
        <div className="mb-6 bg-red-900/20 border border-red-600 rounded p-4">
          <h3 className="text-red-400 font-semibold mb-2">Validation Errors:</h3>
          <ul className="list-disc list-inside text-red-300 text-sm">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {validationErrors.length === 0 && allocations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">How to Allocate ${newMoney.toFixed(2)}</h2>
          <div className="bg-gray-800 p-4 rounded">
            {allocations.map(allocation => (
              <div key={allocation.symbol} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                <span className="font-medium">{allocation.symbol}</span>
                <span className="text-green-400 font-mono">${allocation.amountToAdd.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-600">
              <span className="font-bold">Total</span>
              <span className="text-green-400 font-mono font-bold">
                ${allocations.reduce((sum, a) => sum + a.amountToAdd, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {validationErrors.length === 0 && allocations.length > 0 && (
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-semibold mb-3">After Investment</h3>
          <div className="space-y-2">
            {allocations.map(allocation => {
              const diffColor = Math.abs(allocation.difference) < 0.5 ? 'text-green-400' : 'text-yellow-400';
              
              return (
                <div key={allocation.symbol} className="flex justify-between items-center">
                  <span>{allocation.symbol}</span>
                  <div className="text-right">
                    <span className="font-mono">${allocation.newValue.toFixed(2)}</span>
                    <span className={`ml-3 text-sm ${diffColor}`}>
                      {allocation.newPercentage.toFixed(1)}% ({allocation.difference > 0 ? '+' : ''}{allocation.difference.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="pt-3 mt-3 border-t border-gray-700">
              <div className="flex justify-between font-bold">
                <span>New Total</span>
                <span className="font-mono">${newTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioRebalancer;