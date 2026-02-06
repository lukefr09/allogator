import { useState, useCallback, useMemo } from 'react';
import Header from './components/Header';
import AddAsset from './components/AddAsset';
import AssetList from './components/AssetList';
import Footer from './components/Footer';
import AssetTypeDialog from './components/AssetTypeDialog';
import AllocatePanel from './components/AllocatePanel';
import ResultPanel from './components/ResultPanel';
import { usePortfolio } from './hooks/usePortfolio';
import { encodePortfolioToUrl, copyToClipboard } from './utils/urlSharing';
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

          <div className="lg:sticky lg:top-10 space-y-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
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
                {rightPanelView === 'allocate' ? (
                  <AllocatePanel
                    allocations={allocations}
                    assetsBySymbol={assetsBySymbol}
                    newMoney={newMoney}
                    enableSelling={enableSelling}
                    showSharesInAllocation={showSharesInAllocation}
                    onToggleShares={() => setShowSharesInAllocation(!showSharesInAllocation)}
                    onShowResult={() => setRightPanelView('result')}
                  />
                ) : (
                  <ResultPanel
                    allocations={allocations}
                    assetsBySymbol={assetsBySymbol}
                    assets={assets}
                    currentTotal={currentTotal}
                    newTotal={newTotal}
                    enableSelling={enableSelling}
                    showShareSuccess={showShareSuccess}
                    onShare={handleShare}
                    onShowAllocate={() => setRightPanelView('allocate')}
                  />
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
