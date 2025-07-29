import React from 'react';
import { ViewMode } from '../types';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="flex items-center gap-2 glass-light px-3 py-2 rounded-lg">
      <span className="text-xs text-gray-400 font-medium">View:</span>
      <div className="flex bg-gray-800 rounded-md p-0.5">
        <button
          onClick={() => onViewModeChange('money')}
          className={`px-3 py-1 text-xs font-medium rounded transition-all duration-200 ${
            viewMode === 'money'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          $ Money
        </button>
        <button
          onClick={() => onViewModeChange('shares')}
          className={`px-3 py-1 text-xs font-medium rounded transition-all duration-200 ${
            viewMode === 'shares'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          # Shares
        </button>
      </div>
    </div>
  );
};

export default ViewModeToggle;