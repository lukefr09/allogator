import React from 'react';

interface HeaderProps {
  newMoney: number;
  onNewMoneyChange: (value: number) => void;
}

const Header: React.FC<HeaderProps> = ({ newMoney, onNewMoneyChange }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass border-white/10 px-4 sm:px-6 py-4 sm:py-5 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl flex items-center justify-center shadow-lg" style={{backgroundColor: 'rgb(107, 208, 157)'}}>
                <span className="text-lg sm:text-xl">🐊</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-100">Allogator</h1>
                <p className="text-xs text-gray-400 hidden sm:block">Optimize your investment allocations with precision</p>
              </div>
            </div>
            
            {/* New Money Input */}
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <label className="text-xs sm:text-sm font-semibold text-gray-300 whitespace-nowrap relative">
                New Money
                <span className="ml-1 text-gray-500 cursor-help group/tooltip relative">
                  ⓘ
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg" style={{zIndex: 1000}}>
                    Amount you want to invest<br/>in your portfolio today
                  </span>
                </span>
              </label>
              <div className="relative flex-1 sm:flex-initial">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
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
                  className="glass-input w-full sm:w-40 pl-8 text-base font-semibold tabular-nums"
                  step="0.01"
                  min="0.01"
                  max="1000000"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;