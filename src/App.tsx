import { useState, useCallback, useMemo } from 'react';
import Header from './components/Header';
import AddAsset from './components/AddAsset';
import AssetList from './components/AssetList';
import Footer from './components/Footer';
import AnimatedNumber from './components/AnimatedNumber';
import AssetTypeDialog from './components/AssetTypeDialog';
import { usePortfolio } from './hooks/usePortfolio';
import { encodePortfolioToUrl, copyToClipboard } from './utils/urlSharing';
import { getDisplayName } from './utils/displayNames';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const PortfolioRebalancer = () => {
  const {
    assets,
    newMoney,
    setNewMoney,
    enableSelling,
    setEnableSelling,
    viewMode,
    setViewMode,
    allocations,
    validationErrors,
    totalPercentage,
    currentTotal,
    newTotal,
    priceError,
    isLoadingPrices,
    lastPriceUpdate,
    disambiguationDialog,
    handleAddAsset,
    handleUpdateAsset,
    handleRemoveAsset,
    handleRefreshPrices,
    handleDisambiguationChoice,
    setDisambiguationDialog,
  } = usePortfolio();

  // Create O(1) lookup map to avoid O(n) find() calls inside render loops
  const assetsBySymbol = useMemo(
    () => new Map(assets.map(a => [a.symbol, a])),
    [assets]
  );

  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [showSharesInAllocation, setShowSharesInAllocation] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<'allocate' | 'result'>('allocate');

  const handleShare = useCallback(async () => {
    const url = encodePortfolioToUrl(assets, newMoney, enableSelling);
    const success = await copyToClipboard(url);
    if (success) {
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 3000);
    }
  }, [assets, newMoney, enableSelling]);

  return (
    <>
      <Header
        newMoney={newMoney}
        onNewMoneyChange={setNewMoney}
        enableSelling={enableSelling}
        onEnableSellingChange={setEnableSelling}
      />

      <main className="max-w-[1120px] mx-auto px-5 md:px-12 py-10">
        <div className="grid lg:grid-cols-[1fr_340px] gap-16 items-start">
          {/* Left Column - Positions */}
          <div className="space-y-0">
            <AssetList
              assets={assets}
              onUpdateAsset={handleUpdateAsset}
              onRemoveAsset={handleRemoveAsset}
              totalPercentage={totalPercentage}
              onRefreshPrices={handleRefreshPrices}
              lastPriceUpdate={lastPriceUpdate}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              priceError={priceError}
              isLoadingPrices={isLoadingPrices}
              enableSelling={enableSelling}
            />

            <AddAsset
              onAddAsset={handleAddAsset}
              currentAssetsCount={assets.length}
              enableSelling={enableSelling}
            />
          </div>

          {/* Right Column - Allocate & Result */}
          <div className="lg:sticky lg:top-10 space-y-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="banner banner-error" role="alert" aria-live="assertive" aria-atomic="true">
                <div className="font-medium mb-1">Validation Errors</div>
                <ul className="text-sm space-y-0.5">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationErrors.length === 0 && allocations.length > 0 && (
              <section>
                {/* Allocate View */}
                {rightPanelView === 'allocate' && (
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

                      {/* Total row */}
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
                          <AnimatedNumber
                            value={allocations.reduce((sum, a) => sum + a.amountToAdd, 0)}
                            prefix="$"
                            className=""
                          />
                        </span>
                      </div>
                      {enableSelling && (
                        <div
                          className="text-xs mt-1 text-right transition-colors duration-200"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          Buy: ${allocations.filter(a => a.amountToAdd > 0).reduce((sum, a) => sum + a.amountToAdd, 0).toFixed(2)} |
                          Sell: ${Math.abs(allocations.filter(a => a.amountToAdd < 0).reduce((sum, a) => sum + a.amountToAdd, 0)).toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Footer links */}
                    <div className="flex justify-between items-center mt-4 pt-3 border-t transition-colors duration-200" style={{ borderColor: 'var(--rule)' }}>
                      <button
                        onClick={() => setShowSharesInAllocation(!showSharesInAllocation)}
                        className="text-xs transition-colors duration-200 hover:underline"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {showSharesInAllocation ? 'Hide' : 'Show'} shares
                      </button>
                      <button
                        onClick={() => setRightPanelView('result')}
                        className="text-xs transition-colors duration-200 hover:underline"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Show result breakdown →
                      </button>
                    </div>
                  </>
                )}

                {/* Result View */}
                {rightPanelView === 'result' && (
                  <>
                    <div
                      className="flex items-baseline justify-between pb-3 mb-1 border-b-2 transition-colors duration-200"
                      style={{ borderColor: 'var(--text)' }}
                    >
                      <h2 className="section-title-sm">Result</h2>
                      <button onClick={handleShare} className="copy-btn relative">
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

                    {/* Legend */}
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
                          {assets.some(a => a.noSell)
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

                        let dotClass = 'on-target';
                        let driftClass = 'drift-ok';

                        if (absDiff >= 2) {
                          dotClass = 'off';
                          driftClass = 'drift-off';
                        } else if (absDiff >= 0.5) {
                          dotClass = 'close';
                          driftClass = 'drift-warn';
                        }

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

                      {/* New Total row */}
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

                    {/* Footer link */}
                    <div className="mt-4 pt-3 border-t transition-colors duration-200" style={{ borderColor: 'var(--rule)' }}>
                      <button
                        onClick={() => setRightPanelView('allocate')}
                        className="text-xs transition-colors duration-200 hover:underline"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        ← Show allocation
                      </button>
                    </div>
                  </>
                )}
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer onShare={handleShare} />

      {disambiguationDialog && (
        <AssetTypeDialog
          symbol={disambiguationDialog.symbol}
          onSelectStock={() => handleDisambiguationChoice('stock')}
          onSelectCrypto={(exchange) => handleDisambiguationChoice('crypto', exchange)}
          onCancel={() => setDisambiguationDialog(null)}
        />
      )}
      <Analytics />
      <SpeedInsights />
    </>
  );
};

export default PortfolioRebalancer;
