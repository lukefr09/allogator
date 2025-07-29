import React, { useState } from 'react';
import { Asset } from '../types';

interface AddAssetProps {
  onAddAsset: (asset: Omit<Asset, 'currentValue'>) => void;
  currentAssetsCount: number;
}

const AddAsset: React.FC<AddAssetProps> = ({ onAddAsset, currentAssetsCount }) => {
  const [symbol, setSymbol] = useState('');
  const [targetPercentage, setTargetPercentage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentAssetsCount >= 20) {
      alert('Maximum of 20 assets allowed');
      return;
    }

    const percentage = parseFloat(targetPercentage);
    if (!symbol || isNaN(percentage) || percentage <= 0 || percentage > 100) {
      alert('Please enter a valid symbol and percentage (0-100)');
      return;
    }

    onAddAsset({
      symbol: symbol.toUpperCase(),
      targetPercentage: percentage / 100
    });

    setSymbol('');
    setTargetPercentage('');
  };

  return (
    <div className="bg-gray-800 p-4 rounded mb-6">
      <h3 className="text-lg font-semibold mb-3">Add New Asset</h3>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          placeholder="Symbol (e.g., SPY)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-700 rounded text-white"
          maxLength={10}
        />
        <input
          type="number"
          placeholder="Target %"
          value={targetPercentage}
          onChange={(e) => setTargetPercentage(e.target.value)}
          className="w-24 px-3 py-2 bg-gray-700 rounded text-white"
          step="0.1"
          min="0.1"
          max="100"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium transition-colors"
          disabled={currentAssetsCount >= 20}
        >
          Add Asset
        </button>
      </form>
      {currentAssetsCount >= 20 && (
        <p className="text-red-400 text-sm mt-2">Maximum of 20 assets reached</p>
      )}
    </div>
  );
};

export default AddAsset;