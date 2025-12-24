import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Asset, AllocationResult, ViewMode } from '../types';
import { validatePortfolio, calculateTotalPercentage } from '../utils/validation';
import { calculateAllocations } from '../utils/calculations';
import { priceService } from '../services/priceService';
import { decodePortfolioFromUrl } from '../utils/urlSharing';
import { isAmbiguousSymbol, getCryptoSymbol, isCryptoAlias } from '../utils/cryptoAliases';
import { LIMITS, PRECISION, TIMINGS } from '../constants';

const defaultAssets: Asset[] = [
  { symbol: 'VOO', currentValue: 600, targetPercentage: 0.50 },
  { symbol: 'QQQ', currentValue: 300, targetPercentage: 0.30 },
  { symbol: 'NVDA', currentValue: 100, targetPercentage: 0.20 }
];

interface DisambiguationDialog {
  index: number;
  symbol: string;
  field: 'symbol' | 'add';
  newAsset?: Omit<Asset, 'currentValue'>;
}

interface UsePortfolioReturn {
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  newMoney: number;
  setNewMoney: React.Dispatch<React.SetStateAction<number>>;
  enableSelling: boolean;
  setEnableSelling: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  allocations: AllocationResult[];
  validationErrors: string[];
  totalPercentage: number;
  currentTotal: number;
  newTotal: number;
  priceError: string | undefined;
  isLoadingPrices: boolean;
  lastPriceUpdate: string | undefined;
  disambiguationDialog: DisambiguationDialog | null;
  handleAddAsset: (newAsset: Omit<Asset, 'currentValue'>) => Promise<void>;
  handleUpdateAsset: (index: number, field: keyof Asset, value: number | string | boolean) => Promise<void>;
  handleRemoveAsset: (index: number) => void;
  handleRefreshPrices: () => Promise<void>;
  handleDisambiguationChoice: (choice: 'stock' | 'crypto', exchange?: 'binance' | 'coinbase') => Promise<void>;
  setDisambiguationDialog: React.Dispatch<React.SetStateAction<DisambiguationDialog | null>>;
}

function getInitialState() {
  const portfolioData = decodePortfolioFromUrl();
  if (portfolioData) {
    return {
      assets: portfolioData.assets,
      newMoney: portfolioData.newMoney,
      enableSelling: portfolioData.enableSelling
    };
  }
  return {
    assets: defaultAssets,
    newMoney: 1000,
    enableSelling: false
  };
}

