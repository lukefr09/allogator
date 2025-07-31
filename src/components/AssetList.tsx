import React, { useState } from 'react';
import { Asset, ViewMode } from '../types';
import GlassCard from './GlassCard';
import ViewModeToggle from './ViewModeToggle';
import Skeleton from './Skeleton';
import { formatCurrency } from '../utils/formatters';
import { getDisplayName } from '../utils/displayNames';

interface AssetListProps {
  assets: Asset[];
  onUpdateAsset: (index: number, field: keyof Asset, value: number | string) => void;
  onRemoveAsset: (index: number) => void;
  totalPercentage: number;
  onRefreshPrices?: () => void;
  lastPriceUpdate?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  priceError?: string;
  isLoadingPrices?: boolean;
}

const AssetList: React.FC<AssetListProps> = ({ 
  assets, 
  onUpdateAsset, 
  onRemoveAsset,
  totalPercentage,
  onRefreshPrices,
  lastPriceUpdate,
  viewMode,
  onViewModeChange,
  priceError,
  isLoadingPrices = false
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [manualPriceIndex, setManualPriceIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isValidTotal = Math.abs(totalPercentage - 100) < 0.01;
  const currentTotal = assets.reduce((sum, asset) => sum + asset.currentValue, 0);

  return (
    <GlassCard variant="dark" padding="lg" className="mb-8" allowOverflow={true}>
      {/* Header */}
      <div className="mb-6 relative z-20">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-1">Portfolio Assets</h2>
            <p className="text-sm text-gray-400">
              Current Value: <span className="text-white font-semibold tabular-nums">{formatCurrency(currentTotal)}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            {lastPriceUpdate && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="hidden sm:inline">Prices updated: {new Date(lastPriceUpdate).toLocaleTimeString()}</span>
                <span className="sm:hidden">{new Date(lastPriceUpdate).toLocaleTimeString()}</span>
              {onRefreshPrices && (
                <button
                  onClick={async () => {
                    setIsRefreshing(true);
                    await onRefreshPrices();
                    setIsRefreshing(false);
                  }}
                  disabled={isRefreshing || isLoadingPrices}
                  className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
                  title={isLoadingPrices ? "Loading prices..." : "Refresh prices"}
                >
                  <svg 
                    className={`w-3 h-3 ${isRefreshing || isLoadingPrices ? 'animate-spin' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          )}
            <div className="flex items-center gap-2">
              <div className={`glass-light px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium ${isValidTotal ? 'text-emerald-400' : 'text-red-400'}`}>
                <span className="text-gray-400 mr-1">Total:</span>
                {totalPercentage.toFixed(1)}%
              </div>
              <ViewModeToggle 
                viewMode={viewMode} 
                onViewModeChange={onViewModeChange} 
              />
            </div>
          </div>
        </div>
      </div>
      
      {priceError && (
        <div className="glass-light border-yellow-500/20 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-yellow-400 text-sm">{priceError}</span>
        </div>
      )}
      
      {assets.length < 2 && (
        <div className="glass-light border-yellow-500/20 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-yellow-400 text-sm font-medium">Minimum 2 assets required for a portfolio</span>
        </div>
      )}
      
      {/* Asset List */}
      <div className="space-y-4 animate-stagger overflow-visible">
        {assets.map((asset, index) => (
          <div
            key={index}
            className={`group glass-light p-5 rounded-xl transition-all duration-300 border-b border-white/5 last:border-b-0 overflow-visible ${
              hoveredIndex === index ? 'scale-[1.01] shadow-lg' : ''
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="space-y-4">
              {/* Symbol and Price Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Symbol Input */}
                <div className="w-full sm:w-44 overflow-visible">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 relative">
                    Symbol
                    <span className="ml-1 text-gray-500 cursor-help group/tooltip relative">
                      ⓘ
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none" style={{zIndex: 1000}}>
                        The ticker symbol for your asset<br/>(e.g., AAPL, VOO, BTC)
                      </span>
                    </span>
                  </label>
                <input
                  type="text"
                  defaultValue={getDisplayName(asset.symbol)}
                  key={`symbol-${index}-${asset.symbol}`} // Force re-render when symbol changes externally
                  onBlur={(e) => {
                    const newSymbol = e.target.value.toUpperCase();
                    const currentDisplayName = getDisplayName(asset.symbol).toUpperCase();
                    if (newSymbol !== currentDisplayName) {
                      onUpdateAsset(index, 'symbol', newSymbol);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur(); // Trigger blur to save
                    }
                  }}
                  className="glass-input w-full font-semibold tabular-nums"
                  placeholder="AAPL"
                />
                <div className="mt-2 h-5 text-xs text-gray-500 flex items-center justify-between relative" style={{zIndex: 999}}>
                  {asset.symbol && !asset.currentPrice && isLoadingPrices ? (
                    <Skeleton width="120px" height="14px" />
                  ) : asset.currentPrice ? (
                    <>
                      <div className="truncate">
                        <span className="font-medium text-gray-400">{getDisplayName(asset.symbol)}</span>
                        <span className="mx-1 hidden sm:inline">@</span>
                        <span className="font-medium text-gray-300 ml-1 sm:ml-0">{formatCurrency(asset.currentPrice)}</span>
                        {asset.priceSource === 'manual' && (
                          <span className="ml-1 text-yellow-400 hidden sm:inline">(manual)</span>
                        )}
                      </div>
                      {manualPriceIndex === index ? (
                        <div className="flex items-center gap-2 ml-2">
                          <input
                            type="number"
                            placeholder="Price"
                            className="glass-input text-xs px-2 py-0.5 w-16"
                            step="0.01"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const price = parseFloat(e.currentTarget.value);
                                if (price > 0) {
                                  onUpdateAsset(index, 'currentPrice', price);
                                  onUpdateAsset(index, 'priceSource', 'manual');
                                  onUpdateAsset(index, 'lastUpdated', new Date().toISOString());
                                }
                                setManualPriceIndex(null);
                              } else if (e.key === 'Escape') {
                                setManualPriceIndex(null);
                              }
                            }}
                          />
                          <button
                            onClick={() => setManualPriceIndex(null)}
                            className="text-gray-500 hover:text-gray-400 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setManualPriceIndex(index)}
                          className="text-xs text-gray-500 hover:text-gray-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-2 p-1"
                          title="Set price manually"
                        >
                          ✎
                        </button>
                      )}
                    </>
                  ) : null}
                  </div>
                </div>
                
                {/* Current Value/Shares Input */}
                <div className="w-full sm:w-44 overflow-visible">
                {viewMode === 'money' ? (
                  <>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 relative">
                      Current Value
                      <span className="ml-1 text-gray-500 cursor-help group/tooltip relative">
                        ⓘ
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none" style={{zIndex: 1000}}>
                          The total dollar value of this asset<br/>in your current portfolio
                        </span>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        defaultValue={asset.currentValue.toString()}
                        key={`value-${index}-${asset.currentValue}`} // Force re-render when value changes externally
                        onChange={(e) => {
                          // Just store the value temporarily, don't validate yet
                          e.target.dataset.tempValue = e.target.value;
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          const numValue = parseFloat(value) || 0;
                          onUpdateAsset(index, 'currentValue', numValue);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur(); // Trigger blur to save
                          }
                        }}
                        className="glass-input w-full pl-8 font-medium tabular-nums text-base"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500 overflow-visible relative" style={{zIndex: 999}}>
                      {asset.symbol && !asset.currentPrice && isLoadingPrices ? (
                        <Skeleton width="140px" height="14px" />
                      ) : asset.currentPrice && asset.currentValue > 0 ? (
                        <div className="truncate">
                          <span className="font-medium text-gray-400">
                            {(asset.shares || (asset.currentValue / asset.currentPrice)).toFixed(3)}
                          </span>
                          <span className="ml-1">shares</span>
                          <span className="mx-1 hidden sm:inline">=</span>
                          <span className="font-medium text-gray-300 ml-1 sm:ml-0 hidden sm:inline">{formatCurrency(asset.currentValue)}</span>
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 relative">
                      Shares
                      <span className="ml-1 text-gray-500 cursor-help group/tooltip relative">
                        ⓘ
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none" style={{zIndex: 1000}}>
                          The number of shares you own<br/>(requires price to be set)
                        </span>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">#</span>
                      <input
                        type="number"
                        defaultValue={asset.shares ? (Math.round(asset.shares * 1000000) / 1000000).toString() : ''}
                        key={`shares-${index}-${asset.shares}`} // Force re-render when shares change externally
                        onChange={(e) => {
                          // Just store the value temporarily, don't validate yet
                          e.target.dataset.tempValue = e.target.value;
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            onUpdateAsset(index, 'shares', 0);
                          } else {
                            // Parse and limit to 6 decimal places
                            let numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              // Round to 6 decimal places
                              numValue = Math.round(numValue * 1000000) / 1000000;
                              onUpdateAsset(index, 'shares', numValue);
                              // Update the display value
                              e.target.value = numValue.toString();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur(); // Trigger blur to save
                          }
                        }}
                        className="glass-input w-full pl-8 font-medium tabular-nums text-base"
                        placeholder="0.000000"
                        step="0.000001"
                        min="0"
                        disabled={!asset.currentPrice}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500 overflow-visible relative" style={{zIndex: 999}}>
                      {asset.currentPrice && asset.shares && asset.shares > 0 ? (
                        <div className="truncate">
                          <span className="font-medium text-gray-400">{asset.shares.toFixed(3)}</span>
                          <span className="ml-1">shares</span>
                          <span className="mx-1 hidden sm:inline">=</span>
                          <span className="font-medium text-gray-300 ml-1 sm:ml-0 hidden sm:inline">{formatCurrency(asset.shares * asset.currentPrice)}</span>
                        </div>
                      ) : !asset.currentPrice ? (
                        <span className="text-red-400/80">Price needed</span>
                      ) : null}
                    </div>
                  </>
                )}
                </div>
              </div>
              
              {/* Target % and Remove Button Row */}
              <div className="flex gap-3 items-end">
                {/* Target Percentage Input */}
                <div className="flex-1 sm:w-32">
                <label className="block text-xs font-medium text-gray-400 mb-1.5 relative">
                  Target %
                  <span className="ml-1 text-gray-500 cursor-help group/tooltip relative">
                    ⓘ
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none" style={{zIndex: 1000}}>
                      The percentage of your total portfolio<br/>you want this asset to represent
                    </span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue={(asset.targetPercentage * 100).toFixed(1)}
                    key={`target-${index}-${asset.targetPercentage}`} // Force re-render when target changes externally
                    onChange={(e) => {
                      // Just store the value temporarily, don't validate yet
                      e.target.dataset.tempValue = e.target.value;
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      const numValue = parseFloat(value) || 0;
                      onUpdateAsset(index, 'targetPercentage', numValue / 100);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur(); // Trigger blur to save
                      }
                    }}
                    className="glass-input w-full pr-8 font-medium tabular-nums"
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                </div>
                </div>
                
                {/* Remove Button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => onRemoveAsset(index)}
                    className={`
                      p-3 rounded-lg transition-all duration-200
                      ${assets.length <= 2 
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:scale-110 active:scale-95'
                      }
                    `}
                    disabled={assets.length <= 2}
                    title={assets.length <= 2 ? "Minimum 2 assets required" : "Remove asset"}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Current allocation info */}
            <div className="mt-4 pt-4 border-t border-white/5">
              {currentTotal > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Current allocation</span>
                  <span className="px-2 py-1 bg-gray-800/50 rounded text-gray-300 font-medium tabular-nums text-xs cursor-help group/tooltip relative">
                    {((asset.currentValue / currentTotal) * 100).toFixed(1)}%
                    <span className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none" style={{zIndex: 1000}}>
                      Current: {((asset.currentValue / currentTotal) * 100).toFixed(1)}%<br/>
                      Target: {(asset.targetPercentage * 100).toFixed(1)}%<br/>
                      Difference: {(((asset.currentValue / currentTotal) - asset.targetPercentage) * 100).toFixed(1)}%
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {!isValidTotal && (
        <div className="mt-4 glass-light border-red-500/20 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-400 text-sm font-medium">Target percentages must total 100%</span>
        </div>
      )}
    </GlassCard>
  );
};

export default AssetList;