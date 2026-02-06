import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Asset, AllocationResult, ViewMode } from '../types';
import { validatePortfolio, calculateTotalPercentage } from '../utils/validation';
import { calculateAllocations } from '../utils/calculations';
import { priceService } from '../services/priceService';
import { decodePortfolioFromUrl } from '../utils/urlSharing';
import { isAmbiguousSymbol, getCryptoSymbol, isCryptoAlias } from '../utils/cryptoAliases';
import { LIMITS, TIMINGS } from '../constants';
import {
  applyPriceToAsset,
  clearAssetPriceFields,
  calculateSharesFromValue,
  createAssetWithDefaults,
} from '../utils/assetHelpers';

const STORAGE_KEY = 'allogator-portfolio';

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

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.assets && Array.isArray(parsed.assets) && parsed.assets.length >= LIMITS.MIN_ASSETS) {
        return {
          assets: parsed.assets,
          newMoney: typeof parsed.newMoney === 'number' ? parsed.newMoney : 1000,
          enableSelling: typeof parsed.enableSelling === 'boolean' ? parsed.enableSelling : false
        };
      }
    }
  } catch {
    // Ignore localStorage errors
  }

  return {
    assets: defaultAssets,
    newMoney: 1000,
    enableSelling: false
  };
}

function resolveSymbol(rawSymbol: string, choice?: 'stock' | 'crypto', exchange?: 'binance' | 'coinbase'): string {
  const symbol = rawSymbol.trim().toUpperCase();

  if (choice === 'crypto' && exchange) {
    const cryptoSymbol = getCryptoSymbol(symbol, exchange);
    if (cryptoSymbol) return cryptoSymbol;
  }

  if (isCryptoAlias(symbol)) {
    const cryptoSymbol = getCryptoSymbol(symbol, 'binance');
    if (cryptoSymbol) return cryptoSymbol;
  }

  return symbol;
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
  const handleRefreshPricesRef = useRef<(() => Promise<void>) | null>(null);

  const totalPercentage = useMemo(() => calculateTotalPercentage(assets), [assets]);
  const currentTotal = useMemo(() => assets.reduce((sum, asset) => sum + asset.currentValue, 0), [assets]);
  const newTotal = useMemo(() => currentTotal + newMoney, [currentTotal, newMoney]);

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        assets,
        newMoney,
        enableSelling
      }));
    } catch {
      // Ignore localStorage errors
    }
  }, [assets, newMoney, enableSelling]);

  const fetchPriceAndUpdateAsset = useCallback(async (
    asset: Asset,
    symbol: string
  ): Promise<Asset> => {
    const priceData = await priceService.fetchPrice(symbol);
    if (priceData) {
      return applyPriceToAsset({ ...asset, symbol }, priceData);
    }
    return { ...asset, symbol };
  }, []);

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
          return applyPriceToAsset(asset, data);
        }
        return asset;
      });

      const failedSymbols = symbols.filter(symbol => !priceData.get(symbol));
      if (failedSymbols.length > 0) {
        setPriceError(`Unable to fetch prices for: ${failedSymbols.join(', ')}.`);
      }

      setAssets(updatedAssets);
      setLastPriceUpdate(new Date().toISOString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to fetch prices.';
      setPriceError(errorMessage);
      console.error('Price fetch error:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  }, [assets]);

  useEffect(() => {
    handleRefreshPricesRef.current = handleRefreshPrices;
  }, [handleRefreshPrices]);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setTimeout(() => {
        handleRefreshPricesRef.current?.();
      }, TIMINGS.INITIAL_PRICE_FETCH_DELAY_MS);
    }
  }, []);

  const addAssetWithPrice = useCallback(async (newAsset: Omit<Asset, 'currentValue'>, finalSymbol: string) => {
    const asset = createAssetWithDefaults(newAsset, finalSymbol);

    if (finalSymbol !== '') {
      const updatedAsset = await fetchPriceAndUpdateAsset(asset, finalSymbol);
      setAssets(prev => [...prev, updatedAsset]);
      if (updatedAsset.currentPrice) {
        setLastPriceUpdate(new Date().toISOString());
      }
    } else {
      setAssets(prev => [...prev, asset]);
    }
  }, [fetchPriceAndUpdateAsset]);

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

    const finalSymbol = resolveSymbol(symbol);
    await addAssetWithPrice(newAsset, finalSymbol);
  }, [assets.length, addAssetWithPrice]);

  const updateSymbolWithPrice = useCallback(async (index: number, newSymbol: string) => {
    const updated = [...assets];
    const oldSymbol = updated[index].symbol;
    updated[index].symbol = newSymbol;

    if (oldSymbol !== newSymbol && newSymbol.trim() !== '') {
      setIsLoadingPrices(true);
      setPriceError(undefined);

      try {
        const priceData = await priceService.fetchPrice(newSymbol);
        if (priceData) {
          updated[index] = applyPriceToAsset(updated[index], priceData);
          if (updated[index].currentValue > 0 && priceData.price > 0) {
            updated[index].shares = calculateSharesFromValue(updated[index].currentValue, priceData.price);
          }
          setLastPriceUpdate(new Date().toISOString());
        } else {
          updated[index] = clearAssetPriceFields(updated[index]);
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${newSymbol}:`, error);
        const errorMessage = error instanceof Error ? error.message : `Unable to fetch price for ${newSymbol}. Enter price manually.`;
        setPriceError(errorMessage);
      } finally {
        setIsLoadingPrices(false);
      }
    } else if (newSymbol.trim() === '') {
      updated[index] = clearAssetPriceFields(updated[index]);
    }

    setAssets(updated);
  }, [assets]);

  const handleUpdateAsset = useCallback(async (index: number, field: keyof Asset, value: number | string | boolean) => {
    if (index < 0 || index >= assets.length) return;

    if (field === 'symbol') {
      const newSymbol = (value as string).trim().toUpperCase();

      if (isAmbiguousSymbol(newSymbol)) {
        setDisambiguationDialog({ index, symbol: newSymbol, field: 'symbol' });
        return;
      }

      const finalSymbol = resolveSymbol(newSymbol);
      await updateSymbolWithPrice(index, finalSymbol);
      return;
    }

    const updated = [...assets];
    const asset = updated[index];

    if (field === 'currentValue') {
      asset.currentValue = value as number;
      if (asset.currentPrice && asset.currentPrice > 0) {
        asset.shares = calculateSharesFromValue(value as number, asset.currentPrice);
      }
    } else if (field === 'shares') {
      asset.shares = value as number;
      if (asset.currentPrice && asset.currentPrice > 0) {
        asset.currentValue = Math.round((value as number) * asset.currentPrice * 100) / 100;
      }
    } else if (field === 'targetPercentage') {
      asset.targetPercentage = value as number;
    } else if (field === 'currentPrice') {
      asset.currentPrice = value as number;
      if ((value as number) > 0) {
        if (asset.shares && asset.shares > 0) {
          asset.currentValue = Math.round(asset.shares * (value as number) * 100) / 100;
        } else if (asset.currentValue > 0) {
          asset.shares = calculateSharesFromValue(asset.currentValue, value as number);
        }
      }
    } else if (field === 'lastUpdated') {
      asset.lastUpdated = value as string;
    } else if (field === 'priceSource') {
      asset.priceSource = value as 'api' | 'manual';
    } else if (field === 'noSell') {
      asset.noSell = value as boolean;
    }

    setAssets(updated);
  }, [assets, updateSymbolWithPrice]);

  const handleRemoveAsset = useCallback((index: number) => {
    setAssets(prev => {
      if (index < 0 || index >= prev.length) return prev;
      if (prev.length <= LIMITS.MIN_ASSETS) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleDisambiguationChoice = useCallback(async (choice: 'stock' | 'crypto', exchange?: 'binance' | 'coinbase') => {
    if (!disambiguationDialog) return;

    const { index, symbol, field, newAsset } = disambiguationDialog;
    const finalSymbol = resolveSymbol(symbol, choice, exchange);

    if (field === 'add' && newAsset) {
      await addAssetWithPrice(newAsset, finalSymbol);
    } else if (field === 'symbol') {
      if (index >= 0 && index < assets.length) {
        await updateSymbolWithPrice(index, finalSymbol);
      }
    }

    setDisambiguationDialog(null);
  }, [disambiguationDialog, assets.length, addAssetWithPrice, updateSymbolWithPrice]);

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
