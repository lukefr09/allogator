import React, { useState, useRef } from 'react';
import { Asset } from '../types';
import GlassCard from './GlassCard';

interface AddAssetProps {
  onAddAsset: (asset: Omit<Asset, 'currentValue'>) => void;
  currentAssetsCount: number;
}

const AddAsset: React.FC<AddAssetProps> = ({ onAddAsset, currentAssetsCount }) => {
  const [symbol, setSymbol] = useState('');
  const [targetPercentage, setTargetPercentage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const symbolInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentAssetsCount >= 20) {
      return;
    }

    const percentage = parseFloat(targetPercentage);
    if (!symbol || isNaN(percentage) || percentage <= 0 || percentage > 100) {
      return;
    }

    setIsAdding(true);
    
    // Simulate adding animation
    setTimeout(() => {
      onAddAsset({
        symbol: symbol.toUpperCase(),
        targetPercentage: percentage / 100
      });

      setSymbol('');
      setTargetPercentage('');
      setIsAdding(false);
      
      // Focus back on symbol input
      symbolInputRef.current?.focus();
    }, 300);
  };

  const isMaxAssets = currentAssetsCount >= 20;

  return (
    <GlassCard variant="default" padding="md" className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Add New Asset</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Assets:</span>
          <span className={`text-sm font-medium ${isMaxAssets ? 'text-red-400' : 'text-gray-400'}`}>
            {currentAssetsCount}/20
          </span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            ref={symbolInputRef}
            type="text"
            placeholder="Symbol (e.g., SPY)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="glass-input w-full uppercase font-semibold"
            maxLength={10}
            disabled={isMaxAssets}
          />
          {symbol && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 text-emerald-400 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="w-32 relative">
          <input
            type="number"
            placeholder="Target %"
            value={targetPercentage}
            onChange={(e) => setTargetPercentage(e.target.value)}
            className="glass-input w-full pr-8 font-medium tabular-nums"
            step="0.1"
            min="0.1"
            max="100"
            disabled={isMaxAssets}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
        </div>
        
        <button
          type="submit"
          className={`
            relative px-6 py-3 font-medium rounded-lg transition-all duration-300
            ${isMaxAssets 
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
              : isAdding
                ? 'bg-emerald-600 text-white scale-95'
                : 'btn-primary'
            }
          `}
          disabled={isMaxAssets || isAdding || !symbol || !targetPercentage}
        >
          <span className={`transition-opacity duration-200 ${isAdding ? 'opacity-0' : 'opacity-100'}`}>
            Add Asset
          </span>
          {isAdding && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </button>
      </form>
      
      {isMaxAssets && (
        <div className="mt-3 glass-light border-red-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 text-sm">Maximum of 20 assets reached</p>
        </div>
      )}
      
      {!symbol && !targetPercentage && !isMaxAssets && (
        <p className="text-xs text-gray-500 mt-3">
          Tip: Press Tab to move between fields, Enter to add
        </p>
      )}
    </GlassCard>
  );
};

export default AddAsset;