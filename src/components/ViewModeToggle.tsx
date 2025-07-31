import React from 'react';
import { ViewMode } from '../types';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="flex bg-gray-800/50 rounded-md p-0.5 border border-gray-700 relative group">
      {/* Hover tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-xs text-gray-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[999] shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span>💵</span>
            <span>Money</span>
          </span>
          <span className="text-gray-500">|</span>
          <span className="flex items-center gap-1">
            <span>#</span>
            <span>Shares</span>
          </span>
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
      </div>
      
      <button
        onClick={() => onViewModeChange('money')}
        className={`px-1.5 sm:px-2 py-1 text-xs sm:text-sm rounded transition-all duration-200 flex items-center gap-1 ${
          viewMode === 'money'
            ? 'bg-blue-500/20 text-blue-400 shadow-sm'
            : 'text-gray-500 hover:text-gray-400'
        }`}
        title="View in dollar values"
      >
        💵
      </button>
      <button
        onClick={() => onViewModeChange('shares')}
        className={`px-1.5 sm:px-2 py-1 text-xs sm:text-sm rounded transition-all duration-200 flex items-center gap-1 ${
          viewMode === 'shares'
            ? 'bg-blue-500/20 text-blue-400 shadow-sm'
            : 'text-gray-500 hover:text-gray-400'
        }`}
        title="View in share counts"
      >
        #
      </button>
    </div>
  );
};

export default ViewModeToggle;