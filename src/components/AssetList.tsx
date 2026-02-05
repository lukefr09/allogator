import React, { useState, memo } from 'react';
import { Asset, ViewMode } from '../types';
import ViewModeToggle from './ViewModeToggle';
import Skeleton from './Skeleton';
import { formatCurrency } from '../utils/formatters';
import { getDisplayName } from '../utils/displayNames';
import { preventNumberInputScroll } from '../utils/preventNumberScroll';

interface AssetListProps {
  assets: Asset[];
  onUpdateAsset: (index: number, field: keyof Asset, value: number | string | boolean) => void;
  onRemoveAsset: (index: number) => void;
  totalPercentage: number;
  onRefreshPrices?: () => void;
  lastPriceUpdate?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  priceError?: string;
  isLoadingPrices?: boolean;
  enableSelling?: boolean;
}

const AssetList: React.FC<AssetListProps> = memo(({
  assets,
  onUpdateAsset,
  onRemoveAsset,
  totalPercentage,
  onRefreshPrices,
  lastPriceUpdate,
  viewMode,
  onViewModeChange,
  priceError,
  isLoadingPrices = false,
  enableSelling = false
}) => {
  const [manualPriceIndex, setManualPriceIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isValidTotal = Math.abs(totalPercentage - 100) < 0.01;
  const currentTotal = assets.reduce((sum, asset) => sum + asset.currentValue, 0);

  return (
    <div className="animate-fade-up">
      {/* Error banner */}
      {priceError && (
        <div className="banner banner-error" role="alert" aria-live="polite">
          {priceError}
        </div>
      )}

      {/* Section Header */}
      <div
        className="flex items-baseline justify-between mb-5 pb-3 border-b-2 transition-colors duration-200"
        style={{ borderColor: 'var(--text)' }}
      >
        <div className="flex items-baseline gap-4">
          <h2 className="section-title">Positions</h2>
          <span
            className="text-sm tabular-nums transition-colors duration-200"
            style={{ color: 'var(--text-secondary)' }}
          >
            {formatCurrency(currentTotal)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {lastPriceUpdate && (
            <div className="flex items-center gap-2">
              <span
                className="text-xs tabular-nums transition-colors duration-200"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {new Date(lastPriceUpdate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
              {onRefreshPrices && (
                <button
                  onClick={async () => {
                    setIsRefreshing(true);
                    await onRefreshPrices();
                    setIsRefreshing(false);
                  }}
                  disabled={isRefreshing || isLoadingPrices}
                  className="p-1 rounded-sm transition-colors duration-200 hover:bg-[var(--bg-subtle)]"
                  style={{ color: 'var(--text-tertiary)' }}
                  title={isLoadingPrices ? "Loading prices..." : "Refresh prices"}
                  aria-label={isLoadingPrices ? "Loading prices" : "Refresh prices"}
                >
                  <svg
                    className={`w-3 h-3 ${isRefreshing || isLoadingPrices ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          )}
          <span className={`total-badge ${!isValidTotal ? 'over' : ''}`}>
            {totalPercentage.toFixed(1)}%
          </span>
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>
      </div>

      {/* Positions Table */}
      <table className="positions-table w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th
              className="text-left pb-2 font-medium transition-colors duration-200"
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-tertiary)'
              }}
            >
              Symbol
            </th>
            <th
              className="text-left pb-2 pl-4 font-medium transition-colors duration-200"
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-tertiary)'
              }}
            >
              {viewMode === 'money' ? 'Value' : 'Shares'}
            </th>
            <th
              className="text-left pb-2 pl-4 font-medium transition-colors duration-200"
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-tertiary)'
              }}
            >
              Target
            </th>
            <th
              className="text-left pb-2 pl-4 font-medium transition-colors duration-200 hidden md:table-cell"
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-tertiary)'
              }}
            >
              Current
            </th>
            {enableSelling && (
              <th
                className="text-center pb-2 font-medium transition-colors duration-200"
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-tertiary)'
                }}
              >
                Lock
              </th>
            )}
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset, index) => {
            const currentAllocation = currentTotal > 0 ? (asset.currentValue / currentTotal) * 100 : 0;

            return (
              <tr
                key={index}
                className="group border-t transition-colors duration-150 hover:bg-[var(--bg-subtle)]"
                style={{ borderColor: 'var(--rule)' }}
              >
                {/* Symbol Cell */}
                <td className="py-3 align-middle">
                  <div className="font-medium" style={{ fontSize: '15px', letterSpacing: '0.02em' }}>
                    <input
                      type="text"
                      defaultValue={getDisplayName(asset.symbol)}
                      key={`symbol-${index}-${asset.symbol}`}
                      onBlur={(e) => {
                        const newSymbol = e.target.value.toUpperCase();
                        const currentDisplayName = getDisplayName(asset.symbol).toUpperCase();
                        if (newSymbol !== currentDisplayName) {
                          onUpdateAsset(index, 'symbol', newSymbol);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="editable-value text-left w-24 font-medium uppercase"
                      style={{ paddingLeft: 0 }}
                      placeholder="AAPL"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 min-h-[18px]">
                    {isLoadingPrices && !asset.currentPrice ? (
                      <Skeleton width="60px" height="12px" />
                    ) : manualPriceIndex === index ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="Price"
                          defaultValue={asset.currentPrice || ''}
                          className="input-dashed text-xs px-2 py-0.5 w-16"
                          step="0.01"
                          onWheel={preventNumberInputScroll}
                          autoFocus
                          onBlur={(e) => {
                            const price = parseFloat(e.currentTarget.value);
                            if (price > 0) {
                              onUpdateAsset(index, 'currentPrice', price);
                              onUpdateAsset(index, 'priceSource', 'manual');
                              onUpdateAsset(index, 'lastUpdated', new Date().toISOString());
                            }
                            setManualPriceIndex(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                              setManualPriceIndex(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => setManualPriceIndex(null)}
                          className="text-xs px-1 transition-colors duration-200"
                          style={{ color: 'var(--text-tertiary)' }}
                          aria-label="Cancel price edit"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <span
                          className="text-xs transition-colors duration-200"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {asset.currentPrice ? formatCurrency(asset.currentPrice) : '—'}
                          {asset.currentPrice && asset.priceSource === 'manual' && ' (manual)'}
                        </span>
                        <button
                          onClick={() => setManualPriceIndex(index)}
                          className={`text-xs transition-opacity px-1 ${asset.currentPrice ? 'opacity-0 group-hover:opacity-100' : 'opacity-50 hover:opacity-100'}`}
                          style={{ color: 'var(--text-tertiary)' }}
                          title="Set price manually"
                          aria-label="Set price manually"
                        >
                          ✎
                        </button>
                      </>
                    )}
                  </div>
                </td>

                {/* Value/Shares Cell */}
                <td className="py-3 pl-4 align-middle">
                  {viewMode === 'money' ? (
                    <div className="relative inline-flex items-center">
                      <span
                        className="absolute left-1.5 text-sm transition-colors duration-200"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        $
                      </span>
                      <input
                        type="number"
                        defaultValue={asset.currentValue.toString()}
                        key={`value-${index}-${asset.currentValue}`}
                        onWheel={preventNumberInputScroll}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          onUpdateAsset(index, 'currentValue', numValue);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        className="editable-value text-left pl-5 w-28"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  ) : (
                    <div className="relative inline-flex items-center">
                      <span
                        className="absolute left-1.5 text-sm transition-colors duration-200"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        #
                      </span>
                      <input
                        type="number"
                        defaultValue={asset.shares ? (Math.round(asset.shares * 1000000) / 1000000).toString() : ''}
                        key={`shares-${index}-${asset.shares}`}
                        onWheel={preventNumberInputScroll}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            onUpdateAsset(index, 'shares', 0);
                          } else {
                            let numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              numValue = Math.round(numValue * 1000000) / 1000000;
                              onUpdateAsset(index, 'shares', numValue);
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        className="editable-value text-left pl-5 w-28"
                        placeholder="0.000"
                        step="0.000001"
                        min="0"
                        disabled={!asset.currentPrice}
                      />
                    </div>
                  )}
                </td>

                {/* Target Cell */}
                <td className="py-3 pl-4 align-middle">
                  <div className="inline-flex items-center">
                    <input
                      type="number"
                      defaultValue={(asset.targetPercentage * 100).toFixed(1)}
                      key={`target-${index}-${asset.targetPercentage}`}
                      onWheel={preventNumberInputScroll}
                      onBlur={(e) => {
                        const numValue = parseFloat(e.target.value) || 0;
                        onUpdateAsset(index, 'targetPercentage', numValue / 100);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="editable-value text-left w-16"
                      placeholder="0.0"
                      step="0.1"
                      min={enableSelling ? "0" : "0.1"}
                      max="100"
                    />
                    <span
                      className="text-sm ml-1 transition-colors duration-200"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      %
                    </span>
                  </div>
                </td>

                {/* Current Allocation Cell */}
                <td
                  className="py-3 pl-4 align-middle tabular-nums hidden md:table-cell"
                  style={{ color: 'var(--text-secondary)', fontSize: '14px' }}
                >
                  {currentAllocation.toFixed(1)}%
                </td>

                {/* Lock Cell (only when selling enabled) */}
                {enableSelling && (
                  <td className="py-3 align-middle text-center">
                    <button
                      onClick={() => onUpdateAsset(index, 'noSell', !asset.noSell)}
                      className={`w-6 h-6 rounded-sm flex items-center justify-center transition-all duration-200 ${
                        asset.noSell
                          ? 'bg-[var(--accent)] text-white'
                          : 'border hover:border-[var(--text-secondary)]'
                      }`}
                      style={{
                        borderColor: asset.noSell ? 'transparent' : 'var(--rule-strong)'
                      }}
                      title={asset.noSell ? 'Asset locked - no selling' : 'Click to lock'}
                      aria-label={asset.noSell ? 'Unlock asset' : 'Lock asset'}
                    >
                      {asset.noSell && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </td>
                )}

                {/* Remove Cell */}
                <td className="py-3 align-middle text-right">
                  <button
                    onClick={() => onRemoveAsset(index)}
                    className="remove-btn"
                    disabled={assets.length <= 2}
                    title={assets.length <= 2 ? "Minimum 2 assets required" : "Remove asset"}
                    aria-label={assets.length <= 2 ? "Cannot remove - minimum 2 assets required" : `Remove ${asset.symbol || 'asset'}`}
                    style={{
                      opacity: assets.length <= 2 ? 0.3 : undefined,
                      cursor: assets.length <= 2 ? 'not-allowed' : undefined
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Validation warning */}
      {!isValidTotal && (
        <div className="banner banner-error mt-4" role="alert" aria-live="polite">
          Target percentages must total 100% (currently {totalPercentage.toFixed(1)}%)
        </div>
      )}

      {assets.length < 2 && (
        <div className="banner banner-warning mt-4" role="alert">
          Minimum 2 assets required for a portfolio
        </div>
      )}
    </div>
  );
});

AssetList.displayName = 'AssetList';

export default AssetList;
