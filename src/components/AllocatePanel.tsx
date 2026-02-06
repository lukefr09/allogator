import React from 'react';
import { Asset, AllocationResult } from '../types';
import AnimatedNumber from './AnimatedNumber';
import { getDisplayName } from '../utils/displayNames';

interface AllocatePanelProps {
  allocations: AllocationResult[];
  assetsBySymbol: Map<string, Asset>;
  newMoney: number;
  enableSelling: boolean;
  showSharesInAllocation: boolean;
  onToggleShares: () => void;
  onShowResult: () => void;
}

const AllocatePanel: React.FC<AllocatePanelProps> = ({
  allocations,
  assetsBySymbol,
  newMoney,
  enableSelling,
  showSharesInAllocation,
  onToggleShares,
  onShowResult,
}) => {
  const netTotal = allocations.reduce((sum, a) => sum + a.amountToAdd, 0);
  const buyTotal = allocations.filter(a => a.amountToAdd > 0).reduce((sum, a) => sum + a.amountToAdd, 0);
  const sellTotal = Math.abs(allocations.filter(a => a.amountToAdd < 0).reduce((sum, a) => sum + a.amountToAdd, 0));

  return (
    <>
      <div
        className="flex items-baseline justify-between pb-3 mb-4 border-b-2 transition-colors duration-200"
        style={{ borderColor: 'var(--accent)' }}
      >
        <h2 className="section-title-sm">Allocate</h2>
        <span className="allocate-amount">
          <AnimatedNumber value={newMoney} prefix="$" className="" />
        </span>
      </div>

      <div className="space-y-0">
        {allocations.map((allocation) => {
          const asset = assetsBySymbol.get(allocation.symbol);
          const shares = asset?.currentPrice && asset.currentPrice > 0
            ? Math.abs(allocation.amountToAdd) / asset.currentPrice
            : null;
          const isSelling = allocation.amountToAdd < 0;

          return (
            <div
              key={allocation.symbol}
              className="flex justify-between items-baseline py-2.5 border-b transition-colors duration-200"
              style={{ borderColor: 'var(--rule)' }}
            >
              <span
                className="text-sm transition-colors duration-200"
                style={{ color: 'var(--text)', letterSpacing: '0.02em' }}
              >
                {getDisplayName(allocation.symbol)}
              </span>
              <div className="flex items-baseline gap-2">
                {isSelling && (
                  <span className="text-xs" style={{ color: 'var(--negative)' }}>Sell</span>
                )}
                <span className={`allocate-value ${isSelling ? 'sell' : ''}`}>
                  <AnimatedNumber value={Math.abs(allocation.amountToAdd)} prefix="$" className="" />
                </span>
                {showSharesInAllocation && shares !== null && (
                  <span
                    className="text-xs transition-colors duration-200"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    ({shares < 1 ? shares.toFixed(4) : shares.toFixed(2)})
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <div
          className="flex justify-between items-baseline pt-3.5 mt-1 border-t-2 transition-colors duration-200"
          style={{ borderColor: 'var(--rule-strong)' }}
        >
          <span
            className="font-medium text-xs uppercase tracking-wider transition-colors duration-200"
            style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}
          >
            {enableSelling ? 'Net' : 'Total'}
          </span>
          <span className="allocate-value" style={{ fontSize: '16px' }}>
            <AnimatedNumber value={netTotal} prefix="$" className="" />
          </span>
        </div>

        {enableSelling && (
          <div
            className="text-xs mt-1 text-right transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Buy: ${buyTotal.toFixed(2)} | Sell: ${sellTotal.toFixed(2)}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t transition-colors duration-200" style={{ borderColor: 'var(--rule)' }}>
        <button
          onClick={onToggleShares}
          className="text-xs transition-colors duration-200 hover:underline"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {showSharesInAllocation ? 'Hide' : 'Show'} shares
        </button>
        <button
          onClick={onShowResult}
          className="text-xs transition-colors duration-200 hover:underline"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Show result breakdown →
        </button>
      </div>
    </>
  );
};

export default React.memo(AllocatePanel);
