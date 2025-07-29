import React from 'react';
import { Asset } from '../types';

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
  const isValidTotal = Math.abs(totalPercentage - 100) < 0.01;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Portfolio Assets</h2>
        <div className={`text-sm font-medium ${isValidTotal ? 'text-green-400' : 'text-red-400'}`}>
          Total: {totalPercentage.toFixed(1)}%
        </div>
      </div>
      
      {assets.length < 2 && (
        <div className="text-yellow-400 text-sm mb-3">
          ⚠️ Minimum 2 assets required
        </div>
      )}
      
      <div className="space-y-3">
        {assets.map((asset, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded flex gap-3 items-center">
            <div className="flex-1">
              <input
                type="text"
                value={asset.symbol}
                onChange={(e) => onUpdateAsset(index, 'symbol', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white font-medium"
                placeholder="Symbol"
              />
            </div>
            
            <div className="w-32">
              <input
                type="number"
                value={asset.currentValue}
                onChange={(e) => onUpdateAsset(index, 'currentValue', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white"
                placeholder="Current $"
                step="0.01"
                min="0"
              />
            </div>
            
            <div className="w-24">
              <div className="relative">
                <input
                  type="number"
                  value={(asset.targetPercentage * 100).toFixed(1)}
                  onChange={(e) => onUpdateAsset(index, 'targetPercentage', (parseFloat(e.target.value) || 0) / 100)}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white pr-8"
                  placeholder="Target"
                  step="0.1"
                  min="0"
                  max="100"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
            </div>
            
            <button
              onClick={() => onRemoveAsset(index)}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
              disabled={assets.length <= 2}
              title={assets.length <= 2 ? "Minimum 2 assets required" : "Remove asset"}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      
      {!isValidTotal && (
        <div className="mt-3 text-red-400 text-sm">
          ⚠️ Target percentages must total 100%
        </div>
      )}
    </div>
  );
};

export default AssetList;