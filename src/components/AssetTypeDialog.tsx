import React, { useEffect, useRef, useCallback } from 'react';
import GlassCard from './GlassCard';
import { cryptoAliases } from '../utils/cryptoAliases';

interface AssetTypeDialogProps {
  symbol: string;
  onSelectStock: () => void;
  onSelectCrypto: (exchange: 'binance' | 'coinbase') => void;
  onCancel: () => void;
}

const AssetTypeDialog: React.FC<AssetTypeDialogProps> = ({
  symbol,
  onSelectStock,
  onSelectCrypto,
  onCancel
}) => {
  const cryptoInfo = cryptoAliases[symbol.toUpperCase()];
  const hasCoinbase = cryptoInfo?.coinbase !== undefined;
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
      return;
    }

    if (e.key === 'Tab' && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, [onCancel]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    firstFocusableRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-type-dialog-title"
      ref={dialogRef}
    >
      <GlassCard variant="dark" padding="lg" className="max-w-md w-full">
        <h3 id="asset-type-dialog-title" className="text-xl font-semibold text-gray-100 mb-4">
          Select Asset Type for {symbol.toUpperCase()}
        </h3>
        
        <p className="text-gray-400 mb-6">
          This symbol could be either a stock or cryptocurrency. Please select which one you meant:
        </p>

        <div className="space-y-3">
          <button
            ref={firstFocusableRef}
            onClick={onSelectStock}
            className="w-full p-4 rounded-lg glass-light hover:bg-white/10 transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-100 group-hover:text-white">
                  Stock ({symbol.toUpperCase()})
                </h4>
                <p className="text-sm text-gray-400 mt-1">
                  Trade as a traditional stock/ETF
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {cryptoInfo && (
            <>
              <button
                onClick={() => onSelectCrypto('binance')}
                className="w-full p-4 rounded-lg glass-light hover:bg-white/10 transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-100 group-hover:text-white">
                      {cryptoInfo.name} on Binance
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Trade as cryptocurrency on Binance exchange
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {hasCoinbase && (
                <button
                  onClick={() => onSelectCrypto('coinbase')}
                  className="w-full p-4 rounded-lg glass-light hover:bg-white/10 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-100 group-hover:text-white">
                        {cryptoInfo.name} on Coinbase
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Trade as cryptocurrency on Coinbase exchange
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              )}
            </>
          )}
        </div>

        <button
          onClick={onCancel}
          className="mt-6 w-full py-3 rounded-lg glass-light hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-gray-300"
        >
          Cancel
        </button>
      </GlassCard>
    </div>
  );
};

export default AssetTypeDialog;