import React, { useState, useRef } from 'react';
import { Asset } from '../types';
import GlassCard from './GlassCard';
import { preventNumberInputScroll } from '../utils/preventNumberScroll';

interface AddAssetProps {
  onAddAsset: (asset: Omit<Asset, 'currentValue'>) => void | Promise<void>;
  currentAssetsCount: number;
  enableSelling?: boolean;
}

const AddAsset: React.FC<AddAssetProps> = ({ onAddAsset, currentAssetsCount, enableSelling = false }) => {
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
    const minPercentage = enableSelling ? 0 : 0.1;
    if (!symbol || isNaN(percentage) || percentage < minPercentage || percentage > 100) {
      return;
    }

    setIsAdding(true);
    
    // Add the asset (price will be fetched automatically)
    const addAsset = async () => {
      await onAddAsset({
        symbol: symbol.toUpperCase(),
        targetPercentage: percentage / 100
      });

      // Only reset if not showing disambiguation dialog
      setTimeout(() => {
        setSymbol('');
        setTargetPercentage('');
        setIsAdding(false);
        
        // Focus back on symbol input
        symbolInputRef.current?.focus();
      }, 100);
    };
    
    addAsset();
  };

  const isMaxAssets = currentAssetsCount >= 20;

  return (
    <GlassCard variant="default" padding="md" className="mb-6" allowOverflow={true}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Add New Asset</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Assets:</span>
          <span className={`text-sm font-medium ${isMaxAssets ? 'text-red-400' : 'text-gray-400'}`}>
            {currentAssetsCount}/20
          </span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 overflow-visible">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Symbol
            <span className="ml-1 text-gray-500 cursor-help group/tooltip relative">
              ⓘ
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg" style={{zIndex: 1000}}>
                Enter the ticker symbol<br/>for the asset to add
              </span>
            </span>
          </label>
          <div className="relative">
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
        </div>
        
        <div className="flex gap-3">
          <div className="w-28 sm:w-32 relative">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Target %
              <span className="ml-1 text-gray-500 cursor-help group/tooltip relative">
                ⓘ
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg" style={{zIndex: 1000}}>
                  Target allocation percentage<br/>for this asset in your portfolio
                  {enableSelling && (<><br/><span className="text-emerald-400">0% allowed when selling enabled</span></>)}
                </span>
              </span>
            </label>
            <input
              type="number"
              placeholder="Target"
              value={targetPercentage}
              onChange={(e) => setTargetPercentage(e.target.value)}
              onWheel={preventNumberInputScroll}
              className="glass-input w-full pr-8 font-medium tabular-nums"
              step="0.1"
              min={enableSelling ? "0" : "0.1"}
              max="100"
              disabled={isMaxAssets}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
          </div>
          
          <button
            type="submit"
            className={`
              px-3 sm:px-4 py-2 sm:py-3 font-medium rounded-lg transition-all duration-300 self-end text-sm sm:text-base
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
        </div>
      </form>
      
      {isMaxAssets && (
        <div className="mt-3 glass-light border-red-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 text-sm">Maximum of 20 assets reached</p>
        </div>
      )}
      
    </GlassCard>
  );
};

export default AddAsset;