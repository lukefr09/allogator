import React, { useState, useEffect, useRef } from 'react';
import { Asset, AllocationResult, SavedPortfolio } from './types';
import AddAsset from './components/AddAsset';
import AssetList from './components/AssetList';
import { validatePortfolio, calculateTotalPercentage } from './utils/validation';
import { calculateAllocations } from './utils/calculations';
import { 
  getStorageData, 
  savePortfolio, 
  loadPortfolio, 
  deletePortfolio,
  setActivePortfolio,
  exportPortfolio,
  importPortfolio
} from './utils/storage';

const PortfolioRebalancer = () => {
  const defaultAssets: Asset[] = [
    { symbol: 'QQQ', currentValue: 1708.80, targetPercentage: 0.50 },
    { symbol: 'NVDA', currentValue: 533.22, targetPercentage: 0.20 },
    { symbol: 'SMH', currentValue: 585.20, targetPercentage: 0.10 },
    { symbol: 'VEU', currentValue: 0, targetPercentage: 0.10 },
    { symbol: 'BTC', currentValue: 197.00, targetPercentage: 0.10 }
  ];
  
  const [assets, setAssets] = useState<Asset[]>(defaultAssets);
  const [newMoney, setNewMoney] = useState(1000);
  const [allocations, setAllocations] = useState<AllocationResult[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [portfolioName, setPortfolioName] = useState('Main');
  const [activePortfolioId, setActivePortfolioIdState] = useState<string | null>(null);
  const [savedPortfolios, setSavedPortfolios] = useState<SavedPortfolio[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const totalPercentage = calculateTotalPercentage(assets);
  
  useEffect(() => {
    const storage = getStorageData();
    setSavedPortfolios(storage.portfolios);
    
    if (storage.activePortfolioId) {
      const portfolio = loadPortfolio(storage.activePortfolioId);
      if (portfolio) {
        setAssets(portfolio.assets);
        setNewMoney(portfolio.newMoney);
        setPortfolioName(portfolio.name);
        setActivePortfolioIdState(portfolio.id);
      }
    }
  }, []);
  
  useEffect(() => {
    const validation = validatePortfolio(assets);
    setValidationErrors(validation.errors);
    
    if (validation.isValid && newMoney > 0) {
      const results = calculateAllocations(assets, newMoney);
      setAllocations(results);
    } else {
      setAllocations([]);
    }
  }, [assets, newMoney]);
  
  const handleAddAsset = (newAsset: Omit<Asset, 'currentValue'>) => {
    if (assets.length >= 20) return;
    
    setAssets([...assets, { ...newAsset, currentValue: 0 }]);
  };
  
  const handleUpdateAsset = (index: number, field: keyof Asset, value: number | string) => {
    const updated = [...assets];
    if (field === 'symbol') {
      updated[index].symbol = value as string;
    } else if (field === 'currentValue') {
      updated[index].currentValue = value as number;
    } else if (field === 'targetPercentage') {
      updated[index].targetPercentage = value as number;
    }
    setAssets(updated);
  };
  
  const handleRemoveAsset = (index: number) => {
    if (assets.length <= 2) return;
    setAssets(assets.filter((_, i) => i !== index));
  };
  
  const currentTotal = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const newTotal = currentTotal + newMoney;
  
  const handleSavePortfolio = () => {
    setIsSaving(true);
    const result = savePortfolio(portfolioName, assets, newMoney, activePortfolioId || undefined);
    
    if (result.success) {
      const storage = getStorageData();
      setSavedPortfolios(storage.portfolios);
      if (result.id && !activePortfolioId) {
        setActivePortfolioIdState(result.id);
      }
    } else {
      alert(result.error || 'Failed to save portfolio');
    }
    
    setIsSaving(false);
  };
  
  const handleLoadPortfolio = (portfolioId: string) => {
    const portfolio = loadPortfolio(portfolioId);
    if (portfolio) {
      setAssets(portfolio.assets);
      setNewMoney(portfolio.newMoney);
      setPortfolioName(portfolio.name);
      setActivePortfolioIdState(portfolio.id);
      setActivePortfolio(portfolio.id);
    }
  };
  
  const handleDeletePortfolio = (portfolioId: string) => {
    if (confirm('Are you sure you want to delete this portfolio?')) {
      deletePortfolio(portfolioId);
      const storage = getStorageData();
      setSavedPortfolios(storage.portfolios);
      
      if (portfolioId === activePortfolioId) {
        if (storage.portfolios.length > 0) {
          handleLoadPortfolio(storage.portfolios[0].id);
        } else {
          setAssets(defaultAssets);
          setNewMoney(1000);
          setPortfolioName('Main');
          setActivePortfolioIdState(null);
        }
      }
    }
  };
  
  const handleExportPortfolio = () => {
    if (activePortfolioId) {
      const portfolio = loadPortfolio(activePortfolioId);
      if (portfolio) {
        exportPortfolio(portfolio);
      }
    }
  };
  
  const handleImportPortfolio = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const result = await importPortfolio(file);
      if (result.success && result.portfolio) {
        const storage = getStorageData();
        setSavedPortfolios(storage.portfolios);
        handleLoadPortfolio(result.portfolio.id);
      } else {
        alert(result.error || 'Failed to import portfolio');
      }
      event.target.value = '';
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Portfolio Rebalancing Calculator</h1>
      
      <div className="mb-6 bg-gray-800 p-4 rounded">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Portfolio Name</label>
            <input
              type="text"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded text-white"
              maxLength={50}
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Saved Portfolios</label>
            <select
              value={activePortfolioId || ''}
              onChange={(e) => e.target.value && handleLoadPortfolio(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded text-white"
            >
              <option value="">Select a portfolio...</option>
              {savedPortfolios.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={handleSavePortfolio}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : (activePortfolioId ? 'Update' : 'Save')}
          </button>
          
          {activePortfolioId && (
            <button
              onClick={() => handleDeletePortfolio(activePortfolioId)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
            >
              Delete
            </button>
          )}
          
          <button
            onClick={handleExportPortfolio}
            disabled={!activePortfolioId}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white disabled:opacity-50"
          >
            Export JSON
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportPortfolio}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={savedPortfolios.length >= 3}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white disabled:opacity-50"
          >
            Import JSON
          </button>
          
          {savedPortfolios.length >= 3 && (
            <span className="text-sm text-yellow-400 self-center">Max 3 portfolios allowed</span>
          )}
        </div>
      </div>
      
      <AssetList
        assets={assets}
        onUpdateAsset={handleUpdateAsset}
        onRemoveAsset={handleRemoveAsset}
        totalPercentage={totalPercentage}
      />
      
      <AddAsset
        onAddAsset={handleAddAsset}
        currentAssetsCount={assets.length}
      />
      
      <div className="mb-8 bg-gray-800 p-4 rounded">
        <label className="block text-lg font-medium mb-2">New Money to Invest</label>
        <input
          type="number"
          value={newMoney}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            if (value >= 0.01 && value <= 1000000) {
              setNewMoney(value);
            } else if (value < 0.01) {
              setNewMoney(0.01);
            } else if (value > 1000000) {
              setNewMoney(1000000);
            }
          }}
          className="w-full px-3 py-2 bg-gray-700 rounded text-white text-lg"
          step="0.01"
          min="0.01"
          max="1000000"
        />
        <div className="text-xs text-gray-400 mt-1">
          Enter amount between $0.01 and $1,000,000
        </div>
      </div>
      
      {validationErrors.length > 0 && (
        <div className="mb-6 bg-red-900/20 border border-red-600 rounded p-4">
          <h3 className="text-red-400 font-semibold mb-2">Validation Errors:</h3>
          <ul className="list-disc list-inside text-red-300 text-sm">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {validationErrors.length === 0 && allocations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">How to Allocate ${newMoney.toFixed(2)}</h2>
          <div className="bg-gray-800 p-4 rounded">
            {allocations.map(allocation => (
              <div key={allocation.symbol} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                <span className="font-medium">{allocation.symbol}</span>
                <span className="text-green-400 font-mono">${allocation.amountToAdd.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-600">
              <span className="font-bold">Total</span>
              <span className="text-green-400 font-mono font-bold">
                ${allocations.reduce((sum, a) => sum + a.amountToAdd, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {validationErrors.length === 0 && allocations.length > 0 && (
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-semibold mb-3">After Investment</h3>
          <div className="text-xs text-gray-400 mb-2">
            <span className="text-green-400">✓</span> On target (±0.5%) • 
            <span className="text-yellow-400 ml-2">○</span> Slightly off (±2%) • 
            <span className="text-red-400 ml-2">⚠</span> Needs rebalancing (&gt;2%)
          </div>
          <div className="space-y-2">
            {allocations.map(allocation => {
              const absDiff = Math.abs(allocation.difference);
              let diffColor = 'text-green-400';
              let statusIcon = '✓';
              
              if (absDiff >= 2) {
                diffColor = 'text-red-400';
                statusIcon = '⚠';
              } else if (absDiff >= 0.5) {
                diffColor = 'text-yellow-400';
                statusIcon = '○';
              }
              
              return (
                <div key={allocation.symbol} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`${diffColor} text-sm`}>{statusIcon}</span>
                    <span>{allocation.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono">${allocation.newValue.toFixed(2)}</span>
                    <div className="flex items-center justify-end gap-2 text-sm">
                      <span className="text-gray-400">
                        {allocation.newPercentage.toFixed(1)}%
                      </span>
                      <span className="text-gray-500">→</span>
                      <span className="text-gray-300">
                        {allocation.targetPercentage.toFixed(1)}%
                      </span>
                      <span className={`${diffColor} font-medium`}>
                        ({allocation.difference > 0 ? '+' : ''}{allocation.difference.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="pt-3 mt-3 border-t border-gray-700">
              <div className="flex justify-between font-bold">
                <span>New Total</span>
                <span className="font-mono">${newTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioRebalancer;