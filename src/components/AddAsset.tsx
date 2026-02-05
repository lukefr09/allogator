import React, { useState, useRef } from 'react';
import { Asset } from '../types';
import { LIMITS } from '../constants';
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

    if (currentAssetsCount >= LIMITS.MAX_ASSETS) {
      return;
    }

    const percentage = parseFloat(targetPercentage);
    const minPercentage = enableSelling ? 0 : 0.1;
    if (!symbol || isNaN(percentage) || percentage < minPercentage || percentage > 100) {
      return;
    }

    setIsAdding(true);

    const addAsset = async () => {
      await onAddAsset({
        symbol: symbol.toUpperCase(),
        targetPercentage: percentage / 100
      });

      setTimeout(() => {
        setSymbol('');
        setTargetPercentage('');
        setIsAdding(false);
        symbolInputRef.current?.focus();
      }, 100);
    };

    addAsset();
  };

  const isMaxAssets = currentAssetsCount >= LIMITS.MAX_ASSETS;

  return (
    <div
      className="border-t pt-4 flex flex-wrap items-center gap-3 transition-colors duration-200"
      style={{ borderColor: 'var(--rule)' }}
    >
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
        <input
          ref={symbolInputRef}
          type="text"
          placeholder="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="input-dashed w-28 uppercase font-medium"
          maxLength={10}
          disabled={isMaxAssets}
        />

        <div className="relative">
          <input
            type="number"
            placeholder="Target %"
            value={targetPercentage}
            onChange={(e) => setTargetPercentage(e.target.value)}
            onWheel={preventNumberInputScroll}
            className="input-dashed w-24 pr-6 tabular-nums"
            step="0.1"
            min={enableSelling ? "0" : "0.1"}
            max="100"
            disabled={isMaxAssets}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)' }}
          >
            %
          </span>
        </div>

        <button
          type="submit"
          className="btn-outline relative"
          disabled={isMaxAssets || isAdding || !symbol || !targetPercentage}
        >
          <span className={`transition-opacity duration-200 ${isAdding ? 'opacity-0' : 'opacity-100'}`}>
            Add
          </span>
          {isAdding && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-4 h-4 animate-spin" style={{ color: 'var(--text)' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </button>
      </form>

      <span
        className="text-xs ml-auto transition-colors duration-200"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {currentAssetsCount} / {LIMITS.MAX_ASSETS}
      </span>

      {isMaxAssets && (
        <span className="text-xs" style={{ color: 'var(--negative)' }}>
          Maximum assets reached
        </span>
      )}
    </div>
  );
};

export default AddAsset;
