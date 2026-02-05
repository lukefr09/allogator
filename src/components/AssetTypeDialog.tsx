import React, { useEffect, useRef, useCallback } from 'react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-type-dialog-title"
      ref={dialogRef}
    >
      <div
        className="max-w-md w-full p-6 rounded-sm transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--rule)'
        }}
      >
        <h3
          id="asset-type-dialog-title"
          className="section-title-sm mb-4"
        >
          Select Asset Type for {symbol.toUpperCase()}
        </h3>

        <p
          className="text-sm mb-6 transition-colors duration-200"
          style={{ color: 'var(--text-secondary)' }}
        >
          This symbol could be either a stock or cryptocurrency. Please select which one you meant:
        </p>

        <div className="space-y-2">
          <button
            ref={firstFocusableRef}
            onClick={onSelectStock}
            className="w-full p-4 text-left rounded-sm border transition-all duration-200 hover:bg-[var(--bg-subtle)] group"
            style={{ borderColor: 'var(--rule)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">
                  Stock ({symbol.toUpperCase()})
                </h4>
                <p
                  className="text-sm mt-1 transition-colors duration-200"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Trade as a traditional stock/ETF
                </p>
              </div>
              <svg
                className="w-5 h-5 transition-colors duration-200"
                style={{ color: 'var(--text-tertiary)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {cryptoInfo && (
            <>
              <button
                onClick={() => onSelectCrypto('binance')}
                className="w-full p-4 text-left rounded-sm border transition-all duration-200 hover:bg-[var(--bg-subtle)] group"
                style={{ borderColor: 'var(--rule)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">
                      {cryptoInfo.name} on Binance
                    </h4>
                    <p
                      className="text-sm mt-1 transition-colors duration-200"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      Trade as cryptocurrency on Binance exchange
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 transition-colors duration-200"
                    style={{ color: 'var(--text-tertiary)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {hasCoinbase && (
                <button
                  onClick={() => onSelectCrypto('coinbase')}
                  className="w-full p-4 text-left rounded-sm border transition-all duration-200 hover:bg-[var(--bg-subtle)] group"
                  style={{ borderColor: 'var(--rule)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {cryptoInfo.name} on Coinbase
                      </h4>
                      <p
                        className="text-sm mt-1 transition-colors duration-200"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Trade as cryptocurrency on Coinbase exchange
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 transition-colors duration-200"
                      style={{ color: 'var(--text-tertiary)' }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
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
          className="btn-outline w-full mt-6"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AssetTypeDialog;
