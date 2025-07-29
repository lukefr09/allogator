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
          <ViewModeToggle 
            viewMode={viewMode} 
            onViewModeChange={onViewModeChange} 
          />
          {onRefreshPrices && (
            <button
              onClick={async () => {
                setIsRefreshing(true);
                await onRefreshPrices();
                setIsRefreshing(false);
              }}
              disabled={isRefreshing}
              className="glass-button px-3 py-1.5 text-sm flex items-center gap-2"
            >
              <svg 
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
            </button>
          )}
          <div className={`glass-light px-4 py-2 rounded-lg text-sm font-medium ${isValidTotal ? 'text-emerald-400' : 'text-red-400'}`}>
            <span className="text-gray-400 mr-2">Target Total:</span>
            {totalPercentage.toFixed(1)}%
          </div>
        </div>
      </div>
      
      {lastPriceUpdate && (
        <div className="text-xs text-gray-500 mb-4">
          Prices last updated: {new Date(lastPriceUpdate).toLocaleString()}
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
      <div className="space-y-3 animate-stagger">
        {assets.map((asset, index) => (
          <div
            key={index}
            className={`glass-light p-4 rounded-xl transition-all duration-300 ${
              hoveredIndex === index ? 'scale-[1.01] shadow-lg' : ''
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex gap-4 items-center">
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
                {asset.currentPrice && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Price:</span>
                    <span className="text-xs font-medium text-gray-300">
                      ${asset.currentPrice.toFixed(2)}
                    </span>
                    {asset.priceSource === 'manual' && (
                      <span className="text-xs text-yellow-400">(manual)</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Current Value/Shares Input */}
              <div className="w-36">
                {viewMode === 'money' ? (
                  <>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Current Value</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={asset.currentValue}
                        onChange={(e) => onUpdateAsset(index, 'currentValue', parseFloat(e.target.value) || 0)}
                        className="glass-input w-full pl-8 font-medium tabular-nums"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    {asset.currentPrice && asset.currentValue > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        ~{(asset.currentValue / asset.currentPrice).toFixed(4)} shares
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Shares</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">#</span>
                      <input
                        type="number"
                        value={asset.shares || 0}
                        onChange={(e) => onUpdateAsset(index, 'shares', parseFloat(e.target.value) || 0)}
                        className="glass-input w-full pl-8 font-medium tabular-nums"
                        placeholder="0.0000"
                        step="0.0001"
                        min="0"
                        disabled={!asset.currentPrice}
                      />
                    </div>
                    {asset.currentPrice && asset.shares && asset.shares > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        ~${(asset.shares * asset.currentPrice).toFixed(2)} value
                      </div>
                    )}
                    {!asset.currentPrice && (
                      <div className="mt-1 text-xs text-red-400">
                        Price needed for shares
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Target Percentage Input */}
              <div className="w-32">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Target %</label>
                <div className="relative">
                  <input
                    type="number"
                    value={(asset.targetPercentage * 100).toFixed(1)}
                    onChange={(e) => onUpdateAsset(index, 'targetPercentage', (parseFloat(e.target.value) || 0) / 100)}
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
            
            {/* Current allocation info and manual price entry */}
            <div className="mt-3 pt-3 border-t border-white/5">
              {currentTotal > 0 && (
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-500">Current allocation</span>
                  <span className="text-gray-400 font-medium tabular-nums">
                    {((asset.currentValue / currentTotal) * 100).toFixed(1)}% of portfolio
                  </span>
                </div>
              )}
              {manualPriceIndex === index ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Enter price"
                    className="glass-input text-xs px-2 py-1 w-24"
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
                    className="text-gray-400 hover:text-gray-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setManualPriceIndex(index)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Set price manually
                </button>
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