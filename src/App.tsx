import React, { useState, useEffect } from 'react';

const PortfolioRebalancer = () => {
  const [holdings, setHoldings] = useState({
    QQQ: 1708.80,
    NVDA: 533.22,
    SMH: 585.20,
    VEU: 0,
    BTC: 197.00
  });
  
  const [newMoney, setNewMoney] = useState(1000);
  
  const targets = {
    QQQ: 0.50,
    NVDA: 0.20,
    SMH: 0.10,
    VEU: 0.10,
    BTC: 0.10
  };
  
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  
  useEffect(() => {
    calculateAllocations();
  }, [holdings, newMoney]);
  
  const calculateAllocations = () => {
    const currentTotal = Object.values(holdings).reduce((sum, val) => sum + val, 0);
    const newTotal = currentTotal + newMoney;
    
    // Calculate target values
    const targetValues: Record<string, number> = {};
    Object.keys(targets).forEach(symbol => {
      targetValues[symbol] = newTotal * targets[symbol as keyof typeof targets];
    });
    
    // Calculate how much to add to each
    const toAdd: Record<string, number> = {};
    let totalAllocated = 0;
    
    // First pass: allocate to underweight positions
    Object.keys(targets).forEach(symbol => {
      const currentValue = holdings[symbol as keyof typeof holdings];
      const targetValue = targetValues[symbol];
      const needed = Math.max(0, targetValue - currentValue);
      toAdd[symbol] = Math.min(needed, newMoney - totalAllocated);
      totalAllocated += toAdd[symbol];
    });
    
    // If money remains, allocate proportionally to maintain targets
    if (totalAllocated < newMoney) {
      const remaining = newMoney - totalAllocated;
      
      Object.keys(targets).forEach(symbol => {
        const additionalAmount = remaining * targets[symbol as keyof typeof targets];
        toAdd[symbol] = (toAdd[symbol] || 0) + additionalAmount;
      });
    }
    
    // Round to cents
    Object.keys(toAdd).forEach(symbol => {
      toAdd[symbol] = Math.round(toAdd[symbol] * 100) / 100;
    });
    
    // Adjust for rounding errors
    const sumAllocated = Object.values(toAdd).reduce((sum, val) => sum + val, 0);
    if (sumAllocated !== newMoney) {
      const diff = newMoney - sumAllocated;
      toAdd.QQQ = Math.round((toAdd.QQQ + diff) * 100) / 100;
    }
    
    setAllocations(toAdd);
  };
  
  const updateHolding = (symbol: string, value: string) => {
    setHoldings(prev => ({
      ...prev,
      [symbol]: parseFloat(value) || 0
    }));
  };
  
  const currentTotal = Object.values(holdings).reduce((sum, val) => sum + val, 0);
  const newTotal = currentTotal + newMoney;
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Portfolio Rebalancing Calculator</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Holdings</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.keys(holdings).map(symbol => (
            <div key={symbol} className="bg-gray-800 p-3 rounded">
              <label className="block text-sm font-medium mb-1">{symbol}</label>
              <input
                type="number"
                value={holdings[symbol as keyof typeof holdings]}
                onChange={(e) => updateHolding(symbol, e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 rounded text-white"
                step="0.01"
              />
              <div className="text-xs text-gray-400 mt-1">
                Current: {((holdings[symbol as keyof typeof holdings] / currentTotal) * 100).toFixed(1)}% | 
                Target: {(targets[symbol as keyof typeof targets] * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8 bg-gray-800 p-4 rounded">
        <label className="block text-lg font-medium mb-2">New Money to Invest</label>
        <input
          type="number"
          value={newMoney}
          onChange={(e) => setNewMoney(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 bg-gray-700 rounded text-white text-lg"
          step="0.01"
        />
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">How to Allocate ${newMoney.toFixed(2)}</h2>
        <div className="bg-gray-800 p-4 rounded">
          {Object.keys(allocations).map(symbol => (
            <div key={symbol} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
              <span className="font-medium">{symbol}</span>
              <span className="text-green-400 font-mono">${allocations[symbol]?.toFixed(2) || '0.00'}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-600">
            <span className="font-bold">Total</span>
            <span className="text-green-400 font-mono font-bold">
              ${Object.values(allocations).reduce((sum, val) => sum + val, 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold mb-3">After Investment</h3>
        <div className="space-y-2">
          {Object.keys(holdings).map(symbol => {
            const newValue = holdings[symbol as keyof typeof holdings] + (allocations[symbol] || 0);
            const newPercent = (newValue / newTotal) * 100;
            const targetPercent = targets[symbol as keyof typeof targets] * 100;
            const diff = newPercent - targetPercent;
            
            return (
              <div key={symbol} className="flex justify-between items-center">
                <span>{symbol}</span>
                <div className="text-right">
                  <span className="font-mono">${newValue.toFixed(2)}</span>
                  <span className={`ml-3 text-sm ${Math.abs(diff) < 0.5 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {newPercent.toFixed(1)}% ({diff > 0 ? '+' : ''}{diff.toFixed(1)}%)
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
      
      <div className="mt-6 text-sm text-gray-400 text-center">
        Target Allocation: QQQ 50% | NVDA 20% | SMH 10% | VEU 10% | BTC 10%
      </div>
    </div>
  );
};

export default PortfolioRebalancer;