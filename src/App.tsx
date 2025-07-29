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
import { encodePortfolioToUrl, decodePortfolioFromUrl, copyToClipboard } from './utils/urlSharing';

const PortfolioRebalancer = () => {
  const defaultAssets: Asset[] = [
    { symbol: 'VOO', currentValue: 600, targetPercentage: 0.50 },
    { symbol: 'QQQ', currentValue: 300, targetPercentage: 0.30 },
    { symbol: 'NVDA', currentValue: 100, targetPercentage: 0.20 }
  ];
  
  // Initialize state with URL data if available, otherwise use defaults
  const getInitialState = () => {
    const portfolioData = decodePortfolioFromUrl();
    if (portfolioData) {
      return {
        assets: portfolioData.assets,
        newMoney: portfolioData.newMoney
      };
    }
    return {
      assets: defaultAssets,
      newMoney: 1000
    };
  };

  const initialState = getInitialState();
  const [assets, setAssets] = useState<Asset[]>(initialState.assets);
  const [newMoney, setNewMoney] = useState(initialState.newMoney);
  const [allocations, setAllocations] = useState<AllocationResult[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('money');
  const [priceError, setPriceError] = useState<string | undefined>();
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  
  const totalPercentage = calculateTotalPercentage(assets);
  
  // Store initial load flag in a ref to prevent re-runs
  const hasInitializedRef = React.useRef(false);
  
  // Fetch prices once after initial render
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // Delay to ensure all components are mounted
      setTimeout(() => {
        if (assets.length > 0 && assets.some(a => a.symbol.trim() !== '')) {
          handleRefreshPrices();
        }
      }, 100);
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
  
  const handleUpdateAsset = async (index: number, field: keyof Asset, value: number | string) => {
    const updated = [...assets];
    if (field === 'symbol') {
      const oldSymbol = updated[index].symbol;
      updated[index].symbol = value as string;
      
      // If symbol changed and is not empty, fetch price
      if (oldSymbol !== value && (value as string).trim() !== '') {
        setIsLoadingPrices(true);
        setPriceError(undefined);
        
        try {
          const priceData = await priceService.fetchPrice(value as string);
          if (priceData) {
            updated[index].currentPrice = priceData.price;
            updated[index].lastUpdated = priceData.timestamp;
            updated[index].priceSource = 'api';
            
            // Update shares if we have a current value
            if (updated[index].currentValue > 0 && priceData.price > 0) {
              updated[index].shares = Math.round((updated[index].currentValue / priceData.price) * 1000000) / 1000000;
            }
            
            setLastPriceUpdate(new Date().toISOString());
          } else {
            // Clear price data if fetch failed
            updated[index].currentPrice = undefined;
            updated[index].lastUpdated = undefined;
            updated[index].priceSource = undefined;
            updated[index].shares = undefined;
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${value}:`, error);
          setPriceError(`Unable to fetch price for ${value}. Enter price manually.`);
        } finally {
          setIsLoadingPrices(false);
        }
      } else if ((value as string).trim() === '') {
        // Clear price data when symbol is empty
        updated[index].currentPrice = undefined;
        updated[index].lastUpdated = undefined;
        updated[index].priceSource = undefined;
        updated[index].shares = undefined;
      }
    } else if (field === 'currentValue') {
      updated[index].currentValue = value as number;
      // Only update shares from value if we don't already have shares (i.e., in money mode)
      if (updated[index].currentPrice && updated[index].currentPrice > 0 && !updated[index].shares) {
        updated[index].shares = Math.round(((value as number) / updated[index].currentPrice!) * 1000000) / 1000000;
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
          updated[index].shares = Math.round((updated[index].currentValue / (value as number)) * 1000000) / 1000000;
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
  
  const handleShare = async () => {
    const url = encodePortfolioToUrl(assets, newMoney);
    const success = await copyToClipboard(url);
    if (success) {
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 3000);
    }
  };
  
  const handleRefreshPrices = async () => {
    const symbols = assets.map(asset => asset.symbol).filter(symbol => symbol.trim() !== '');
    
    if (symbols.length === 0) return;
    
    setIsLoadingPrices(true);
    setPriceError(undefined);
    
    try {
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
          updatedAsset.shares = Math.round((updatedAsset.currentValue / data.price) * 1000000) / 1000000;
        }
        
        return updatedAsset;
      }
      return asset;
    });
    
      const failedSymbols = symbols.filter(symbol => !priceData.get(symbol));
      
      if (failedSymbols.length > 0) {
        setPriceError(`Unable to fetch prices for: ${failedSymbols.join(', ')}. Enter prices manually.`);
      }
      
      setAssets(updatedAssets);
      setLastPriceUpdate(new Date().toISOString());
    } catch (error) {
      setPriceError('Unable to fetch prices. Please enter them manually.');
      console.error('Price fetch error:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  };
  
  return (
    <>
      <Header newMoney={newMoney} onNewMoneyChange={setNewMoney} />
      
      <div className="h-screen pt-24 sm:pt-32 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6">
          
          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 h-[calc(100%-2rem)]">
            {/* Left Column - Portfolio Management (Scrollable) */}
            <div className="lg:col-span-2 space-y-6 relative z-10 lg:overflow-y-auto lg:overflow-x-hidden lg:pr-4 lg:pb-8 scrollbar-hide">
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
                priceError={priceError}
                isLoadingPrices={isLoadingPrices}
              />
              
              <AddAsset
                onAddAsset={handleAddAsset}
                currentAssetsCount={assets.length}
              />
            </div>
            
            {/* Right Column - Calculations (Scrollable) */}
            <div className="space-y-6 relative z-0 lg:sticky lg:top-32 lg:h-[calc(100vh-10rem)] lg:overflow-y-auto lg:overflow-x-hidden scrollbar-hide">
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
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-100">After Investment</h3>
                      <button
                        onClick={handleShare}
                        className="p-1.5 rounded-lg glass-light hover:bg-white/10 transition-colors duration-200 relative"
                        title="Share portfolio"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        {showShareSuccess && (
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-xs text-green-400 rounded whitespace-nowrap">
                            Copied!
                          </span>
                        )}
                      </button>
                    </div>
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
                        const asset = assets.find(a => a.symbol === allocation.symbol);
                        const currentPercentage = currentTotal > 0 ? ((asset?.currentValue || 0) / currentTotal) * 100 : 0;
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
                                <div className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-2">
                                  <span className="px-1.5 py-0.5 bg-gray-700/50 rounded text-gray-400">
                                    {currentPercentage.toFixed(1)}%
                                  </span>
                                  <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  <span className="px-1.5 py-0.5 bg-gray-800/50 rounded text-gray-300">
                                    {allocation.newPercentage.toFixed(1)}%
                                  </span>
                                  <span className={`font-medium ${textColor}`}>
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