import React from 'react';
import ThemeToggle from './ThemeToggle';
import { preventNumberInputScroll } from '../utils/preventNumberScroll';

interface HeaderProps {
  newMoney: number;
  onNewMoneyChange: (value: number) => void;
  enableSelling?: boolean;
  onEnableSellingChange?: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  newMoney,
  onNewMoneyChange,
  enableSelling = false,
  onEnableSellingChange
}) => {
  return (
    <header
      className="px-5 md:px-12 py-5 flex items-center justify-between border-b transition-colors duration-200"
      style={{ borderColor: 'var(--rule)' }}
    >
      {/* Logo */}
      <div className="flex items-baseline gap-3">
        <span className="logo-mark">Allogator</span>
        <span className="logo-subtitle hidden sm:inline">Portfolio Rebalancer</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Invest Input */}
        <div className="flex items-center gap-2 md:gap-3">
          <span className="field-label hidden sm:inline">Invest</span>
          <div className="relative flex items-center">
            <span
              className="absolute left-3 text-sm pointer-events-none transition-colors duration-200"
              style={{ color: 'var(--text-tertiary)' }}
            >
              $
            </span>
            <input
              type="number"
              value={newMoney}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                if (value >= 0.01 && value <= 1000000) {
                  onNewMoneyChange(parseFloat(value.toFixed(2)));
                } else if (value < 0.01) {
                  onNewMoneyChange(0.01);
                } else if (value > 1000000) {
                  onNewMoneyChange(1000000);
                }
              }}
              onWheel={preventNumberInputScroll}
              className="input-standard w-28 md:w-32 pl-7"
              step="0.01"
              min="0.01"
              max="1000000"
            />
          </div>
        </div>

        {/* Sell Toggle */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => onEnableSellingChange?.(!enableSelling)}
        >
          <span className="field-label hidden sm:inline">Selling</span>
          <div className={`toggle-track ${enableSelling ? 'active' : ''}`}>
            <div className="toggle-knob" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);
