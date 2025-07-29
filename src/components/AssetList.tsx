import React, { useState } from 'react';
import { Asset } from '../types';
import GlassCard from './GlassCard';

interface AssetListProps {
  assets: Asset[];
  onUpdateAsset: (index: number, field: keyof Asset, value: number | string) => void;
  onRemoveAsset: (index: number) => void;
  totalPercentage: number;
}

const AssetList: React.FC<AssetListProps> = ({ 
  assets, 
  onUpdateAsset, 
  onRemoveAsset,
  totalPercentage 
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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
        <div className={`glass-light px-4 py-2 rounded-lg text-sm font-medium ${isValidTotal ? 'text-emerald-400' : 'text-red-400'}`}>
          <span className="text-gray-400 mr-2">Target Total:</span>
          {totalPercentage.toFixed(1)}%
        </div>
      </div>
      
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
              </div>
              
              {/* Current Value Input */}
              <div className="w-36">
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
            
            {/* Current allocation info */}
            {currentTotal > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Current allocation</span>
                  <span className="text-gray-400 font-medium tabular-nums">
                    {((asset.currentValue / currentTotal) * 100).toFixed(1)}% of portfolio
                  </span>
                </div>
              </div>
            )}
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