export function usePortfolio(): UsePortfolioReturn {
  const initialState = getInitialState();

  const [assets, setAssets] = useState<Asset[]>(initialState.assets);
  const [newMoney, setNewMoney] = useState(initialState.newMoney);
  const [enableSelling, setEnableSelling] = useState(initialState.enableSelling);
  const [viewMode, setViewMode] = useState<ViewMode>('money');
  const [allocations, setAllocations] = useState<AllocationResult[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [priceError, setPriceError] = useState<string | undefined>();
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | undefined>();
  const [disambiguationDialog, setDisambiguationDialog] = useState<DisambiguationDialog | null>(null);

  const hasInitializedRef = useRef(false);

  const totalPercentage = useMemo(() => calculateTotalPercentage(assets), [assets]);
  const currentTotal = useMemo(() => assets.reduce((sum, asset) => sum + asset.currentValue, 0), [assets]);
  const newTotal = useMemo(() => currentTotal + newMoney, [currentTotal, newMoney]);

  // Validation and allocation calculation
  useEffect(() => {
    const validation = validatePortfolio(assets, enableSelling);
    setValidationErrors(validation.errors);

    if (validation.isValid && newMoney > 0) {
      const results = calculateAllocations(assets, newMoney, enableSelling);
      setAllocations(results);
    } else {
      setAllocations([]);
    }
  }, [assets, newMoney, enableSelling]);

  const handleRefreshPrices = useCallback(async () => {
    const symbols = assets.map(asset => asset.symbol).filter(symbol => symbol.trim() !== '');
    if (symbols.length === 0) return;

    setIsLoadingPrices(true);
    setPriceError(undefined);

    try {
      const priceData = await priceService.fetchMultiplePrices(symbols);

      const updatedAssets = assets.map(asset => {
        const data = priceData.get(asset.symbol);
        if (data) {
          const updatedAsset = {
            ...asset,
            currentPrice: data.price,
            lastUpdated: data.timestamp,
            priceSource: 'api' as const
          };

          if (updatedAsset.shares && updatedAsset.shares > 0 && data.price > 0) {
            updatedAsset.currentValue = Math.round((updatedAsset.shares * data.price) * PRECISION.MONEY_MULTIPLIER) / PRECISION.MONEY_MULTIPLIER;
          } else if (updatedAsset.currentValue > 0 && data.price > 0) {
            updatedAsset.shares = Math.round((updatedAsset.currentValue / data.price) * PRECISION.SHARE_MULTIPLIER) / PRECISION.SHARE_MULTIPLIER;
          }

          return updatedAsset;
        }
        return asset;
      });

      const failedSymbols = symbols.filter(symbol => !priceData.get(symbol));
      if (failedSymbols.length > 0) {
        setPriceError(`Unable to fetch prices for: ${failedSymbols.join(', ')}. Enter prices manually.`);
      }

      setAssets(updatedAssets);
      setLastPriceUpdate(new Date().toISOString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to fetch prices. Please enter them manually.';
      setPriceError(errorMessage);
      console.error('Price fetch error:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  }, [assets]);

  // Initial price fetch
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setTimeout(() => {
        if (assets.length > 0 && assets.some(a => a.symbol.trim() !== '')) {
          handleRefreshPrices();
        }
      }, TIMINGS.INITIAL_PRICE_FETCH_DELAY_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleRefreshPrices]);

  const handleAddAsset = useCallback(async (newAsset: Omit<Asset, 'currentValue'>) => {
    if (assets.length >= LIMITS.MAX_ASSETS) return;

    const symbol = newAsset.symbol.trim().toUpperCase();

    if (isAmbiguousSymbol(symbol)) {
      setDisambiguationDialog({
        index: assets.length,
        symbol,
        field: 'add',
        newAsset
      });
      return;
    }

    let finalSymbol = symbol;
    if (isCryptoAlias(symbol)) {
      const cryptoSymbol = getCryptoSymbol(symbol, 'binance');
      if (cryptoSymbol) {
        finalSymbol = cryptoSymbol;
      }
    }

    const assetWithDefaults: Asset = { ...newAsset, symbol: finalSymbol, currentValue: 0 };

    if (finalSymbol !== '') {
      const priceData = await priceService.fetchPrice(finalSymbol);
      if (priceData) {
        const assetWithPrice: Asset = {
          ...assetWithDefaults,
          currentPrice: priceData.price,
          lastUpdated: priceData.timestamp,
          priceSource: 'api'
        };
        setAssets(prev => [...prev, assetWithPrice]);
        setLastPriceUpdate(new Date().toISOString());
      } else {
        setAssets(prev => [...prev, assetWithDefaults]);
      }
    } else {
      setAssets(prev => [...prev, assetWithDefaults]);
    }
  }, [assets.length]);

  const handleUpdateAsset = useCallback(async (index: number, field: keyof Asset, value: number | string | boolean) => {
    const updated = [...assets];

    if (field === 'symbol') {
      const newSymbol = (value as string).trim().toUpperCase();

      if (isAmbiguousSymbol(newSymbol)) {
        setDisambiguationDialog({ index, symbol: newSymbol, field: 'symbol' });
        return;
      }

      let finalSymbol = newSymbol;
      if (isCryptoAlias(newSymbol)) {
        const cryptoSymbol = getCryptoSymbol(newSymbol, 'binance');
        if (cryptoSymbol) {
          finalSymbol = cryptoSymbol;
        }
      }

      const oldSymbol = updated[index].symbol;
      updated[index].symbol = finalSymbol;

      if (oldSymbol !== finalSymbol && finalSymbol.trim() !== '') {
        setIsLoadingPrices(true);
        setPriceError(undefined);

        try {
          const priceData = await priceService.fetchPrice(finalSymbol);
          if (priceData) {
            updated[index].currentPrice = priceData.price;
            updated[index].lastUpdated = priceData.timestamp;
            updated[index].priceSource = 'api';

            if (updated[index].currentValue > 0 && priceData.price > 0) {
              updated[index].shares = Math.round((updated[index].currentValue / priceData.price) * PRECISION.SHARE_MULTIPLIER) / PRECISION.SHARE_MULTIPLIER;
            }

            setLastPriceUpdate(new Date().toISOString());
          } else {
            updated[index].currentPrice = undefined;
            updated[index].lastUpdated = undefined;
            updated[index].priceSource = undefined;
            updated[index].shares = undefined;
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${finalSymbol}:`, error);
          const errorMessage = error instanceof Error ? error.message : `Unable to fetch price for ${finalSymbol}. Enter price manually.`;
          setPriceError(errorMessage);
        } finally {
          setIsLoadingPrices(false);
        }
      } else if (finalSymbol.trim() === '') {
        updated[index].currentPrice = undefined;
        updated[index].lastUpdated = undefined;
        updated[index].priceSource = undefined;
        updated[index].shares = undefined;
      }
    } else if (field === 'currentValue') {
      updated[index].currentValue = value as number;
      if (updated[index].currentPrice && updated[index].currentPrice > 0) {
        updated[index].shares = Math.round(((value as number) / updated[index].currentPrice!) * PRECISION.SHARE_MULTIPLIER) / PRECISION.SHARE_MULTIPLIER;
      }
    } else if (field === 'shares') {
      updated[index].shares = value as number;
      if (updated[index].currentPrice && updated[index].currentPrice > 0) {
        updated[index].currentValue = Math.round(((value as number) * updated[index].currentPrice!) * PRECISION.MONEY_MULTIPLIER) / PRECISION.MONEY_MULTIPLIER;
      }
    } else if (field === 'targetPercentage') {
      updated[index].targetPercentage = value as number;
    } else if (field === 'currentPrice') {
      updated[index].currentPrice = value as number;
      if ((value as number) > 0) {
        if (updated[index].shares && updated[index].shares > 0) {
          updated[index].currentValue = Math.round((updated[index].shares! * (value as number)) * PRECISION.MONEY_MULTIPLIER) / PRECISION.MONEY_MULTIPLIER;
        } else if (updated[index].currentValue > 0) {
          updated[index].shares = Math.round((updated[index].currentValue / (value as number)) * PRECISION.SHARE_MULTIPLIER) / PRECISION.SHARE_MULTIPLIER;
        }
      }
    } else if (field === 'lastUpdated') {
      updated[index].lastUpdated = value as string;
    } else if (field === 'priceSource') {
      updated[index].priceSource = value as 'api' | 'manual';
    } else if (field === 'noSell') {
      updated[index].noSell = value as boolean;
    }

    setAssets(updated);
  }, [assets]);

  const handleRemoveAsset = useCallback((index: number) => {
    setAssets(prev => {
      if (prev.length <= LIMITS.MIN_ASSETS) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleDisambiguationChoice = useCallback(async (choice: 'stock' | 'crypto', exchange?: 'binance' | 'coinbase') => {
    if (!disambiguationDialog) return;

    const { index, symbol, field, newAsset } = disambiguationDialog;

    if (field === 'add' && newAsset) {
      let finalSymbol = symbol;
      if (choice === 'crypto' && exchange) {
        const cryptoSymbol = getCryptoSymbol(symbol, exchange);
        if (cryptoSymbol) {
          finalSymbol = cryptoSymbol;
        }
      }

      const assetWithDefaults: Asset = { ...newAsset, symbol: finalSymbol, currentValue: 0 };

      if (finalSymbol !== '') {
        const priceData = await priceService.fetchPrice(finalSymbol);
        if (priceData) {
          const assetWithPrice: Asset = {
            ...assetWithDefaults,
            currentPrice: priceData.price,
            lastUpdated: priceData.timestamp,
            priceSource: 'api'
          };
          setAssets(prev => [...prev, assetWithPrice]);
          setLastPriceUpdate(new Date().toISOString());
        } else {
          setAssets(prev => [...prev, assetWithDefaults]);
        }
      } else {
        setAssets(prev => [...prev, assetWithDefaults]);
      }
    } else if (field === 'symbol') {
      let finalSymbol = symbol;
      if (choice === 'crypto' && exchange) {
        const cryptoSymbol = getCryptoSymbol(symbol, exchange);
        if (cryptoSymbol) {
          finalSymbol = cryptoSymbol;
        }
      }

      const updated = [...assets];
      updated[index].symbol = finalSymbol;

      if (finalSymbol !== '') {
        setIsLoadingPrices(true);
        setPriceError(undefined);

        try {
          const priceData = await priceService.fetchPrice(finalSymbol);
          if (priceData) {
            updated[index].currentPrice = priceData.price;
            updated[index].lastUpdated = priceData.timestamp;
            updated[index].priceSource = 'api';

            if (updated[index].currentValue > 0 && priceData.price > 0) {
              updated[index].shares = Math.round((updated[index].currentValue / priceData.price) * PRECISION.SHARE_MULTIPLIER) / PRECISION.SHARE_MULTIPLIER;
            }

            setLastPriceUpdate(new Date().toISOString());
          } else {
            updated[index].currentPrice = undefined;
            updated[index].lastUpdated = undefined;
            updated[index].priceSource = undefined;
            updated[index].shares = undefined;
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${finalSymbol}:`, error);
          const errorMessage = error instanceof Error ? error.message : `Unable to fetch price for ${finalSymbol}. Enter price manually.`;
          setPriceError(errorMessage);
        } finally {
          setIsLoadingPrices(false);
        }
      }

      setAssets(updated);
    }

    setDisambiguationDialog(null);
  }, [disambiguationDialog, assets]);

  return {
    assets,
    setAssets,
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
  };
}
