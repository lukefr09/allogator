import React, { useState, useEffect } from 'react';
import { Asset, AllocationResult, ViewMode } from './types';
import Header from './components/Header';
import AddAsset from './components/AddAsset';
import AssetList from './components/AssetList';
import GlassCard from './components/GlassCard';
import AnimatedNumber from './components/AnimatedNumber';
import { validatePortfolio, calculateTotalPercentage } from './utils/validation';
import { calculateAllocations } from './utils/calculations';
import { priceService } from './services/priceService';

const PortfolioRebalancer = () => {
  const defaultAssets: Asset[] = [
    { symbol: 'VOO', currentValue: 0, targetPercentage: 0.50 },
    { symbol: 'QQQ', currentValue: 0, targetPercentage: 0.30 },
    { symbol: 'NVDA', currentValue: 0, targetPercentage: 0.20 }
  ];
  
  const [assets, setAssets] = useState<Asset[]>(defaultAssets);
  const [newMoney, setNewMoney] = useState(1000);
  const [allocations, setAllocations] = useState<AllocationResult[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('money');
  
  const totalPercentage = calculateTotalPercentage(assets);
  
  
  // Fetch prices after assets are loaded
  useEffect(() => {
    if (assets.length > 0) {
      handleRefreshPrices();
    }
  }, []);
  
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
  
  const handleAddAsset = async (newAsset: Omit<Asset, 'currentValue'>) => {
    if (assets.length >= 20) return;
    
    // Add the asset with initial values
    const assetWithDefaults: Asset = { ...newAsset, currentValue: 0 };
    setAssets([...assets, assetWithDefaults]);
    
    // Fetch price for the new asset
    if (newAsset.symbol.trim() !== '') {
      const priceData = await priceService.fetchPrice(newAsset.symbol);
      if (priceData) {
        // Update the assets array with the fetched price
        setAssets(prevAssets => {
          const updatedAssets = [...prevAssets];
          const newAssetIndex = updatedAssets.length - 1;
          if (updatedAssets[newAssetIndex].symbol === newAsset.symbol) {
            updatedAssets[newAssetIndex] = {
              ...updatedAssets[newAssetIndex],
              currentPrice: priceData.price,
              lastUpdated: priceData.timestamp,
              priceSource: 'api'
            };
          }
          return updatedAssets;
        });
        
        // Update the last price update timestamp
        setLastPriceUpdate(new Date().toISOString());
      }
    }
  };
  
  const handleUpdateAsset = (index: number, field: keyof Asset, value: number | string) => {
    const updated = [...assets];
    if (field === 'symbol') {
      updated[index].symbol = value as string;
      // Clear price and share data when symbol changes
      updated[index].currentPrice = undefined;
      updated[index].lastUpdated = undefined;
      updated[index].priceSource = undefined;
      updated[index].shares = undefined;
    } else if (field === 'currentValue') {
      updated[index].currentValue = value as number;
      // Only update shares from value if we don't already have shares (i.e., in money mode)
      if (updated[index].currentPrice && updated[index].currentPrice > 0 && !updated[index].shares) {
        updated[index].shares = (value as number) / updated[index].currentPrice!;
      }
    } else if (field === 'shares') {
      updated[index].shares = value as number;
      // Always update value when shares change and price is available
      if (updated[index].currentPrice && updated[index].currentPrice > 0) {
        updated[index].currentValue = (value as number) * updated[index].currentPrice!;
      }
    } else if (field === 'targetPercentage') {
      updated[index].targetPercentage = value as number;
    } else if (field === 'currentPrice') {
      updated[index].currentPrice = value as number;
      // When price is manually set, prioritize shares if they exist, otherwise use value
      if ((value as number) > 0) {
        if (updated[index].shares && updated[index].shares > 0) {
          // Update value based on existing shares
          updated[index].currentValue = updated[index].shares! * (value as number);
        } else if (updated[index].currentValue > 0) {
          // Calculate shares from existing value
          updated[index].shares = updated[index].currentValue / (value as number);
        }
      }
    } else if (field === 'lastUpdated') {
      updated[index].lastUpdated = value as string;
    } else if (field === 'priceSource') {
      updated[index].priceSource = value as 'api' | 'manual';
    }
    setAssets(updated);
  };
  
  const handleRemoveAsset = (index: number) => {
    if (assets.length <= 2) return;
    setAssets(assets.filter((_, i) => i !== index));
  };
  
  const currentTotal = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const newTotal = currentTotal + newMoney;
  
  
  const handleRefreshPrices = async () => {
    const symbols = assets.map(asset => asset.symbol).filter(symbol => symbol.trim() !== '');
    
    if (symbols.length === 0) return;
    
    const priceData = await priceService.fetchMultiplePrices(symbols);
    
    const updatedAssets = assets.map(asset => {
      const data = priceData.get(asset.symbol);
      if (data) {
        const updatedAsset = {
          ...asset,
          currentPrice: data.price,
          lastUpdated: data.timestamp,
          priceSource: 'api' as const
        };
        
        // Prioritize shares over value when updating prices
        if (updatedAsset.shares && updatedAsset.shares > 0 && data.price > 0) {
          // Update value based on existing shares (this preserves exact share count)
          updatedAsset.currentValue = updatedAsset.shares * data.price;
        } else if (updatedAsset.currentValue > 0 && data.price > 0) {
          // Calculate shares from existing value (only if no shares exist)
          updatedAsset.shares = updatedAsset.currentValue / data.price;
        }
        
        return updatedAsset;
      }
      return asset;
    });
    
    setAssets(updatedAssets);
    setLastPriceUpdate(new Date().toISOString());
  };
  
  return (
    <>
      <Header newMoney={newMoney} onNewMoneyChange={setNewMoney} />
      
      <div className="min-h-screen pt-36 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Portfolio Management */}
            <div className="lg:col-span-2 space-y-6">
              {/* Asset List */}
              <AssetList
                assets={assets}
                onUpdateAsset={handleUpdateAsset}
                onRemoveAsset={handleRemoveAsset}
                totalPercentage={totalPercentage}
                onRefreshPrices={handleRefreshPrices}
                lastPriceUpdate={lastPriceUpdate}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
              
              <AddAsset
                onAddAsset={handleAddAsset}
                currentAssetsCount={assets.length}
              />
            </div>
            
            {/* Right Column - Calculations */}
            <div className="space-y-6">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <GlassCard variant="default" padding="md" className="border-red-500/20">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-red-400 font-semibold mb-1">Validation Errors</h3>
                      <ul className="text-red-300 text-sm space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </GlassCard>
              )}
              
              {/* Allocation Results */}
              {validationErrors.length === 0 && allocations.length > 0 && (
                <>
                  <GlassCard variant="light" padding="lg" animate>
                    <h2 className="text-xl font-semibold text-gray-100 mb-4">
                      How to Allocate <AnimatedNumber value={newMoney} prefix="$" className="text-emerald-400" />
                    </h2>
                    <div className="space-y-3">
                      {allocations.map((allocation, index) => (
                        <div
                          key={allocation.symbol}
                          className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 animate-slide-up"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <span className="font-medium text-gray-200">{allocation.symbol}</span>
                          <AnimatedNumber
                            value={allocation.amountToAdd}
                            prefix="$"
                            className="text-emerald-400 font-semibold"
                          />
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/10">
                        <span className="font-bold text-gray-100">Total</span>
                        <AnimatedNumber
                          value={allocations.reduce((sum, a) => sum + a.amountToAdd, 0)}
                          prefix="$"
                          className="text-emerald-400 font-bold text-lg"
                        />
                      </div>
                    </div>
                  </GlassCard>
                  
                  <GlassCard variant="dark" padding="lg" animate>
                    <h3 className="text-lg font-semibold text-gray-100 mb-3">After Investment</h3>
                    <div className="text-xs text-gray-400 mb-4 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full"></span> On target
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span> Slightly off
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span> Needs rebalancing
                      </span>
                    </div>
                    <div className="space-y-3">
                      {allocations.map((allocation, index) => {
                        const absDiff = Math.abs(allocation.difference);
                        let statusColor = 'bg-emerald-400';
                        let textColor = 'text-emerald-400';
                        
                        if (absDiff >= 2) {
                          statusColor = 'bg-red-400';
                          textColor = 'text-red-400';
                        } else if (absDiff >= 0.5) {
                          statusColor = 'bg-yellow-400';
                          textColor = 'text-yellow-400';
                        }
                        
                        return (
                          <div
                            key={allocation.symbol}
                            className="glass-light p-3 rounded-lg animate-slide-up"
                            style={{ animationDelay: `${index * 50 + 300}ms` }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 ${statusColor} rounded-full`}></span>
                                <span className="font-medium">{allocation.symbol}</span>
                              </div>
                              <div className="text-right">
                                <AnimatedNumber
                                  value={allocation.newValue}
                                  prefix="$"
                                  className="font-semibold"
                                />
                                <div className="text-xs text-gray-400 mt-1">
                                  <span className="px-1.5 py-0.5 bg-gray-800/50 rounded text-gray-300">
                                    {allocation.newPercentage.toFixed(1)}%
                                  </span>
                                  <span className={`ml-2 font-medium ${textColor}`}>
                                    ({allocation.difference > 0 ? '+' : ''}{allocation.difference.toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-4 mt-4 border-t border-white/10">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-100">New Total</span>
                          <AnimatedNumber
                            value={newTotal}
                            prefix="$"
                            className="font-bold text-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PortfolioRebalancer;