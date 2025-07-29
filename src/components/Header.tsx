import React, { useRef } from 'react';
import { SavedPortfolio } from '../types';

interface HeaderProps {
  portfolioName: string;
  activePortfolioId: string | null;
  savedPortfolios: SavedPortfolio[];
  isSaving: boolean;
  onPortfolioNameChange: (name: string) => void;
  onSavePortfolio: () => void;
  onLoadPortfolio: (id: string) => void;
  onDeletePortfolio: (id: string) => void;
  onExportPortfolio: () => void;
  onImportPortfolio: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Header: React.FC<HeaderProps> = ({
  portfolioName,
  activePortfolioId,
  savedPortfolios,
  isSaving,
  onPortfolioNameChange,
  onSavePortfolio,
  onLoadPortfolio,
  onDeletePortfolio,
  onExportPortfolio,
  onImportPortfolio,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass border-white/10 px-6 py-5 rounded-2xl">
          {/* Top Row */}
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg animate-float">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-100">Portfolio Rebalancer</h1>
                <p className="text-xs text-gray-400">Optimize your investment allocations with precision</p>
              </div>
            </div>
            
            {/* Portfolio Name Input */}
            <div className="flex items-center gap-4 flex-1 max-w-md mx-8">
              <input
                type="text"
                value={portfolioName}
                onChange={(e) => onPortfolioNameChange(e.target.value)}
                className="glass-input flex-1 text-sm font-medium"
                placeholder="Portfolio Name"
                maxLength={50}
              />
              
              <select
                value={activePortfolioId || ''}
                onChange={(e) => e.target.value && onLoadPortfolio(e.target.value)}
                className="glass-input w-48 text-sm"
              >
                <option value="">Select portfolio...</option>
                {savedPortfolios.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onSavePortfolio}
                disabled={isSaving}
                className="btn-primary text-sm min-w-[80px]"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <svg className="w-4 h-4 animate-spin mr-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                ) : (
                  activePortfolioId ? 'Update' : 'Save'
                )}
              </button>
              
              {activePortfolioId && (
                <button
                  onClick={() => onDeletePortfolio(activePortfolioId)}
                  className="p-2 glass-hover rounded-lg text-red-400 hover:bg-red-500/10"
                  title="Delete Portfolio"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              
              <div className="w-px h-6 bg-white/10 mx-1" />
              
              <button
                onClick={onExportPortfolio}
                disabled={!activePortfolioId}
                className="glass-hover p-2 rounded-lg text-gray-300 hover:text-white disabled:opacity-50 disabled:hover:text-gray-300"
                title="Export Portfolio"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={onImportPortfolio}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={savedPortfolios.length >= 3}
                className="glass-hover p-2 rounded-lg text-gray-300 hover:text-white disabled:opacity-50 disabled:hover:text-gray-300"
                title={savedPortfolios.length >= 3 ? "Maximum 3 portfolios allowed" : "Import Portfolio"}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
              
              {savedPortfolios.length >= 3 && (
                <span className="text-xs text-yellow-400 ml-2">Max 3 portfolios</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;