import React from 'react';
import { Asset, AllocationResult } from '../types';
import AnimatedNumber from './AnimatedNumber';
import { getDisplayName } from '../utils/displayNames';
import { THRESHOLDS } from '../constants';

interface ResultPanelProps {
  allocations: AllocationResult[];
  assetsBySymbol: Map<string, Asset>;
  assets: Asset[];
  currentTotal: number;
  newTotal: number;
  enableSelling: boolean;
  showShareSuccess: boolean;
  onShare: () => void;
  onShowAllocate: () => void;
}

function getDriftStatus(absDiff: number): { dotClass: string; driftClass: string } {
  if (absDiff >= THRESHOLDS.ALLOCATION_SLIGHTLY_OFF) {
    return { dotClass: 'off', driftClass: 'drift-off' };
  }
  if (absDiff >= THRESHOLDS.ALLOCATION_ON_TARGET) {
    return { dotClass: 'close', driftClass: 'drift-warn' };
  }
  return { dotClass: 'on-target', driftClass: 'drift-ok' };
}

const ResultPanel: React.FC<ResultPanelProps> = ({
  allocations,
  assetsBySymbol,
  assets,
  currentTotal,
  newTotal,
  enableSelling,
  showShareSuccess,
  onShare,
  onShowAllocate,
}) => {
  const hasLockedAssets = assets.some(a => a.noSell);

  return (
    <>
      <div
        className="flex items-baseline justify-between pb-3 mb-1 border-b-2 transition-colors duration-200"
        style={{ borderColor: 'var(--text)' }}
      >
        <h2 className="section-title-sm">Result</h2>
        <button onClick={onShare} className="copy-btn relative">
          Copy
          {showShareSuccess && (
            <span
              className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded-sm whitespace-nowrap"
              style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}
            >
              Copied!
            </span>
          )}
        </button>
      </div>

      {!enableSelling && (
        <div
          className="flex gap-4 py-2.5 border-b mb-1 transition-colors duration-200"
          style={{ borderColor: 'var(--rule)' }}
        >
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            <span className="legend-dot on-target"></span>
            On target
          </span>
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            <span className="legend-dot close"></span>
            Close
          </span>
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            <span className="legend-dot off"></span>
            Off
          </span>
        </div>
      )}

      {enableSelling && (
        <div
          className="flex items-center gap-2 py-2.5 border-b mb-1 transition-colors duration-200"
          style={{ borderColor: 'var(--rule)' }}
        >
          <span className="result-dot on-target"></span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {hasLockedAssets
              ? 'Assets balanced (some locked from selling)'
              : 'All assets perfectly balanced at target'
            }
          </span>
        </div>
      )}

      <div className="space-y-0">
        {allocations.map((allocation) => {
          const asset = assetsBySymbol.get(allocation.symbol);
          const currentPercentage = currentTotal > 0 ? ((asset?.currentValue || 0) / currentTotal) * 100 : 0;
          const absDiff = Math.abs(allocation.difference);
          const { dotClass, driftClass } = getDriftStatus(absDiff);

          return (
            <div
              key={allocation.symbol}
              className="grid grid-cols-[1fr_auto] items-baseline py-3 border-b transition-colors duration-200"
              style={{ borderColor: 'var(--rule)' }}
            >
              <div className="flex items-center gap-2">
                <span className={`result-dot ${dotClass}`}></span>
                <span
                  className="text-sm transition-colors duration-200"
                  style={{ letterSpacing: '0.02em' }}
                >
                  {getDisplayName(allocation.symbol)}
                </span>
              </div>
              <div className="text-right">
                <div className="font-medium tabular-nums" style={{ fontSize: '15px' }}>
                  <AnimatedNumber value={allocation.newValue} prefix="$" className="" />
                </div>
                <div
                  className="text-xs tabular-nums mt-0.5 transition-colors duration-200"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {currentPercentage.toFixed(1)}%
                  <span className="mx-1">→</span>
                  {allocation.newPercentage.toFixed(1)}%
                  <span className={`ml-1 ${driftClass}`}>
                    ({allocation.difference > 0 ? '+' : ''}{allocation.difference.toFixed(1)}%)
                  </span>
                </div>
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
            New Total
          </span>
          <span
            className="font-serif text-xl tabular-nums"
            style={{ fontFamily: 'Instrument Serif, Georgia, serif' }}
          >
            <AnimatedNumber value={newTotal} prefix="$" className="" />
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t transition-colors duration-200" style={{ borderColor: 'var(--rule)' }}>
        <button
          onClick={onShowAllocate}
          className="text-xs transition-colors duration-200 hover:underline"
          style={{ color: 'var(--text-tertiary)' }}
        >
          ← Show allocation
        </button>
      </div>
    </>
  );
};

export default React.memo(ResultPanel);
