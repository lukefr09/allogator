import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Asset, AllocationResult, ViewMode } from './types';
import Header from './components/Header';
import AddAsset from './components/AddAsset';
import AssetList from './components/AssetList';
import GlassCard from './components/GlassCard';
import AnimatedNumber from './components/AnimatedNumber';
import Skeleton from './components/Skeleton';
import AssetTypeDialog from './components/AssetTypeDialog';
import { validatePortfolio, calculateTotalPercentage } from './utils/validation';
import { calculateAllocations } from './utils/calculations';
import { priceService } from './services/priceService';
import { encodePortfolioToUrl, decodePortfolioFromUrl, copyToClipboard } from './utils/urlSharing';
import { isAmbiguousSymbol, getCryptoSymbol, isCryptoAlias } from './utils/cryptoAliases';
import { getDisplayName } from './utils/displayNames';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react"

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
        newMoney: portfolioData.newMoney,
        enableSelling: portfolioData.enableSelling
      };
    }
    return {
      assets: defaultAssets,
      newMoney: 1000,
      enableSelling: false
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
  const [showSharesInAllocation, setShowSharesInAllocation] = useState(false);
  const [enableSelling, setEnableSelling] = useState(initialState.enableSelling);
  const [disambiguationDialog, setDisambiguationDialog] = useState<{
    index: number;
    symbol: string;
    field: 'symbol' | 'add';
    newAsset?: Omit<Asset, 'currentValue'>;
  } | null>(null);
  
  const totalPercentage = useMemo(() => calculateTotalPercentage(assets), [assets]);
  
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
    const validation = validatePortfolio(assets, enableSelling);
    setValidationErrors(validation.errors);
    
    if (validation.isValid && newMoney > 0) {
      const results = calculateAllocations(assets, newMoney, enableSelling);
      setAllocations(results);
    } else {
      setAllocations([]);
    }
  }, [assets, newMoney, enableSelling]);
  
  const handleAddAsset = async (newAsset: Omit<Asset, 'currentValue'>) => {
    if (assets.length >= 20) return;
    
    const symbol = newAsset.symbol.trim().toUpperCase();
    
    // Check if it's an ambiguous symbol
    if (isAmbiguousSymbol(symbol)) {
      setDisambiguationDialog({
        index: assets.length,
        symbol,
        field: 'add',
        newAsset
      });
      return;
    }
    
    // Check if it's a crypto alias and auto-convert
    let finalSymbol = symbol;
    if (isCryptoAlias(symbol)) {
      const cryptoSymbol = getCryptoSymbol(symbol, 'binance');
      if (cryptoSymbol) {
        finalSymbol = cryptoSymbol;
      }
    }
    
    // Add the asset with initial values
    const assetWithDefaults: Asset = { ...newAsset, symbol: finalSymbol, currentValue: 0 };
    setAssets([...assets, assetWithDefaults]);
    
    // Fetch price for the new asset
    if (finalSymbol !== '') {
      const priceData = await priceService.fetchPrice(finalSymbol);
      if (priceData) {
        // Update the assets array with the fetched price
        setAssets(prevAssets => {
          const updatedAssets = [...prevAssets];
          const newAssetIndex = updatedAssets.length - 1;
          if (updatedAssets[newAssetIndex].symbol === finalSymbol) {
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
  
  const handleUpdateAsset = async (index: number, field: keyof Asset, value: number | string | boolean) => {
    const updated = [...assets];
    if (field === 'symbol') {
      const oldSymbol = updated[index].symbol;
      const newSymbol = (value as string).trim().toUpperCase();
      
      // Check if it's an ambiguous symbol
      if (isAmbiguousSymbol(newSymbol)) {
        setDisambiguationDialog({
          index,
          symbol: newSymbol,
          field: 'symbol'
        });
        return;
      }
      
      // Check if it's a crypto alias and auto-convert
      let finalSymbol = newSymbol;
      if (isCryptoAlias(newSymbol)) {
        const cryptoSymbol = getCryptoSymbol(newSymbol, 'binance');
        if (cryptoSymbol) {
          finalSymbol = cryptoSymbol;
        }
      }
      
      updated[index].symbol = finalSymbol;
      
      // If symbol changed and is not empty, fetch price
      if (oldSymbol !== finalSymbol && finalSymbol.trim() !== '') {
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
          const errorMessage = error instanceof Error ? error.message : `Unable to fetch price for ${value}. Enter price manually.`;
          setPriceError(errorMessage);
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
      // Always update shares when value changes and price is available
      if (updated[index].currentPrice && updated[index].currentPrice > 0) {
        updated[index].shares = Math.round(((value as number) / updated[index].currentPrice!) * 1000000) / 1000000;
      }
    } else if (field === 'shares') {
      updated[index].shares = value as number;
      // Always update value when shares change and price is available
      if (updated[index].currentPrice && updated[index].currentPrice > 0) {
        updated[index].currentValue = Math.round(((value as number) * updated[index].currentPrice!) * 100) / 100;
      }
    } else if (field === 'targetPercentage') {
      updated[index].targetPercentage = value as number;
    } else if (field === 'currentPrice') {
      updated[index].currentPrice = value as number;
      // When price is manually set, prioritize shares if they exist, otherwise use value
      if ((value as number) > 0) {
        if (updated[index].shares && updated[index].shares > 0) {
          // Update value based on existing shares
          updated[index].currentValue = Math.round((updated[index].shares! * (value as number)) * 100) / 100;
        } else if (updated[index].currentValue > 0) {
          // Calculate shares from existing value
          updated[index].shares = Math.round((updated[index].currentValue / (value as number)) * 1000000) / 1000000;
        }
      }
    } else if (field === 'lastUpdated') {
      updated[index].lastUpdated = value as string;
    } else if (field === 'priceSource') {
      updated[index].priceSource = value as 'api' | 'manual';
    } else if (field === 'noSell') {
      updated[index].noSell = value as boolean;
    }
    setAssets(updated);
  };
  
  const handleRemoveAsset = (index: number) => {
    if (assets.length <= 2) return;
    setAssets(assets.filter((_, i) => i !== index));
  };
  
  const currentTotal = useMemo(() => assets.reduce((sum, asset) => sum + asset.currentValue, 0), [assets]);
  const newTotal = useMemo(() => currentTotal + newMoney, [currentTotal, newMoney]);
  
  // State for animated gradient color
  const [gradientColor, setGradientColor] = useState({ r: 16, g: 185, b: 129 });
  const animationFrameRef = useRef<number>();
  
  // Calculate target allocation quality color
  const targetColor = useMemo(() => {
    if (allocations.length === 0) return { r: 16, g: 185, b: 129 }; // Default to green
    
    const totalDifference = allocations.reduce((sum, allocation) => {
      return sum + Math.abs(allocation.difference);
    }, 0);
    
    const avgDifference = totalDifference / allocations.length;
    
    // Smooth color transition based on average difference
    // 0% = green, 1.75% = yellow, 3.5%+ = red
    if (avgDifference <= 1.75) {
      // Green to yellow transition
      const t = avgDifference / 1.75;
      return {
        r: Math.round(16 + (251 - 16) * t),
        g: Math.round(185 + (191 - 185) * t),
        b: Math.round(129 + (36 - 129) * t)
      };
    } else {
      // Yellow to red transition
      const t = Math.min((avgDifference - 1.75) / 1.75, 1);
      return {
        r: Math.round(251 + (239 - 251) * t),
        g: Math.round(191 + (68 - 191) * t),
        b: Math.round(36 + (68 - 36) * t)
      };
    }
  }, [allocations]);
  
  // Animate color transition
  useEffect(() => {
    const animate = () => {
      setGradientColor(current => {
        const dr = targetColor.r - current.r;
        const dg = targetColor.g - current.g;
        const db = targetColor.b - current.b;
        
        // If close enough, snap to target
        if (Math.abs(dr) < 1 && Math.abs(dg) < 1 && Math.abs(db) < 1) {
          return targetColor;
        }
        
        // Otherwise, move towards target (slower transition)
        return {
          r: current.r + dr * 0.02,
          g: current.g + dg * 0.02,
          b: current.b + db * 0.02
        };
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetColor]);
  
  const handleShare = useCallback(async () => {
    const url = encodePortfolioToUrl(assets, newMoney, enableSelling);
    const success = await copyToClipboard(url);
    if (success) {
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 3000);
    }
  }, [assets, newMoney, enableSelling]);
  
  const handleRefreshPrices = useCallback(async () => {
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
          updatedAsset.currentValue = Math.round((updatedAsset.shares * data.price) * 100) / 100;
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
      const errorMessage = error instanceof Error ? error.message : 'Unable to fetch prices. Please enter them manually.';
      setPriceError(errorMessage);
      console.error('Price fetch error:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  }, [assets]);
  
  const handleDisambiguationChoice = async (choice: 'stock' | 'crypto', exchange?: 'binance' | 'coinbase') => {
    if (!disambiguationDialog) return;
    
    const { index, symbol, field, newAsset } = disambiguationDialog;
    
    if (field === 'add' && newAsset) {
      // Handle adding new asset
      let finalSymbol = symbol;
      if (choice === 'crypto' && exchange) {
        const cryptoSymbol = getCryptoSymbol(symbol, exchange);
        if (cryptoSymbol) {
          finalSymbol = cryptoSymbol;
        }
      }
      
      const assetWithDefaults: Asset = { ...newAsset, symbol: finalSymbol, currentValue: 0 };
      setAssets([...assets, assetWithDefaults]);
      
      // Fetch price for the new asset
      if (finalSymbol !== '') {
        const priceData = await priceService.fetchPrice(finalSymbol);
        if (priceData) {
          setAssets(prevAssets => {
            const updatedAssets = [...prevAssets];
            const newAssetIndex = updatedAssets.length - 1;
            if (updatedAssets[newAssetIndex].symbol === finalSymbol) {
              updatedAssets[newAssetIndex] = {
                ...updatedAssets[newAssetIndex],
                currentPrice: priceData.price,
                lastUpdated: priceData.timestamp,
                priceSource: 'api'
              };
            }
            return updatedAssets;
          });
          setLastPriceUpdate(new Date().toISOString());
        }
      }
    } else if (field === 'symbol') {
      // Handle updating existing asset
      let finalSymbol = symbol;
      if (choice === 'crypto' && exchange) {
        const cryptoSymbol = getCryptoSymbol(symbol, exchange);
        if (cryptoSymbol) {
          finalSymbol = cryptoSymbol;
        }
      }
      
      const updated = [...assets];
      updated[index].symbol = finalSymbol;
      
      // If symbol changed and is not empty, fetch price
      if (finalSymbol !== '') {
        setIsLoadingPrices(true);
        setPriceError(undefined);
        
        try {
          const priceData = await priceService.fetchPrice(finalSymbol);
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
          console.error(`Failed to fetch price for ${finalSymbol}:`, error);
          const errorMessage = error instanceof Error ? error.message : `Unable to fetch price for ${finalSymbol}. Enter price manually.`;
          setPriceError(errorMessage);
        } finally {
          setIsLoadingPrices(false);
        }
      }
      
      setAssets(updated);
    }
    
    setDisambiguationDialog(null);
  };
  
  return (
    <>
      {/* Subtle gradient indicator in bottom right */}
      <div 
        className="fixed bottom-0 right-0 pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse 80% 80% at 90% 90%, 
            rgba(${Math.round(gradientColor.r)}, ${Math.round(gradientColor.g)}, ${Math.round(gradientColor.b)}, 0.08) 0%, 
            rgba(${Math.round(gradientColor.r)}, ${Math.round(gradientColor.g)}, ${Math.round(gradientColor.b)}, 0.06) 10%,
            rgba(${Math.round(gradientColor.r)}, ${Math.round(gradientColor.g)}, ${Math.round(gradientColor.b)}, 0.045) 20%,
            rgba(${Math.round(gradientColor.r)}, ${Math.round(gradientColor.g)}, ${Math.round(gradientColor.b)}, 0.035) 30%,
            rgba(${Math.round(gradientColor.r)}, ${Math.round(gradientColor.g)}, ${Math.round(gradientColor.b)}, 0.025) 40%,
            rgba(${Math.round(gradientColor.r)}, ${Math.round(gradientColor.g)}, ${Math.round(gradientColor.b)}, 0.015) 50%,
            rgba(${Math.round(gradientColor.r)}, ${Math.round(gradientColor.g)}, ${Math.round(gradientColor.b)}, 0.008) 60%,
            rgba(${Math.round(gradientColor.r)}, ${Math.round(gradientColor.g)}, ${Math.round(gradientColor.b)}, 0.004) 70%,
            rgba(${Math.round(gradientColor.r)}, ${Math.round(gradientColor.g)}, ${Math.round(gradientColor.b)}, 0.002) 80%,
            rgba(0, 0, 0, 0) 90%)`,
          zIndex: 1
        }}
      />
      
      <Header 
        newMoney={newMoney} 
        onNewMoneyChange={setNewMoney} 
        enableSelling={enableSelling}
        onEnableSellingChange={setEnableSelling}
      />
      
      <div className="min-h-screen pt-32 sm:pt-32 pb-8 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Portfolio Management */}
            <div className="lg:col-span-2 space-y-6 relative z-10 lg:pr-4 lg:pb-8">
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
                enableSelling={enableSelling}
              />
              
              <AddAsset
                onAddAsset={handleAddAsset}
                currentAssetsCount={assets.length}
                enableSelling={enableSelling}
              />
            </div>
            
            {/* Right Column - Calculations */}
            <div className="space-y-6 relative z-0 overflow-visible">
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
                  <GlassCard variant="light" padding="lg" animate allowOverflow={true}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-100 relative">
                        How to Allocate <AnimatedNumber value={newMoney} prefix="$" className="text-emerald-400" />
                        <span className="ml-2 text-gray-500 cursor-help group/tooltip relative">
                          <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg" style={{zIndex: 9999}}>
                            {enableSelling 
                              ? assets.some(a => a.noSell)
                                ? 'Buy and sell amounts (respecting locked assets)'
                                : 'Buy and sell amounts to achieve perfect target allocation'
                              : 'Recommended amounts to invest in each asset to maintain your target allocation'}
                          </span>
                        </span>
                      </h2>
                      <button
                        onClick={() => setShowSharesInAllocation(!showSharesInAllocation)}
                        className="p-1.5 rounded-lg glass-light hover:bg-white/10 transition-colors duration-200 relative group/tooltip"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg" style={{zIndex: 9999}}>
                          {showSharesInAllocation ? 'Hide' : 'Show'} share quantities
                        </span>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {isLoadingPrices && allocations.length === 0 ? (
                        <>
                          <div className="flex justify-between items-center py-2 sm:py-3 border-b border-white/5">
                            <Skeleton width="60px" height="20px" />
                            <Skeleton width="80px" height="20px" />
                          </div>
                          <div className="flex justify-between items-center py-2 sm:py-3 border-b border-white/5">
                            <Skeleton width="60px" height="20px" />
                            <Skeleton width="80px" height="20px" />
                          </div>
                          <div className="flex justify-between items-center py-2 sm:py-3 border-b border-white/5">
                            <Skeleton width="60px" height="20px" />
                            <Skeleton width="80px" height="20px" />
                          </div>
                        </>
                      ) : (
                        allocations.map((allocation, index) => {
                          const asset = assets.find(a => a.symbol === allocation.symbol);
                          const shares = asset?.currentPrice && asset.currentPrice > 0 
                            ? Math.abs(allocation.amountToAdd) / asset.currentPrice 
                            : null;
                          const isSelling = allocation.amountToAdd < 0;
                          
                          return (
                            <div
                              key={allocation.symbol}
                              className="flex justify-between items-center py-2 sm:py-3 border-b border-white/5 last:border-0 animate-slide-up"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <span className="font-medium text-gray-200 text-sm sm:text-base">{getDisplayName(allocation.symbol)}</span>
                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-0 sm:gap-2">
                                {isSelling && (
                                  <span className="text-red-400 text-xs sm:text-sm mr-1">Sell</span>
                                )}
                                <AnimatedNumber
                                  value={Math.abs(allocation.amountToAdd)}
                                  prefix="$"
                                  className={`font-semibold text-sm sm:text-base ${isSelling ? 'text-red-400' : 'text-emerald-400'}`}
                                />
                                {showSharesInAllocation && shares !== null && (
                                  <span className="text-gray-500 text-xs sm:text-sm">
                                    ({shares < 1 ? shares.toFixed(4) : shares.toFixed(2)} shares)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div className="flex justify-between items-start pt-4 mt-4 border-t border-white/10">
                        <span className="font-bold text-gray-100 mt-1">
                          {enableSelling ? 'Net Investment' : 'Total'}
                        </span>
                        <div className="flex flex-col items-end">
                          <AnimatedNumber
                            value={allocations.reduce((sum, a) => sum + a.amountToAdd, 0)}
                            prefix="$"
                            className="text-emerald-400 font-bold text-lg"
                          />
                          {enableSelling && (
                            <div className="text-xs text-gray-500 mt-1">
                              Buy: ${allocations.filter(a => a.amountToAdd > 0).reduce((sum, a) => sum + a.amountToAdd, 0).toFixed(2)} | 
                              Sell: ${Math.abs(allocations.filter(a => a.amountToAdd < 0).reduce((sum, a) => sum + a.amountToAdd, 0)).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                  
                  <GlassCard variant="dark" padding="lg" animate allowOverflow={true}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-100 relative">
                        After Investment
                        <span className="ml-2 text-gray-500 cursor-help group/tooltip relative">
                          <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg" style={{zIndex: 9999}}>
                            Your portfolio values and allocations<br/>after investing the new money
                          </span>
                        </span>
                      </h3>
                      <button
                        onClick={handleShare}
                        className="p-1.5 rounded-lg glass-light hover:bg-white/10 transition-colors duration-200 relative group/tooltip"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        <span className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50" style={{zIndex: 9999}}>
                          Copy shareable link to clipboard
                        </span>
                        {showShareSuccess && (
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-xs text-green-400 rounded whitespace-nowrap">
                            Copied!
                          </span>
                        )}
                      </button>
                    </div>
                    {enableSelling ? (
                      <div className="text-xs text-gray-400 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></span>
                        <span>
                          {assets.some(a => a.noSell) 
                            ? 'Assets balanced (some locked from selling)'
                            : 'All assets perfectly balanced at target allocation'
                          }
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 mb-4 flex flex-wrap items-center gap-2 sm:gap-4">
                        <span className="flex items-center gap-1 cursor-help group/tooltip relative">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></span>
                          <span className="hidden sm:inline">On target</span>
                          <span className="sm:hidden">On</span>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg" style={{zIndex: 9999}}>
                            Less than 0.5% difference<br/>from target allocation
                          </span>
                        </span>
                        <span className="flex items-center gap-1 cursor-help group/tooltip relative">
                          <span className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></span>
                          <span className="hidden sm:inline">Slightly off</span>
                          <span className="sm:hidden">Off</span>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg" style={{zIndex: 9999}}>
                            0.5% to 2% difference<br/>from target allocation
                          </span>
                        </span>
                        <span className="flex items-center gap-1 cursor-help group/tooltip relative">
                          <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></span>
                          <span className="hidden sm:inline">Needs rebalancing</span>
                          <span className="sm:hidden">Rebalance</span>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg" style={{zIndex: 9999}}>
                            More than 2% difference<br/>from target allocation
                          </span>
                        </span>
                      </div>
                    )}
                    <div className="space-y-3">
                      {isLoadingPrices && allocations.length === 0 ? (
                        <>
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="glass-light p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <Skeleton variant="circular" width="8px" height="8px" />
                                  <Skeleton width="60px" height="16px" />
                                </div>
                                <div className="text-right">
                                  <Skeleton width="80px" height="20px" />
                                  <div className="mt-2">
                                    <Skeleton width="120px" height="14px" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        allocations.map((allocation, index) => {
                        const asset = assets.find(a => a.symbol === allocation.symbol);
                        const currentPercentage = currentTotal > 0 ? ((asset?.currentValue || 0) / currentTotal) * 100 : 0;
                        const absDiff = Math.abs(allocation.difference);
                        let statusColor = 'bg-emerald-400';
                        let textColor = 'text-emerald-400';
                        
                        // Show color status based on difference from target
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
                            className="glass-light p-2 sm:p-3 rounded-lg animate-slide-up"
                            style={{ animationDelay: `${index * 50 + 300}ms` }}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-2 h-2 ${statusColor} rounded-full flex-shrink-0`}></span>
                                <span className="font-medium text-sm sm:text-base truncate">{getDisplayName(allocation.symbol)}</span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <AnimatedNumber
                                  value={allocation.newValue}
                                  prefix="$"
                                  className="font-semibold text-sm sm:text-base"
                                />
                                <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center justify-end gap-1 sm:gap-2">
                                  <span className="px-1 py-0.5 bg-gray-700/50 rounded text-gray-400 text-[10px] sm:text-xs cursor-help group/percent relative">
                                    {currentPercentage.toFixed(1)}%
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/percent:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg" style={{zIndex: 9999}}>
                                      Current allocation
                                    </span>
                                  </span>
                                  <svg className="w-2 h-2 sm:w-3 sm:h-3 text-gray-500 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  <span className="px-1 py-0.5 bg-gray-800/50 rounded text-gray-300 text-[10px] sm:text-xs cursor-help group/newpercent relative">
                                    {allocation.newPercentage.toFixed(1)}%
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/newpercent:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg" style={{zIndex: 9999}}>
                                      New allocation after investment
                                    </span>
                                  </span>
                                  <span className={`font-medium ${textColor} text-[10px] sm:text-xs cursor-help group/diff relative`}>
                                    ({allocation.difference > 0 ? '+' : ''}{allocation.difference.toFixed(1)}%)
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/diff:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg" style={{zIndex: 9999}}>
                                      Difference from target ({allocation.targetPercentage.toFixed(1)}%)
                                      {enableSelling && asset?.noSell && (<><br/><span className="text-amber-400">Asset locked - no selling</span></>)}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                      )}
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
      
      {disambiguationDialog && (
        <AssetTypeDialog
          symbol={disambiguationDialog.symbol}
          onSelectStock={() => handleDisambiguationChoice('stock')}
          onSelectCrypto={(exchange) => handleDisambiguationChoice('crypto', exchange)}
          onCancel={() => setDisambiguationDialog(null)}
        />
      )}
      <Analytics />
      <SpeedInsights />
    </>
  );
};

export default PortfolioRebalancer;