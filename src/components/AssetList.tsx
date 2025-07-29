import React, { useState } from 'react';
import { Asset, ViewMode } from '../types';
import GlassCard from './GlassCard';
import ViewModeToggle from './ViewModeToggle';

interface AssetListProps {
  assets: Asset[];
  onUpdateAsset: (index: number, field: keyof Asset, value: number | string) => void;
  onRemoveAsset: (index: number) => void;
  totalPercentage: number;
  onRefreshPrices?: () => void;
  lastPriceUpdate?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const AssetList: React.FC<AssetListProps> = ({ 
  assets, 
  onUpdateAsset, 
  onRemoveAsset,
  totalPercentage,
  onRefreshPrices,
  lastPriceUpdate,
  viewMode,
  onViewModeChange
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [manualPriceIndex, setManualPriceIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isValidTotal = Math.abs(totalPercentage - 100) < 0.01;
  const currentTotal = assets.reduce((sum, asset) => sum + asset.currentValue, 0);

  return (
    <GlassCard variant="dark" padding="lg" className="mb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-100 mb-1">Portfolio Assets</h2>
          <p className="text-sm text-gray-400">
            Current Portfolio Value: <span className="text-white font-semibold tabular-nums">${currentTotal.toFixed(2)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`glass-light px-4 py-2 rounded-lg text-sm font-medium ${isValidTotal ? 'text-emerald-400' : 'text-red-400'}`}>
            <span className="text-gray-400 mr-2">Target Total:</span>
            {totalPercentage.toFixed(1)}%
          </div>
          <ViewModeToggle 
            viewMode={viewMode} 
            onViewModeChange={onViewModeChange} 
          />
        </div>
      </div>
      
      {lastPriceUpdate && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <span>Prices last updated: {new Date(lastPriceUpdate).toLocaleString()}</span>
          {onRefreshPrices && (
            <button
              onClick={async () => {
                setIsRefreshing(true);
                await onRefreshPrices();
                setIsRefreshing(false);
              }}
              disabled={isRefreshing}
              className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
              title="Refresh prices"
            >
              <svg 
                className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} 
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
      
      {assets.length < 2 && (
        <div className="glass-light border-yellow-500/20 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-yellow-400 text-sm font-medium">Minimum 2 assets required for a portfolio</span>
        </div>
      )}
      
      {/* Asset List */}
      <div className="space-y-4 animate-stagger">
        {assets.map((asset, index) => (
          <div
            key={index}
            className={`group glass-light p-5 rounded-xl transition-all duration-300 border-b border-white/5 last:border-b-0 ${
              hoveredIndex === index ? 'scale-[1.01] shadow-lg' : ''
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex gap-4 items-start">
              {/* Symbol Input */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Symbol</label>
                <input
                  type="text"
                  value={asset.symbol}
                  onChange={(e) => onUpdateAsset(index, 'symbol', e.target.value.toUpperCase())}
                  className="glass-input w-full font-semibold text-lg tabular-nums"
                  placeholder="AAPL"
                />
                <div className="mt-2 h-5 text-xs text-gray-500 flex items-center justify-between">
                  {asset.currentPrice && (
                    <>
                      <div>
                        <span className="font-medium text-gray-400">{asset.symbol}</span>
                        <span className="mx-1">@</span>
                        <span className="font-medium text-gray-300">${asset.currentPrice.toFixed(2)}</span>
                        {asset.priceSource === 'manual' && (
                          <span className="ml-1 text-yellow-400">(manual)</span>
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
                          className="text-xs text-gray-500 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                          title="Set price manually"
                        >
                          ✎
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Current Value/Shares Input */}
              <div className="w-44">
                {viewMode === 'money' ? (
                  <>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Current Value</label>
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
                    <div className="mt-2 h-5 text-xs text-gray-500">
                      {asset.currentPrice && asset.currentValue > 0 && (
                        <>
                          <span className="font-medium text-gray-400">
                            {asset.shares ? asset.shares.toFixed(3) : (asset.currentValue / asset.currentPrice).toFixed(3)}
                          </span>
                          <span className="ml-1">shares</span>
                          <span className="mx-1">=</span>
                          <span className="font-medium text-gray-300">${asset.currentValue.toFixed(2)}</span>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Shares</label>
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
                    <div className="mt-2 h-5 text-xs text-gray-500">
                      {asset.currentPrice && asset.shares && asset.shares > 0 ? (
                        <>
                          <span className="font-medium text-gray-400">{asset.shares?.toFixed(3)}</span>
                          <span className="ml-1">shares</span>
                          <span className="mx-1">=</span>
                          <span className="font-medium text-gray-300">${(asset.shares * asset.currentPrice).toFixed(2)}</span>
                        </>
                      ) : !asset.currentPrice ? (
                        <span className="text-red-400/80">Price needed for shares</span>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
              
              {/* Target Percentage Input */}
              <div className="w-32 self-start">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Target %</label>
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
              <div className="pt-6">
                <button
                  onClick={() => onRemoveAsset(index)}
                  className={`
                    p-2.5 rounded-lg transition-all duration-200
                    ${assets.length <= 2 
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                      : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:scale-110 active:scale-95'
                    }
                  `}
                  disabled={assets.length <= 2}
                  title={assets.length <= 2 ? "Minimum 2 assets required" : "Remove asset"}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Current allocation info */}
            <div className="mt-4 pt-4 border-t border-white/5">
              {currentTotal > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Current allocation</span>
                  <span className="px-2 py-1 bg-gray-800/50 rounded text-gray-300 font-medium tabular-nums text-xs">
                    {((asset.currentValue / currentTotal) * 100).toFixed(1)}%
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